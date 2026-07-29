let publicMap = null;

const modal = document.getElementById("categoryModal");
const title = document.getElementById("modalTitle");
const beforeImage = document.getElementById("beforeImage");
const afterImage = document.getElementById("afterImage");
const description = document.getElementById("modalDescription");

async function loadPublicStats() {
    try {
        const res = await fetch("http://127.0.0.1:8000/api/public/stats/");
        if (res.ok) {
            const data = await res.json();
            document.getElementById("statTotal").innerText = data.total_complaints || 0;
            document.getElementById("statResolved").innerText = data.resolved_complaints || 0;
            document.getElementById("statActive").innerText = data.active_complaints || 0;
            document.getElementById("statCitizens").innerText = data.citizens_registered || 0;
        }
    } catch (err) {
        console.warn("Public stats fetch offline:", err);
    }
}

async function initPublicMap() {
    const mapElement = document.getElementById("publicMap");
    if (!mapElement) return;

    // Default center (e.g. Mumbai/Delhi central coords or default 19.0760, 72.8777)
    publicMap = L.map("publicMap").setView([19.0760, 72.8777], 11);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors"
    }).addTo(publicMap);

    try {
        const res = await fetch("http://127.0.0.1:8000/api/public/showcase/");
        if (res.ok) {
            const data = await res.json();
            if (data.markers && data.markers.length > 0) {
                const group = L.featureGroup();
                data.markers.forEach(item => {
                    if (item.latitude && item.longitude) {
                        const marker = L.marker([parseFloat(item.latitude), parseFloat(item.longitude)])
                            .bindPopup(`
                                <div style="font-family: sans-serif;">
                                    <strong style="color: #1e3a8a;">#${item.complaint_id}</strong><br/>
                                    <b>Category:</b> ${item.category}<br/>
                                    <b>Status:</b> ${item.status}<br/>
                                    <small>${item.address || ''}</small>
                                </div>
                            `);
                        group.addLayer(marker);
                    }
                });
                group.addTo(publicMap);
                publicMap.fitBounds(group.getBounds(), { padding: [30, 30], maxZoom: 15 });
            }
        }
    } catch (err) {
        console.warn("Public map markers fetch offline:", err);
    }
}

function openCategory(type) {
    modal.style.display = "flex";
    title.innerText = type + " Resolution Showcase";

    // Set demo before/after photos if API is loading
    beforeImage.src = `images/before-after/${type.toLowerCase().replace(/\s+/g, '')}-before.jpg`;
    afterImage.src = `images/before-after/${type.toLowerCase().replace(/\s+/g, '')}-after.jpg`;
    description.innerText = `Verified before and after geotagged proof uploaded by the assigned municipal department.`;
}

function closeModal() {
    modal.style.display = "none";
}

window.onclick = function (event) {
    if (event.target === modal) {
        closeModal();
    }
};

document.addEventListener("DOMContentLoaded", () => {
    loadPublicStats();
    initPublicMap();
});