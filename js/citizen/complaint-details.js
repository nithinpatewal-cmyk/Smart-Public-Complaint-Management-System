let detailMap = null;

async function loadComplaintDetails() {
    const params = new URLSearchParams(window.location.search);
    const complaintId = params.get("id");
    const container = document.getElementById("detailsCard");
    const statusBadge = document.getElementById("detailStatusBadge");

    if (!complaintId) {
        container.innerHTML = `<div class="alert alert-danger">No complaint ID specified in URL parameter.</div>`;
        return;
    }

    try {
        const response = await fetch(`http://127.0.0.1:8000/api/complaints/${complaintId}/`);
        if (!response.ok) throw new Error("Complaint not found.");

        const c = await response.json();

        // Update badge
        const badgeClass = {
            "Pending": "pending",
            "Accepted": "accepted",
            "In Progress": "progress",
            "Resolved": "resolved",
            "Rejected": "rejected"
        }[c.status] || "pending";
        statusBadge.className = `status-badge ${badgeClass} fs-6 px-3 py-2`;
        statusBadge.innerText = c.status;

        let beforeImgUrl = c.image || "";
        if (beforeImgUrl && !beforeImgUrl.startsWith("http")) beforeImgUrl = "http://127.0.0.1:8000" + beforeImgUrl;

        let resImgUrl = c.resolution_image || "";
        if (resImgUrl && !resImgUrl.startsWith("http")) resImgUrl = "http://127.0.0.1:8000" + resImgUrl;

        // Render Card Layout
        container.innerHTML = `
            <div class="row g-4">
                <div class="col-lg-8">
                    <div class="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                        <div>
                            <span class="badge bg-primary fs-6 me-2 font-monospace">#${c.complaint_id}</span>
                            <span class="badge bg-secondary-subtle text-dark fs-6 me-2">${c.category}</span>
                            <span class="badge bg-warning-subtle text-dark fs-6">Priority: ${c.priority}</span>
                        </div>
                        <span class="small text-muted"><i class="fa-solid fa-calendar me-1"></i> ${new Date(c.created_at).toLocaleString()}</span>
                    </div>

                    <h3 class="fw-bold text-dark mb-3">${c.title}</h3>
                    
                    <div class="mb-4">
                        <h6 class="fw-bold text-secondary">Description</h6>
                        <p class="text-dark bg-light p-3 rounded border">${c.description}</p>
                    </div>

                    <div class="mb-4">
                        <h6 class="fw-bold text-secondary"><i class="fa-solid fa-location-dot text-danger me-1"></i> Address</h6>
                        <p class="text-dark bg-light p-3 rounded border font-monospace">${c.address}</p>
                    </div>

                    <!-- Images Section -->
                    <div class="proof-comparison mb-4">
                        <div class="proof-box">
                            <h6 class="fw-bold text-primary"><i class="fa-solid fa-camera me-1"></i> Reported Complaint Photo</h6>
                            ${beforeImgUrl ? `<img src="${beforeImgUrl}" alt="Before Photo">` : `<div class="p-4 text-muted">No photo uploaded</div>`}
                        </div>
                        <div class="proof-box">
                            <h6 class="fw-bold text-success"><i class="fa-solid fa-square-check me-1"></i> Resolution Proof Photo</h6>
                            ${resImgUrl ? `<img src="${resImgUrl}" alt="Resolution Proof">` : `<div class="p-4 text-muted">Awaiting department resolution proof upload</div>`}
                        </div>
                    </div>

                    ${c.rejection_reason ? `
                        <div class="alert alert-danger mb-4">
                            <h6 class="fw-bold"><i class="fa-solid fa-triangle-exclamation me-1"></i> Rejection Reason:</h6>
                            <p class="mb-0">${c.rejection_reason}</p>
                        </div>
                    ` : ''}

                    ${c.resolution_remarks ? `
                        <div class="alert alert-success mb-4">
                            <h6 class="fw-bold"><i class="fa-solid fa-circle-check me-1"></i> Department Officer Remarks:</h6>
                            <p class="mb-0">${c.resolution_remarks}</p>
                        </div>
                    ` : ''}

                    <!-- Map Container -->
                    <div class="mb-4">
                        <h6 class="fw-bold text-dark mb-2"><i class="fa-solid fa-map-marked-alt text-primary me-1"></i> Location Map (Leaflet GIS)</h6>
                        <div id="detailMap" class="leaflet-map-container"></div>
                    </div>

                    <!-- Comments Section -->
                    <div class="card p-3 bg-light border">
                        <h6 class="fw-bold text-dark mb-3"><i class="fa-solid fa-comments me-2"></i> Official Discussion & Remarks</h6>
                        <div id="commentsList" class="mb-3" style="max-height: 250px; overflow-y: auto;">
                            ${renderComments(c.comments)}
                        </div>
                        <div class="input-group">
                            <input type="text" id="newCommentInput" class="form-control" placeholder="Type a comment or remark...">
                            <button class="btn btn-primary fw-bold" onclick="submitComment('${c.complaint_id}')">
                                <i class="fa-solid fa-paper-plane me-1"></i> Post Comment
                            </button>
                        </div>
                    </div>
                </div>

                <div class="col-lg-4">
                    <div class="card p-3 bg-light border mb-4">
                        <h5 class="fw-bold text-dark mb-3"><i class="fa-solid fa-building text-primary me-2"></i> Department Info</h5>
                        <p class="mb-2"><strong>Assigned Department:</strong><br><span class="badge bg-primary fs-6">${c.department}</span></p>
                        <p class="mb-2"><strong>Citizen Username:</strong><br><span class="text-secondary">${c.citizen_name}</span></p>
                        <p class="mb-0"><strong>Last Updated:</strong><br><span class="text-muted small">${new Date(c.updated_at).toLocaleString()}</span></p>
                    </div>

                    <!-- Timeline Progress -->
                    <div class="card p-3 bg-light border">
                        <h5 class="fw-bold text-dark mb-3"><i class="fa-solid fa-timeline text-primary me-2"></i> Status Timeline</h5>
                        <ul class="list-group list-group-flush small">
                            ${renderTimeline(c.timeline)}
                        </ul>
                    </div>
                </div>
            </div>
        `;

        // Initialize Detail Map
        setTimeout(() => {
            initDetailMap(c);
        }, 100);
    } catch (err) {
        console.error("Detail Load Error:", err);
        container.innerHTML = `
            <div class="alert alert-danger text-center py-4">
                <i class="fa-solid fa-triangle-exclamation fa-2x mb-2 d-block"></i>
                <h5>Error loading complaint #${complaintId}</h5>
                <p>${err.message}</p>
            </div>
        `;
    }
}

