// ===========================================
// CivicConnect - Report Complaint
// ===========================================

const form = document.getElementById("complaintForm");
const photo = document.getElementById("photo");
const preview = document.getElementById("preview");

let map;
let marker;

// ===========================================
// Initialize Page
// ===========================================

window.onload = function () {

    generateComplaintID();
    setDateTime();
    getLocation();

};

// ===========================================
// Generate Complaint ID
// ===========================================

function generateComplaintID(){

    document.getElementById("complaintId").value =
    "CC" + Date.now();

}

// ===========================================
// Current Date & Time
// ===========================================

function setDateTime(){

    const now = new Date();

    document.getElementById("date").value =
    now.toLocaleDateString();

    document.getElementById("time").value =
    now.toLocaleTimeString();

}

// ===========================================
// Image Preview
// ===========================================

photo.addEventListener("change",function(){

    const file = this.files[0];

    if(file){

        preview.src = URL.createObjectURL(file);

        preview.style.display = "block";

    }

});

// ===========================================
// Get Current Location
// ===========================================

function getLocation(){

    if(navigator.geolocation){

        navigator.geolocation.getCurrentPosition(

            showPosition,

            showError,

            {

                enableHighAccuracy:true

            }

        );

    }

}

// ===========================================
// Location Success
// ===========================================

function showPosition(position){

    const lat = position.coords.latitude;

    const lng = position.coords.longitude;

    document.getElementById("latitude").innerText =
    lat.toFixed(6);

    document.getElementById("longitude").innerText =
    lng.toFixed(6);

    loadMap(lat,lng);

    getAddress(lat,lng);

}

// ===========================================
// Location Error
// ===========================================

function showError(){

    alert("Location Permission Required.");

}

// ===========================================
// Load OpenStreetMap
// ===========================================

function loadMap(lat,lng){

    map = L.map("map").setView([lat,lng],16);

    L.tileLayer(

        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",

        {

            attribution:"© OpenStreetMap"

        }

    ).addTo(map);

    marker = L.marker([lat,lng])

    .addTo(map)

    .bindPopup("Complaint Location")

    .openPopup();

}

// ===========================================
// Get Address
// ===========================================

async function getAddress(lat,lng){

    try{

        const response = await fetch(

        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`

        );

        const data = await response.json();

        document.getElementById("address").innerText =
        data.display_name;

    }

    catch{

        document.getElementById("address").innerText =
        "Address Not Available";

    }

}

// ===========================================
// Submit Complaint to Django
// ===========================================

form.addEventListener("submit", async function(e){

    e.preventDefault();

    const formData = new FormData();

    formData.append(
        "complaint_id",
        document.getElementById("complaintId").value
    );

    formData.append(
    "citizen",
    localStorage.getItem("userId")
);

    formData.append(
        "category",
        document.getElementById("category").value
    );

    formData.append(
        "title",
        document.getElementById("title").value
    );

    formData.append(
        "description",
        document.getElementById("description").value
    );

    formData.append(
        "image",
        photo.files[0]
    );

    formData.append(
        "latitude",
        document.getElementById("latitude").innerText
    );

    formData.append(
        "longitude",
        document.getElementById("longitude").innerText
    );

    formData.append(
        "address",
        document.getElementById("address").innerText
    );

    formData.append(
        "department",
        ""
    );

    formData.append(
        "status",
        "Pending"
    );

    try{

        const response = await fetch(

            "http://127.0.0.1:8000/api/complaint/",

            {

                method:"POST",

                body:formData

            }

        );

        const data = await response.json();

        if(response.ok){

            alert("Complaint Submitted Successfully!");

            window.location.href="my-complaints.html";

        }

        else{

            console.log(data);

            alert("Submission Failed");

        }

    }

    catch(error){

        console.log(error);

        alert("Cannot connect to Django");

    }

});