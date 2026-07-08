// ======================================
// CivicConnect Department
// Update Status
// ======================================

// Get Complaint ID from URL
const params = new URLSearchParams(window.location.search);

const complaintId = params.get("id");

// Get Complaints
let complaints = JSON.parse(localStorage.getItem("complaints")) || [];

// Find Complaint
const complaint = complaints.find(c => c.id === complaintId);

// Load Complaint Details

if(complaint){

document.getElementById("complaintId").innerText = complaint.id;

document.getElementById("category").innerText = complaint.category;

document.getElementById("currentStatus").innerText = complaint.status;

document.getElementById("newStatus").value = complaint.status;

if(complaint.remarks){

document.getElementById("remarks").value = complaint.remarks;

}

}

// ======================================
// Save Status
// ======================================

document.getElementById("saveStatus")

.addEventListener("click",function(){

if(!complaint){

alert("Complaint Not Found");

return;

}

complaint.status =

document.getElementById("newStatus").value;

complaint.remarks =

document.getElementById("remarks").value;

// Completion Date

if(complaint.status==="Resolved"){

complaint.completedDate =

new Date().toLocaleDateString();

}

// Save Local Storage

localStorage.setItem(

"complaints",

JSON.stringify(complaints)

);

alert("Complaint Status Updated Successfully");

window.location.href="assigned-complaints.html";

});