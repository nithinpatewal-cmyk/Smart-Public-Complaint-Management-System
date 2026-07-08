// ==========================================
// CivicConnect
// Upload Resolution
// ==========================================

// Get Complaint ID
const params = new URLSearchParams(window.location.search);

const complaintId = params.get("id");

// Get Complaints
let complaints = JSON.parse(localStorage.getItem("complaints")) || [];

// Find Complaint
let complaint = complaints.find(c => c.id === complaintId);

// Show Complaint ID
if(complaint){

    document.getElementById("complaintId").innerText = complaint.id;

}

// ==========================================
// Image Preview
// ==========================================

const imageInput = document.getElementById("resolutionImage");

const preview = document.getElementById("preview");

imageInput.addEventListener("change",function(){

    const file = this.files[0];

    if(file){

        const reader = new FileReader();

        reader.onload = function(e){

            preview.src = e.target.result;

            preview.style.display = "block";

        }

        reader.readAsDataURL(file);

    }

});

// ==========================================
// Upload Resolution
// ==========================================

document.getElementById("submitResolution")

.addEventListener("click",function(){

    if(!complaint){

        alert("Complaint Not Found");

        return;

    }

    complaint.status = "Resolved";

    complaint.resolutionImage = preview.src;

    complaint.resolutionRemarks =

    document.getElementById("remarks").value;

    complaint.completedDate =

    new Date().toLocaleDateString();

    complaint.completedTime =

    new Date().toLocaleTimeString();

    // Save

    localStorage.setItem(

        "complaints",

        JSON.stringify(complaints)

    );

    alert("Resolution Uploaded Successfully!");

    window.location.href="assigned-complaints.html";

});