// ============================================================
// CivicConnect - Centralized Authentication & API Client
// ============================================================
// This file manages:
//   - JWT token storage and validation
//   - Automatic token refresh with request queuing
//   - Authenticated API interceptor (fetch override)
//   - Notification polling (only when authenticated)
//   - Logout and session cleanup
//   - Role-based route protection
// ============================================================

const API_BASE = "http://127.0.0.1:8000/api";

// ============================================================
// 1. TOKEN MANAGEMENT
// ============================================================

const AuthManager = {
    // Token storage keys
    KEYS: {
        access: "access",
        refresh: "refresh",
        userId: "userId",
        username: "username",
        email: "email",
        role: "role",
        department: "department",
    },

    /** Store all auth data after successful login */
    saveSession(data) {
        localStorage.setItem(this.KEYS.access, data.access);
        localStorage.setItem(this.KEYS.refresh, data.refresh);
        localStorage.setItem(this.KEYS.userId, data.id);
        localStorage.setItem(this.KEYS.username, data.username);
        localStorage.setItem(this.KEYS.email, data.email);
        localStorage.setItem(this.KEYS.role, data.role);
        localStorage.setItem(this.KEYS.department, data.department || "");
    },

    /** Get the current access token, or null if not present */
    getAccessToken() {
        return localStorage.getItem(this.KEYS.access) || null;
    },

    /** Get the current refresh token, or null if not present */
    getRefreshToken() {
        return localStorage.getItem(this.KEYS.refresh) || null;
    },

    /** Get the stored user role */
    getRole() {
        return localStorage.getItem(this.KEYS.role) || null;
    },

    /** Check if a JWT token is expired by decoding its payload */
    isTokenExpired(token) {
        if (!token) return true;
        try {
            const parts = token.split(".");
            if (parts.length !== 3) return true;
            const payload = JSON.parse(atob(parts[1]));
            if (!payload.exp) return true;
            // Add 10-second buffer to avoid edge-case race conditions
            return (payload.exp - 10) < (Date.now() / 1000);
        } catch (e) {
            return true;
        }
    },

    /** Check if the user has a valid (non-expired) access token */
    isAuthenticated() {
        const token = this.getAccessToken();
        return token !== null && !this.isTokenExpired(token);
    },

    /** Check if the refresh token exists and is not expired */
    hasValidRefreshToken() {
        const token = this.getRefreshToken();
        return token !== null && !this.isTokenExpired(token);
    },

    /** Clear all stored authentication data */
    clearSession() {
        Object.values(this.KEYS).forEach(key => localStorage.removeItem(key));
        // Also clear legacy keys
        localStorage.removeItem("token");
    },

    /** Update only the access token (after a refresh) */
    updateAccessToken(newAccessToken) {
        localStorage.setItem(this.KEYS.access, newAccessToken);
    },
};

// ============================================================
// 2. TOKEN REFRESH MECHANISM
// ============================================================

let _isRefreshing = false;
let _refreshQueue = []; // Queued requests waiting for refresh to complete

/**
 * Attempt to refresh the access token using the stored refresh token.
 * Returns the new access token on success, or null on failure.
 * Queues concurrent callers so only one refresh request is made.
 */
