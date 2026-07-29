// ============================================================
// CivicConnect Login Handler
// ============================================================

function togglePassword() {
    const password = document.getElementById("password");
    const icon = document.getElementById("eyeIcon");
    if (password.type === "password") {
        password.type = "text";
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
    } else {
        password.type = "password";
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
    }
}

document.addEventListener("DOMContentLoaded", function () {
    // If user is already authenticated with a valid session, redirect to dashboard
    if (typeof AuthManager !== "undefined" && AuthManager.isAuthenticated()) {
        const role = AuthManager.getRole();
        const dashboards = {
            Citizen: "citizen/dashboard.html",
            Department: "department/dashboard.html",
            Admin: "admin/dashboard.html",
        };
        if (role && dashboards[role]) {
            window.location.replace(dashboards[role]);
            return;
        }
    }

    const loginForm = document.getElementById("loginForm");
    if (!loginForm) return;

    loginForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const alertBox = document.getElementById("alertBox");
        alertBox.classList.add("d-none");
        alertBox.innerHTML = "";

        const identifier = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();
        const role = document.getElementById("role").value;

        if (!identifier || !password) {
            alertBox.innerHTML = "<strong>Error:</strong> Please enter both username/email and password.";
            alertBox.classList.remove("d-none");
            return;
        }

        const submitBtn = loginForm.querySelector("button[type='submit']");
        const origBtnHtml = submitBtn ? submitBtn.innerHTML : "";

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Authenticating...`;
        }

        try {
            // Clear any stale session data before login attempt
            if (typeof AuthManager !== "undefined") {
                AuthManager.clearSession();
            }

            const response = await fetch(`${API_BASE}/login/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: identifier,
                    password: password,
                    role: role,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // Save session using AuthManager
                if (typeof AuthManager !== "undefined") {
                    AuthManager.saveSession(data);
                }

                if (typeof showToast === "function") {
                    showToast("Login Successful", `Welcome back, ${data.username}!`, "success");
                }

                setTimeout(() => {
                    if (data.role === "Citizen") {
                        window.location.href = "citizen/dashboard.html";
                    } else if (data.role === "Department") {
                        window.location.href = "department/dashboard.html";
                    } else if (data.role === "Admin") {
                        window.location.href = "admin/dashboard.html";
                    } else {
                        window.location.href = "index.html";
                    }
                }, 600);
            } else {
                // Map technical JWT errors to user-friendly messages
                let errorMsg = "";

                if (data.detail && data.detail.toLowerCase().includes("token")) {
                    errorMsg = "Your session has expired. Please sign in again.";
                } else if (data.code === "token_not_valid") {
                    errorMsg = "Invalid authentication session. Please sign in again.";
                } else {
                    errorMsg = data.error || data.detail || "";
                }

                if (!errorMsg && typeof data === "object") {
                    const firstKey = Object.keys(data)[0];
                    if (firstKey) {
                        const val = data[firstKey];
                        errorMsg = Array.isArray(val) ? val.join(", ") : String(val);
                    }
                }
                if (!errorMsg) {
                    errorMsg = "Invalid username/email or password.";
                }

                alertBox.innerHTML = `<strong>Login Failed:</strong> ${errorMsg}`;
                alertBox.classList.remove("d-none");
            }
        } catch (error) {
            console.error("Login Error:", error);
            alertBox.innerHTML = `<strong>Connection Error:</strong> Cannot connect to CivicConnect backend server. Please ensure the server is running.`;
            alertBox.classList.remove("d-none");
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = origBtnHtml;
            }
        }
    });
});
