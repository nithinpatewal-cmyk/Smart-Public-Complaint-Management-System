// ===============================
// CivicConnect Report Complaint
// ===============================

const photo = document.getElementById("photo");
const preview = document.getElementById("preview");

let map = null;
let marker = null;

// -------------------------------
// Page Load
// -------------------------------

window.onload = function () {

    generateComplaintID();

    generateDateTime();

    getLocation();

};

// -------------------------------
// Complaint ID
// -------------------------------

function generateComplaintID() {

    const id = "CC" + Date.now();

    document.getElementById("cid").innerText = id;

}

// -------------------------------
// Date & Time
// -------------------------------

function generateDateTime() {

    const now = new Date();

    document.getElementById("date").innerText =
        now.toLocaleDateString();

    document.getElementById("time").innerText =
        now.toLocaleTimeString();

}

// -------------------------------
// Image Preview
// -------------------------------

photo.addEventListener("change", function () {

    const file = this.files[0];

    if (!file) return;

    preview.src = URL.createObjectURL(file);

    preview.style.display = "block";

    document.getElementById("photoInfo").style.display = "block";

    document.getElementById("fileName").innerText =
        file.name;

    document.getElementById("fileSize").innerText =
        (file.size / 1024 / 1024).toFixed(2) + " MB";

    const img = new Image();

    img.onload = function () {

        document.getElementById("resolution").innerText =
            img.width + " × " + img.height;

    }

    img.src = URL.createObjectURL(file);

});

// -------------------------------
// GPS
// -------------------------------

function getLocation() {

    if (navigator.geolocation) {

        navigator.geolocation.getCurrentPosition(

            showPosition,

            showError,

            {

                enableHighAccuracy: true,

                timeout: 10000,

                maximumAge: 0

            }

        );

    } else {

        alert("Geolocation is not supported.");

    }

}

// -------------------------------
// GPS Success
// -------------------------------

function showPosition(position) {

    const lat = position.coords.latitude;

    const lng = position.coords.longitude;

    document.getElementById("lat").innerText =
        lat.toFixed(6);

    document.getElementById("lng").innerText =
        lng.toFixed(6);

    getAddress(lat, lng);

    loadMap(lat, lng);

}

// -------------------------------
// GPS Error
// -------------------------------

function showError(error) {

    document.getElementById("address").innerText =
        "Unable to fetch location.";

    alert("Please allow location permission.");

}

// -------------------------------
// Address
// -------------------------------

async function getAddress(lat, lng) {

    try {

        const url =
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;

        const response = await fetch(url);

        const data = await response.json();

        document.getElementById("address").innerText =
            data.display_name;

    }

    catch {

        document.getElementById("address").innerText =
            "Address not available";

    }

}

// -------------------------------
// OpenStreetMap
// -------------------------------

function loadMap(lat, lng) {

    if (map != null) {

        map.remove();

    }

    map = L.map("map").setView([lat, lng], 17);

    L.tileLayer(

        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",

        {

            attribution: "© OpenStreetMap"

        }

    ).addTo(map);

    marker = L.marker([lat, lng])

        .addTo(map)

        .bindPopup("Complaint Location")

        .openPopup();

}

// -------------------------------
// Save Complaint
// -------------------------------

document.getElementById("complaintForm")

.addEventListener("submit", function (e) {

    e.preventDefault();

    const complaint = {

        id: document.getElementById("cid").innerText,

        title: document.getElementById("title").value,

        category: document.getElementById("category").value,

        description: document.getElementById("description").value,

        latitude: document.getElementById("lat").innerText,

        longitude: document.getElementById("lng").innerText,

        address: document.getElementById("address").innerText,

        date: document.getElementById("date").innerText,

        time: document.getElementById("time").innerText,

        image: preview.src,

        status: "Pending"

    };

    let complaints =

        JSON.parse(localStorage.getItem("complaints")) || [];

    complaints.push(complaint);

    localStorage.setItem(

        "complaints",

        JSON.stringify(complaints)

    );

alert("Complaint Submitted Successfully!");

window.location.href="my-complaints.html";

});