function renderTimeline(timeline) {
    if (!timeline || timeline.length === 0) return `<li class="list-group-item bg-transparent">No history</li>`;
    return timeline.map(t => `
        <li class="list-group-item bg-transparent px-0 border-bottom">
            <div class="fw-bold text-primary">${t.status}</div>
            <div class="text-secondary">${t.remarks || ''}</div>
            <div class="text-muted font-monospace" style="font-size: 11px;">By ${t.changed_by_name || 'System'} at ${new Date(t.timestamp).toLocaleString()}</div>
        </li>
    `).join('');
}

function renderComments(comments) {
    if (!comments || comments.length === 0) return `<p class="text-muted small">No comments posted yet.</p>`;
    return comments.map(c => `
        <div class="p-2 mb-2 bg-white rounded border">
            <div class="d-flex justify-content-between">
                <strong class="text-dark">${c.sender_name} (${c.sender_role})</strong>
                <small class="text-muted font-monospace">${new Date(c.created_at).toLocaleTimeString()}</small>
            </div>
            <p class="mb-0 text-secondary small">${c.comment}</p>
        </div>
    `).join('');
}

async function submitComment(complaintId) {
    const input = document.getElementById("newCommentInput");
    const comment = input.value.trim();
    if (!comment) return;

    try {
        const res = await fetch(`http://127.0.0.1:8000/api/complaints/${complaintId}/comments/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ comment })
        });
        if (res.ok) {
            showToast("Comment Posted", "Your remark was added to the discussion thread.", "success");
            input.value = "";
            loadComplaintDetails();
        }
    } catch (err) {
        showToast("Error", "Could not post comment.", "error");
    }
}

function initDetailMap(c) {
    const mapEl = document.getElementById("detailMap");
    if (!mapEl) return;

    const lat = parseFloat(c.latitude);
    const lng = parseFloat(c.longitude);

    if (isNaN(lat) || isNaN(lng)) return;

    detailMap = L.map("detailMap").setView([lat, lng], 15);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap"
    }).addTo(detailMap);

    // Complaint marker (Red)
    L.marker([lat, lng]).addTo(detailMap)
        .bindPopup(`<b>Complaint Location</b><br>#${c.complaint_id}`)
        .openPopup();

    // If Resolution location exists, add resolution marker (Green)
    if (c.resolution_latitude && c.resolution_longitude) {
        const rLat = parseFloat(c.resolution_latitude);
        const rLng = parseFloat(c.resolution_longitude);
        if (!isNaN(rLat) && !isNaN(rLng)) {
            L.marker([rLat, rLng]).addTo(detailMap)
                .bindPopup(`<b>Resolution Work Proof Location</b><br>${c.resolution_address || ''}`);
        }
    }
}

document.addEventListener("DOMContentLoaded", loadComplaintDetails);