function refreshAccessToken() {
    if (_isRefreshing) {
        // Another refresh is already in progress; queue this caller
        return new Promise((resolve, reject) => {
            _refreshQueue.push({ resolve, reject });
        });
    }

    _isRefreshing = true;

    const refreshToken = AuthManager.getRefreshToken();
    if (!refreshToken || AuthManager.isTokenExpired(refreshToken)) {
        // Refresh token is missing or expired — session is dead
        _isRefreshing = false;
        _drainQueue(null);
        return Promise.resolve(null);
    }

    return _nativeFetch(`${API_BASE}/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
    })
        .then(res => {
            if (!res.ok) throw new Error("Refresh failed");
            return res.json();
        })
        .then(data => {
            AuthManager.updateAccessToken(data.access);
            // If rotation is enabled and a new refresh token is returned, update it
            if (data.refresh) {
                localStorage.setItem(AuthManager.KEYS.refresh, data.refresh);
            }
            _isRefreshing = false;
            _drainQueue(data.access);
            return data.access;
        })
        .catch(err => {
            console.warn("Token refresh failed:", err.message);
            _isRefreshing = false;
            _drainQueue(null);
            return null;
        });
}

/** Resolve or reject all queued callers after a refresh attempt */
function _drainQueue(newToken) {
    _refreshQueue.forEach(({ resolve }) => resolve(newToken));
    _refreshQueue = [];
}

// ============================================================
// 3. FETCH INTERCEPTOR
//    - Attaches Authorization header ONLY when a valid token exists
//    - Automatically refreshes and retries on 401
//    - Skips auth for public endpoints (register, login, public/*)
// ============================================================

// Keep a reference to the browser's native fetch BEFORE we override
const _nativeFetch = window.fetch.bind(window);

/** List of API path patterns that must NEVER have auth headers attached */
const PUBLIC_ENDPOINTS = [
    "/api/register/",
    "/api/login/",
    "/api/token/refresh/",
    "/api/public/",
];

function isPublicEndpoint(url) {
    return PUBLIC_ENDPOINTS.some(ep => url.includes(ep));
}

window.fetch = function (input, init = {}) {
    const url = typeof input === "string" ? input : (input && input.url ? input.url : "");

    // Auto-prepend backend host if path-only URL is used
    let fullUrl = url;
    if (url.startsWith("/api/")) {
        fullUrl = `http://127.0.0.1:8000${url}`;
    }

    // Only intercept requests to our backend API
    if (!fullUrl.includes("127.0.0.1:8000/api/")) {
        return _nativeFetch(typeof input === "string" ? fullUrl : input, init);
    }

    // NEVER attach auth headers to public endpoints
    if (isPublicEndpoint(fullUrl)) {
        // Strip any Authorization header that might have been set
        if (init.headers) {
            const h = new Headers(init.headers);
            h.delete("Authorization");
            init.headers = h;
        }
        return _nativeFetch(fullUrl, init);
    }

    // For authenticated endpoints: attach token only if valid
    const token = AuthManager.getAccessToken();

    if (token && !AuthManager.isTokenExpired(token)) {
        init = init || {};
        const headers = new Headers(init.headers || {});
        if (!headers.has("Authorization")) {
            headers.set("Authorization", `Bearer ${token}`);
        }
        init.headers = headers;

        // Make the request; if 401, try to refresh and retry ONCE
        return _nativeFetch(fullUrl, init).then(response => {
            if (response.status === 401) {
                return _handleUnauthorized(fullUrl, init);
            }
            return response;
        });
    }

    // Token is missing or expired — try to refresh proactively
    if (AuthManager.hasValidRefreshToken()) {
        return refreshAccessToken().then(newToken => {
            if (newToken) {
                init = init || {};
                const headers = new Headers(init.headers || {});
                headers.set("Authorization", `Bearer ${newToken}`);
                init.headers = headers;
                return _nativeFetch(fullUrl, init);
            }
            // Refresh failed — make the request unauthenticated (will likely 401)
            return _nativeFetch(fullUrl, init);
        });
    }

    // No valid tokens at all — make the request as-is (will 401 for protected endpoints)
    return _nativeFetch(fullUrl, init);
};

/**
 * Handle a 401 response: attempt to refresh the token and retry the request once.
 * If refresh fails, redirect to login.
 */
function _handleUnauthorized(url, init) {
    return refreshAccessToken().then(newToken => {
        if (newToken) {
            const headers = new Headers(init.headers || {});
            headers.set("Authorization", `Bearer ${newToken}`);
            init.headers = headers;
            return _nativeFetch(url, init);
        }
        // Refresh failed completely — session is dead
        _onSessionExpired();
        // Return a synthetic 401 response so callers don't crash
        return new Response(JSON.stringify({ detail: "Session expired. Please sign in again." }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        });
    });
}

/** Called when both access and refresh tokens are invalid */
function _onSessionExpired() {
    // Avoid redirect loops on login/register pages
    const path = location.pathname.toLowerCase();
    if (path.includes("login.html") || path.includes("register.html") || path.endsWith("/index.html") || path === "/" || path.endsWith("about.html") || path.endsWith("services.html")) {
        AuthManager.clearSession();
        return;
    }
    AuthManager.clearSession();
    const isSubdir = path.includes("/citizen/") || path.includes("/department/") || path.includes("/admin/");
    window.location.href = isSubdir ? "../login.html" : "login.html";
}

// ============================================================
// 4. GLOBAL LOGOUT
// ============================================================

function logoutUser() {
    _stopNotificationPoller();
    AuthManager.clearSession();
    sessionStorage.clear();
    const isSubdir = location.pathname.includes("/citizen/") || location.pathname.includes("/department/") || location.pathname.includes("/admin/");
    window.location.href = isSubdir ? "../login.html" : "login.html";
}

// ============================================================
// 5. TOAST NOTIFICATION UI
// ============================================================

