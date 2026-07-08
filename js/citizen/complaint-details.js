// ==========================================
// CivicConnect
// Complaint Details
// ==========================================

// Get Complaint ID
const params = new URLSearchParams(window.location.search);

const complaintId = params.get("id");

// Get Complaints
let complaints = JSON.parse(localStorage.getItem("complaints")) || [];

// Find Complaint
const complaint = complaints.find(c => c.id === complaintId);

let map;

// ==========================================
// Load Complaint
// ==========================================

if(complaint){

document.getElementById("complaintImage").src =
complaint.image || "";

document.getElementById("cid").value =
complaint.id || "";

document.getElementById("category").value =
complaint.category || "";

document.getElementById("priority").value =
complaint.priority || "";

document.getElementById("status").value =
complaint.status || "";

document.getElementById("date").value =
complaint.date || "";

document.getElementById("time").value =
complaint.time || "";

document.getElementById("description").value =
complaint.description || "";

document.getElementById("address").value =
complaint.address || "";

document.getElementById("latitude").innerText =
complaint.latitude || "-";

document.getElementById("longitude").innerText =
complaint.longitude || "-";

document.getElementById("remarks").value =
complaint.remarks || "No remarks available.";

// Resolution Image

const resolutionImage =
document.getElementById("resolutionImage");

if(complaint.resolutionImage){

resolutionImage.src =
complaint.resolutionImage;

}

else{

resolutionImage.style.display="none";

}

// Load Map

if(complaint.latitude && complaint.longitude){

loadMap(

parseFloat(complaint.latitude),

parseFloat(complaint.longitude)

);

}

}

else{

alert("Complaint Not Found");

window.location.href="my-complaints.html";

}

// ==========================================
// OpenStreetMap
// ==========================================

function loadMap(lat,lng){

map = L.map("map").setView([lat,lng],16);

L.tileLayer(

"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",

{

attribution:"© OpenStreetMap"

}

).addTo(map);

L.marker([lat,lng])

.addTo(map)

.bindPopup("Complaint Location")

.openPopup();

}

// ==========================================
// Status Color
// ==========================================

const statusBox =
document.getElementById("status");

switch(statusBox.value){

case "Pending":

statusBox.style.background="#ffc107";
statusBox.style.color="#000";
break;

case "In Progress":

statusBox.style.background="#0dcaf0";
statusBox.style.color="#fff";
break;

case "Resolved":

statusBox.style.background="#198754";
statusBox.style.color="#fff";
break;

case "Rejected":

statusBox.style.background="#dc3545";
statusBox.style.color="#fff";
break;

}