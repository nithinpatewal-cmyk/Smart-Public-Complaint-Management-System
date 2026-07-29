let reportMap = null;
let reportMarker = null;
let hasExifGps = false;

function initReportMap(defaultLat = 19.0760, defaultLng = 72.8777) {
    if (reportMap) {
        reportMap.setView([defaultLat, defaultLng], 15);
        if (reportMarker) reportMarker.setLatLng([defaultLat, defaultLng]);
        return;
    }

    reportMap = L.map("map").setView([defaultLat, defaultLng], 14);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors"
    }).addTo(reportMap);

    reportMarker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(reportMap);

    reportMarker.on("dragend", function (e) {
        if (!hasExifGps) {
            const position = reportMarker.getLatLng();
            updateLocationFields(position.lat, position.lng, false);
        } else {
            // Snap back if EXIF is locked
            showToast("Location Locked", "Extracted EXIF GPS coordinates cannot be modified.", "warning");
            const lat = parseFloat(document.getElementById("latInput").value);
            const lng = parseFloat(document.getElementById("lngInput").value);
            if (!isNaN(lat) && !isNaN(lng)) reportMarker.setLatLng([lat, lng]);
        }
    });

    reportMap.on("click", function (e) {
        if (!hasExifGps) {
            const { lat, lng } = e.latlng;
            reportMarker.setLatLng([lat, lng]);
            updateLocationFields(lat, lng, false);
        } else {
            showToast("Location Locked", "GPS metadata extracted from photo. Manual click selection disabled.", "warning");
        }
    });
}

