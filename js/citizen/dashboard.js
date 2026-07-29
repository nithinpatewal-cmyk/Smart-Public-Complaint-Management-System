async function loadCitizenDashboard() {
    const username = localStorage.getItem("username") || "Citizen";
    const nameEl = document.getElementById("citizenName");
    if (nameEl) nameEl.innerText = username;

    try {
        const response = await fetch("http://127.0.0.1:8000/api/complaints/");
        if (!response.ok) throw new Error("Failed to load complaints");

        const complaints = await response.json();

        // Update counts
        document.getElementById("totalComplaints").innerText = complaints.length;
        document.getElementById("pendingComplaints").innerText = complaints.filter(c => c.status === "Pending").length;
        document.getElementById("progressComplaints").innerText = complaints.filter(c => c.status === "Accepted" || c.status === "In Progress").length;
        document.getElementById("resolvedComplaints").innerText = complaints.filter(c => c.status === "Resolved").length;

        // Render Recent Complaints Table
        const tbody = document.getElementById("recentComplaints");
        tbody.innerHTML = "";

        if (complaints.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-4 text-muted">
                        <i class="fa-solid fa-folder-open fa-2x mb-2 d-block text-secondary"></i>
                        No complaints submitted yet. <a href="report.html" class="fw-bold">Report an issue now</a>.
                    </td>
                </tr>
            `;
            return;
        }

        complaints.slice(0, 5).forEach(c => {
            const badgeClass = {
                "Pending": "pending",
                "Accepted": "accepted",
                "In Progress": "progress",
                "Resolved": "resolved",
                "Rejected": "rejected"
            }[c.status] || "pending";

            tbody.innerHTML += `
                <tr>
                    <td class="fw-bold font-monospace text-primary">#${c.complaint_id}</td>
                    <td class="fw-semibold">${c.title}</td>
                    <td><span class="badge bg-secondary-subtle text-dark">${c.category}</span></td>
                    <td class="small text-secondary">${c.department}</td>
                    <td><span class="status-badge ${badgeClass}">${c.status}</span></td>
                    <td class="small text-muted">${new Date(c.created_at).toLocaleDateString()}</td>
                    <td>
                        <a href="complaint-details.html?id=${c.complaint_id}" class="btn btn-sm btn-outline-primary fw-semibold">
                            <i class="fa-solid fa-eye me-1"></i> View Details
                        </a>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error("Dashboard Load Error:", error);
        document.getElementById("recentComplaints").innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4 text-danger">
                    <i class="fa-solid fa-triangle-exclamation me-2"></i> Unable to connect to Django server.
                </td>
            </tr>
        `;
    }
}

document.addEventListener("DOMContentLoaded", loadCitizenDashboard);