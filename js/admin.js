// ======================================
// CivicConnect Admin Dashboard
// ======================================

// Load complaints when page opens
window.onload = function () {
    loadComplaints();
};

// Load all complaints
function loadComplaints() {

    let complaints = JSON.parse(localStorage.getItem("complaints")) || [];

    let container = document.getElementById("complaintsContainer");

    container.innerHTML = "";

    let total = complaints.length;
    let pending = 0;
    let accepted = 0;
    let rejected = 0;

    complaints.forEach((complaint, index) => {

        if (complaint.status === "Pending")
            pending++;

        if (complaint.status === "Accepted")
            accepted++;

        if (complaint.status === "Rejected")
            rejected++;

        let badge = "";

        if (complaint.status === "Pending") {
            badge = `<span class="badge bg-warning text-dark">Pending</span>`;
        }

        if (complaint.status === "Accepted") {
            badge = `<span class="badge bg-success">Accepted</span>`;
        }

        if (complaint.status === "Rejected") {
            badge = `<span class="badge bg-danger">Rejected</span>`;
        }

        container.innerHTML += `

        <div class="card complaint-card shadow">

            <img src="${complaint.image}" class="card-img-top">

            <div class="complaint-body">

                <h4>${complaint.title}</h4>

                <p class="info"><strong>Complaint ID:</strong> ${complaint.id}</p>

                <p class="info"><strong>Category:</strong> ${complaint.category}</p>

                <p class="info"><strong>Description:</strong> ${complaint.description}</p>

                <p class="info"><strong>Address:</strong> ${complaint.address}</p>

                <p class="info"><strong>Latitude:</strong> ${complaint.latitude}</p>

                <p class="info"><strong>Longitude:</strong> ${complaint.longitude}</p>

                <p class="info"><strong>Date:</strong> ${complaint.date}</p>

                <p class="info"><strong>Time:</strong> ${complaint.time}</p>

                <p>${badge}</p>

                <button
                    class="btn btn-success"
                    onclick="acceptComplaint(${index})">

                    <i class="fa-solid fa-check"></i>

                    Accept

                </button>

                <button
                    class="btn btn-danger"
                    onclick="rejectComplaint(${index})">

                    <i class="fa-solid fa-xmark"></i>

                    Reject

                </button>

            </div>

        </div>

        `;

    });

    document.getElementById("totalComplaints").innerText = total;
    document.getElementById("pendingComplaints").innerText = pending;
    document.getElementById("acceptedComplaints").innerText = accepted;
    document.getElementById("rejectedComplaints").innerText = rejected;

}

// Accept Complaint
function acceptComplaint(index) {

    let complaints = JSON.parse(localStorage.getItem("complaints")) || [];

    complaints[index].status = "Accepted";

    localStorage.setItem("complaints", JSON.stringify(complaints));

    alert("Complaint Accepted Successfully!");

    loadComplaints();

}

// Reject Complaint
function rejectComplaint(index) {

    let complaints = JSON.parse(localStorage.getItem("complaints")) || [];

    complaints[index].status = "Rejected";

    localStorage.setItem("complaints", JSON.stringify(complaints));

    alert("Complaint Rejected!");

    loadComplaints();

}