async function updateLocationFields(lat, lng, isExif = false) {
    const latInput = document.getElementById("latInput");
    const lngInput = document.getElementById("lngInput");
    const addressInput = document.getElementById("addressInput");

    latInput.value = parseFloat(lat).toFixed(7);
    lngInput.value = parseFloat(lng).toFixed(7);

    if (isExif) {
        latInput.readOnly = true;
        lngInput.readOnly = true;
    } else {
        latInput.readOnly = false;
        lngInput.readOnly = false;
    }

    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        if (res.ok) {
            const data = await res.json();
            addressInput.value = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        }
    } catch (err) {
        addressInput.value = `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
}

// Handle Photo Upload: Dual-Mode EXIF + OCR Overlay Extraction
document.getElementById("photo").addEventListener("change", async function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const preview = document.getElementById("preview");
    const previewBox = document.getElementById("imagePreviewBox");
    const exifBadge = document.getElementById("exifBadge");

    preview.src = URL.createObjectURL(file);
    previewBox.classList.remove("d-none");

    exifBadge.innerHTML = `
        <span class="badge bg-info text-dark p-2">
            <span class="spinner-border spinner-border-sm me-1"></span> Analyzing photo location metadata & OCR overlay...
        </span>
    `;

    // Method 1: EXIF Metadata Extraction
    try {
        if (typeof exifr !== "undefined") {
            const gps = await exifr.gps(file);
            if (gps && gps.latitude && gps.longitude) {
                hasExifGps = true;
                const lat = gps.latitude;
                const lng = gps.longitude;

                exifBadge.innerHTML = `
                    <span class="badge bg-success p-2">
                        <i class="fa-solid fa-circle-check me-1"></i> EXIF GPS Found: ${lat.toFixed(6)}, ${lng.toFixed(6)} (Locked)
                    </span>
                `;
                initReportMap(lat, lng);
                updateLocationFields(lat, lng, true);
                if (typeof showToast === "function") showToast("EXIF GPS Extracted", "Coordinates extracted directly from photo metadata.", "success");
                return;
            }
        }
    } catch (err) {
        console.warn("EXIF parsing attempt failed, proceeding to OCR:", err);
    }

    // Method 2: OCR Image Text Overlay Extraction (GPS Map Camera format)
    try {
        if (typeof Tesseract !== "undefined") {
            const result = await Tesseract.recognize(file, 'eng');
            const text = result?.data?.text || "";

            const latMatch = text.match(/(?:Lat|Latitude)?[:\s]*(-?\d{1,2}\.\d{4,8})\s*°?\s*([NS])?/i);
            const lngMatch = text.match(/(?:Long|Longitude|Lng)?[:\s]*(-?\d{1,3}\.\d{4,8})\s*°?\s*([EW])?/i);
            const addrMatch = text.match(/(?:Address|Location)[:\s]*(.+)/i);

            if (latMatch && lngMatch) {
                let lat = parseFloat(latMatch[1]);
                let lng = parseFloat(lngMatch[1]);

                if (latMatch[2] && latMatch[2].toUpperCase() === 'S') lat = -lat;
                if (lngMatch[2] && lngMatch[2].toUpperCase() === 'W') lng = -lng;

                if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                    hasExifGps = true;
                    exifBadge.innerHTML = `
                        <span class="badge bg-success p-2">
                            <i class="fa-solid fa-camera me-1"></i> GPS Map Camera OCR Extracted: ${lat.toFixed(6)}, ${lng.toFixed(6)} (Locked)
                        </span>
                    `;
                    initReportMap(lat, lng);
                    updateLocationFields(lat, lng, true);

                    if (addrMatch && addrMatch[1]) {
                        document.getElementById("addressInput").value = addrMatch[1].trim();
                    }

                    if (typeof showToast === "function") showToast("OCR Location Extracted", "GPS coordinates read directly from photo overlay text.", "success");
                    return;
                }
            }
        }
    } catch (err) {
        console.warn("OCR parsing attempt failed:", err);
    }

    // Fallback: Geolocation API or manual map selection
    hasExifGps = false;
    exifBadge.innerHTML = `
        <span class="badge bg-warning text-dark p-2">
            <i class="fa-solid fa-triangle-exclamation me-1"></i> No GPS metadata or camera overlay text found. Click map or drag pin to select location.
        </span>
    `;

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                initReportMap(pos.coords.latitude, pos.coords.longitude);
                updateLocationFields(pos.coords.latitude, pos.coords.longitude, false);
            },
            () => {
                initReportMap();
            }
        );
    } else {
        initReportMap();
    }
});

// Submit Form via FormData to Django REST Backend
document.getElementById("complaintForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const submitBtn = document.getElementById("submitBtn");
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin me-2"></i> Submitting...`;

    const title = document.getElementById("title").value.trim();
    const category = document.getElementById("category").value;
    const priority = document.getElementById("priority").value;
    const description = document.getElementById("description").value.trim();
    const photoFile = document.getElementById("photo").files[0];
    const latitude = document.getElementById("latInput").value;
    const longitude = document.getElementById("lngInput").value;
    const address = document.getElementById("addressInput").value;

    if (!title || !category || !description || !photoFile || !latitude || !longitude) {
        showToast("Missing Data", "Please complete all required fields and location coordinates.", "error");
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="fa-solid fa-paper-plane me-2"></i> Submit Complaint`;
        return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("category", category);
    formData.append("priority", priority);
    formData.append("description", description);
    formData.append("image", photoFile);
    formData.append("latitude", latitude);
    formData.append("longitude", longitude);
    formData.append("address", address);

    try {
        const response = await fetch("http://127.0.0.1:8000/api/complaint/", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            showToast("Complaint Filed", `Complaint #${data.complaint_id} submitted successfully!`, "success");
            setTimeout(() => {
                window.location.href = "my-complaints.html";
            }, 1200);
        } else {
            showToast("Submission Error", data.error || "Failed to submit complaint.", "error");
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<i class="fa-solid fa-paper-plane me-2"></i> Submit Complaint`;
        }
    } catch (err) {
        console.error("Submit error:", err);
        showToast("Server Connection Error", "Unable to connect to Django backend server.", "error");
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="fa-solid fa-paper-plane me-2"></i> Submit Complaint`;
    }
});

document.addEventListener("DOMContentLoaded", () => {
    initReportMap();
});