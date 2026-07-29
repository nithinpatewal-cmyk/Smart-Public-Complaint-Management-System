// ============================================================
// CivicConnect - Department Resolution Upload (API-Backed)
// Dual-Mode EXIF + OCR Location Extraction
// ============================================================

const params = new URLSearchParams(window.location.search);
const complaintId = params.get("id");

let resolutionLat = null;
let resolutionLng = null;
let resolutionAddress = null;
let hasGpsLock = false;

// Display complaint ID
document.addEventListener("DOMContentLoaded", () => {
    const cidEl = document.getElementById("complaintId");
    if (cidEl && complaintId) {
        cidEl.innerText = complaintId;
    } else if (!complaintId) {
        if (typeof showToast === "function") showToast("Error", "No complaint ID specified.", "error");
    }
});

// ============================================================
// Image Preview + Dual-Mode EXIF/OCR Location Extraction
// ============================================================

const imageInput = document.getElementById("resolutionImage");
const preview = document.getElementById("preview");

imageInput.addEventListener("change", async function () {
    const file = this.files[0];
    if (!file) return;

    // Show preview
    preview.src = URL.createObjectURL(file);
    preview.style.display = "block";

    // Reset GPS state
    resolutionLat = null;
    resolutionLng = null;
    resolutionAddress = null;
    hasGpsLock = false;

    // Method 1: EXIF Metadata Extraction
    try {
        if (typeof exifr !== "undefined") {
            const gps = await exifr.gps(file);
            if (gps && gps.latitude && gps.longitude) {
                resolutionLat = gps.latitude;
                resolutionLng = gps.longitude;
                hasGpsLock = true;
                if (typeof showToast === "function") {
                    showToast("EXIF GPS Extracted", `Resolution location: ${resolutionLat.toFixed(6)}, ${resolutionLng.toFixed(6)}`, "success");
                }
                // Reverse geocode
                _reverseGeocode(resolutionLat, resolutionLng);
                return;
            }
        }
    } catch (err) {
        console.warn("EXIF parsing failed for resolution photo, trying OCR:", err);
    }

    // Method 2: OCR Image Text Overlay Extraction
    try {
        if (typeof Tesseract !== "undefined") {
            const result = await Tesseract.recognize(file, "eng");
            const text = result?.data?.text || "";

            const latMatch = text.match(/(?:Lat|Latitude)?[:\s]*(-?\d{1,2}\.\d{4,8})\s*°?\s*([NS])?/i);
            const lngMatch = text.match(/(?:Long|Longitude|Lng)?[:\s]*(-?\d{1,3}\.\d{4,8})\s*°?\s*([EW])?/i);
            const addrMatch = text.match(/(?:Address|Location)[:\s]*(.+)/i);

            if (latMatch && lngMatch) {
                let lat = parseFloat(latMatch[1]);
                let lng = parseFloat(lngMatch[1]);

                if (latMatch[2] && latMatch[2].toUpperCase() === "S") lat = -lat;
                if (lngMatch[2] && lngMatch[2].toUpperCase() === "W") lng = -lng;

                if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                    resolutionLat = lat;
                    resolutionLng = lng;
                    hasGpsLock = true;
                    if (addrMatch && addrMatch[1]) {
                        resolutionAddress = addrMatch[1].trim();
                    }
                    if (typeof showToast === "function") {
                        showToast("OCR GPS Extracted", `Resolution location from photo overlay: ${lat.toFixed(6)}, ${lng.toFixed(6)}`, "success");
                    }
                    if (!resolutionAddress) _reverseGeocode(lat, lng);
                    return;
                }
            }
        }
    } catch (err) {
        console.warn("OCR parsing failed for resolution photo:", err);
    }

    // Fallback: No GPS found
    if (typeof showToast === "function") {
        showToast("No GPS Data", "No location metadata found in resolution photo. Location will use complaint origin.", "warning");
    }
});

// Reverse geocode helper
async function _reverseGeocode(lat, lng) {
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        if (res.ok) {
            const data = await res.json();
            resolutionAddress = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        }
    } catch (err) {
        resolutionAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
}

// ============================================================
// Submit Resolution to Backend API
// ============================================================

document.getElementById("submitResolution").addEventListener("click", async function () {
    if (!complaintId) {
        if (typeof showToast === "function") showToast("Error", "No complaint ID specified.", "error");
        return;
    }

    const file = imageInput.files[0];
    const remarks = document.getElementById("remarks").value.trim();

    if (!file) {
        if (typeof showToast === "function") showToast("Error", "Please upload a resolution proof photo.", "error");
        return;
    }

    const btn = this;
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Uploading...`;

    const formData = new FormData();
    formData.append("resolution_image", file);
    formData.append("resolution_remarks", remarks);

    if (resolutionLat !== null && resolutionLng !== null) {
        formData.append("resolution_latitude", resolutionLat);
        formData.append("resolution_longitude", resolutionLng);
    }
    if (resolutionAddress) {
        formData.append("resolution_address", resolutionAddress);
    }

    try {
        const response = await fetch(`${API_BASE}/complaints/${complaintId}/resolve/`, {
            method: "POST",
            body: formData,
        });

        const data = await response.json();

        if (response.ok) {
            if (typeof showToast === "function") showToast("Resolution Uploaded", data.message || "Complaint marked as resolved.", "success");
            setTimeout(() => {
                window.location.href = "assigned-complaints.html";
            }, 1200);
        } else {
            if (typeof showToast === "function") showToast("Upload Failed", data.error || "Could not upload resolution.", "error");
            btn.disabled = false;
            btn.innerHTML = `<i class="fa-solid fa-upload"></i> Upload Resolution`;
        }
    } catch (err) {
        console.error("Resolution upload error:", err);
        if (typeof showToast === "function") showToast("Connection Error", "Unable to connect to backend server.", "error");
        btn.disabled = false;
        btn.innerHTML = `<i class="fa-solid fa-upload"></i> Upload Resolution`;
    }
});