function showToast(title, message, type = "info") {
    let container = document.getElementById("toastContainer");
    if (!container) {
        container = document.createElement("div");
        container.id = "toastContainer";
        document.body.appendChild(container);
    }
    const toast = document.createElement("div");
    toast.className = `civic-toast ${type}`;
    toast.innerHTML = `
        <div style="font-weight: 700; font-size: 14px; margin-bottom: 2px;">${title}</div>
        <div style="font-size: 13px; opacity: 0.9;">${message}</div>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(100%)";
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ============================================================
// 6. NOTIFICATION POLLER (starts ONLY after verified auth)
// ============================================================

let _notificationInterval = null;
let _lastSeenNotificationId = 0;

function _startNotificationPoller() {
    if (_notificationInterval) return; // Already running

    // Double-check authentication before starting
    if (!AuthManager.isAuthenticated() && !AuthManager.hasValidRefreshToken()) return;

    async function poll() {
        // Re-validate before every poll cycle
        if (!AuthManager.getAccessToken() && !AuthManager.hasValidRefreshToken()) {
            _stopNotificationPoller();
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/notifications/`);
            if (res.status === 401) {
                // Token refresh was attempted by the interceptor and failed
                _stopNotificationPoller();
                return;
            }
            if (!res.ok) return;

            const data = await res.json();
            if (data.notifications && data.notifications.length > 0) {
                const unread = data.notifications.filter(n => !n.is_read);
                if (unread.length > 0 && _lastSeenNotificationId !== unread[0].id) {
                    _lastSeenNotificationId = unread[0].id;
                    showToast(unread[0].title, unread[0].message, unread[0].notification_type || "info");
                }
                const badgeEl = document.getElementById("notificationBadge");
                if (badgeEl) {
                    badgeEl.innerText = data.unread_count > 0 ? data.unread_count : "";
                    badgeEl.style.display = data.unread_count > 0 ? "inline-block" : "none";
                }
            }
        } catch (err) {
            // Network error — silently ignore
        }
    }

    poll(); // First poll immediately
    _notificationInterval = setInterval(poll, 10000);
}

function _stopNotificationPoller() {
    if (_notificationInterval) {
        clearInterval(_notificationInterval);
        _notificationInterval = null;
    }
}

// ============================================================
// 7. ROUTE PROTECTION & INITIALIZATION
// ============================================================

(() => {
    const role = AuthManager.getRole();
    const path = location.pathname.toLowerCase();

    // Determine if the current page requires a specific role
    let expectedRole = null;
    if (path.includes("/citizen/")) expectedRole = "Citizen";
    else if (path.includes("/department/")) expectedRole = "Department";
    else if (path.includes("/admin/") && !path.includes("/admin.")) expectedRole = "Admin";

    const dashboards = {
        Citizen: "../citizen/dashboard.html",
        Department: "../department/dashboard.html",
        Admin: "../admin/dashboard.html",
    };

    // Enforce role-based access for protected dashboard pages
    if (expectedRole) {
        const hasValidSession = AuthManager.isAuthenticated() || AuthManager.hasValidRefreshToken();

        if (!hasValidSession || !role || role !== expectedRole) {
            console.warn(`Unauthorized access attempt to ${expectedRole} section.`);
            if (hasValidSession && role && dashboards[role]) {
                window.location.replace(dashboards[role]);
            } else {
                AuthManager.clearSession();
                window.location.replace("../login.html");
            }
            return;
        }
    }

    // On public pages (login, register, index): clean up any stale tokens
    const isPublicPage = path.includes("login.html") || path.includes("register.html");
    if (isPublicPage) {
        // If there are tokens but they're both expired, clean them up
        if (AuthManager.getAccessToken() && !AuthManager.isAuthenticated() && !AuthManager.hasValidRefreshToken()) {
            AuthManager.clearSession();
        }
    }

    // DOM ready initialization
    document.addEventListener("DOMContentLoaded", () => {
        // Start notification polling ONLY on authenticated dashboard pages
        if (expectedRole && AuthManager.isAuthenticated()) {
            _startNotificationPoller();
        } else if (!expectedRole && AuthManager.isAuthenticated()) {
            // Authenticated user on a non-role page (shouldn't normally happen, but handle gracefully)
            // Don't start polling on login/register/index pages
        }

        // Attach logout listeners
        document.querySelectorAll('.btn-logout, a[href*="login.html"]').forEach(el => {
            el.addEventListener("click", (e) => {
                if (el.classList.contains("btn-logout") || el.innerText.toLowerCase().includes("logout")) {
                    e.preventDefault();
                    logoutUser();
                }
            });
        });
    });
})();
