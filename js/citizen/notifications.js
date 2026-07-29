async function fetchNotifications() {
    const container = document.getElementById("notificationContainer");
    try {
        const response = await fetch("http://127.0.0.1:8000/api/notifications/");
        if (!response.ok) throw new Error("Failed to fetch");

        const data = await response.json();
        const notifications = data.notifications || [];

        container.innerHTML = "";

        if (notifications.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5 text-muted">
                    <i class="fa-solid fa-bell-slash fa-3x mb-3 text-secondary"></i>
                    <h5>No Notifications Yet</h5>
                    <p class="mb-0">You have no notification alerts at this time.</p>
                </div>
            `;
            return;
        }

        notifications.forEach(n => {
            const isUnread = !n.is_read;
            const borderType = {
                "success": "border-start border-4 border-success",
                "warning": "border-start border-4 border-warning",
                "error": "border-start border-4 border-danger",
                "info": "border-start border-4 border-primary"
            }[n.notification_type] || "border-start border-4 border-info";

            container.innerHTML += `
                <div class="list-group-item list-group-item-action p-3 mb-2 rounded ${borderType} ${isUnread ? 'bg-white shadow-sm' : 'bg-light'}">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <h6 class="fw-bold text-dark mb-0">${n.title} ${isUnread ? '<span class="badge bg-danger ms-2">New</span>' : ''}</h6>
                        <small class="text-muted font-monospace">${new Date(n.created_at).toLocaleString()}</small>
                    </div>
                    <p class="mb-1 text-secondary small">${n.message}</p>
                </div>
            `;
        });
    } catch (err) {
        console.error("Notifications error:", err);
        container.innerHTML = `
            <div class="alert alert-danger text-center py-4">
                Unable to connect to notification server.
            </div>
        `;
    }
}

async function markAllNotificationsRead() {
    try {
        const response = await fetch("http://127.0.0.1:8000/api/notifications/read/", {
            method: "POST"
        });
        if (response.ok) {
            showToast("Notifications Read", "All notifications marked as read.", "success");
            fetchNotifications();
        }
    } catch (err) {
        showToast("Error", "Could not mark notifications read.", "error");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    fetchNotifications();
    const btn = document.getElementById("markAllReadBtn");
    if (btn) btn.addEventListener("click", markAllNotificationsRead);
});