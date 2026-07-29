let allComplaints = [];

async function fetchMyComplaints() {
    const container = document.getElementById("complaintsContainer");
    try {
        const response = await fetch("http://127.0.0.1:8000/api/complaints/");
        if (!response.ok) throw new Error("Failed to fetch");

        allComplaints = await response.json();
        renderComplaints(allComplaints);
    } catch (err) {
        console.error("Fetch complaints error:", err);
        container.innerHTML = `
            <div class="col-12 text-center py-5 text-danger">
                <i class="fa-solid fa-triangle-exclamation fa-3x mb-3"></i>
                <h4>Unable to load complaints from backend</h4>
                <p>Please make sure Django backend is running.</p>
            </div>
        `;
    }
}

function renderComplaints(data) {
    const container = document.getElementById("complaintsContainer");
    container.innerHTML = "";

    if (!data || data.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5 text-muted">
                <i class="fa-solid fa-folder-open fa-3x mb-3 text-secondary"></i>
                <h4>No Complaints Found</h4>
                <p>No complaints match your selected search or status filters.</p>
            </div>
        `;
        return;
    }

    data.forEach(c => {
        const badgeClass = {
            "Pending": "pending",
            "Accepted": "accepted",
            "In Progress": "progress",
            "Resolved": "resolved",
            "Rejected": "rejected"
        }[c.status] || "pending";

        let imageUrl = c.image || "";
        if (imageUrl && !imageUrl.startsWith("http")) {
            imageUrl = "http://127.0.0.1:8000" + imageUrl;
        }

        container.innerHTML += `
            <div class="col-md-6 col-lg-4">
                <div class="card h-100 shadow-sm border-0" style="border-radius: 12px; overflow: hidden;">
                    <div style="height: 180px; overflow: hidden; background: #e2e8f0; position: relative;">
                        ${imageUrl ? `<img src="${imageUrl}" alt="${c.title}" style="width: 100%; height: 100%; object-fit: cover;">` : `<div class="d-flex h-100 align-items-center justify-content-center text-muted"><i class="fa-solid fa-image fa-2x"></i></div>`}
                        <span class="position-absolute top-0 end-0 m-2 status-badge ${badgeClass}">${c.status}</span>
                    </div>

                    <div class="card-body d-flex flex-direction-column">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <span class="fw-bold font-monospace text-primary">#${c.complaint_id}</span>
                            <span class="badge bg-secondary-subtle text-dark">${c.category}</span>
                        </div>

                        <h5 class="fw-bold text-dark text-truncate mb-2" title="${c.title}">${c.title}</h5>
                        <p class="small text-muted mb-2 text-truncate" title="${c.address}"><i class="fa-solid fa-location-dot text-danger me-1"></i> ${c.address}</p>

                        <div class="mt-auto pt-3 border-top d-flex justify-content-between align-items-center">
                            <span class="small text-muted"><i class="fa-solid fa-calendar me-1"></i> ${new Date(c.created_at).toLocaleDateString()}</span>
                            <a href="complaint-details.html?id=${c.complaint_id}" class="btn btn-sm btn-primary fw-bold px-3">
                                View Details
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
}

function filterComplaints() {
    const keyword = document.getElementById("searchComplaint").value.toLowerCase();
    const statusVal = document.getElementById("statusFilter").value;
    const catVal = document.getElementById("categoryFilter") ? document.getElementById("categoryFilter").value : "All";

    const filtered = allComplaints.filter(c => {
        const matchKeyword = c.complaint_id.toLowerCase().includes(keyword) ||
            c.title.toLowerCase().includes(keyword) ||
            c.category.toLowerCase().includes(keyword) ||
            c.address.toLowerCase().includes(keyword);

        const matchStatus = statusVal === "All" || c.status === statusVal;
        const matchCategory = catVal === "All" || c.category === catVal;

        return matchKeyword && matchStatus && matchCategory;
    });

    renderComplaints(filtered);
}

document.addEventListener("DOMContentLoaded", () => {
    fetchMyComplaints();
    document.getElementById("searchComplaint").addEventListener("keyup", filterComplaints);
    document.getElementById("statusFilter").addEventListener("change", filterComplaints);
    const catFilter = document.getElementById("categoryFilter");
    if (catFilter) catFilter.addEventListener("change", filterComplaints);
});