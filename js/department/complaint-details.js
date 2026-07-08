// =========================================
// Complaint Details
// =========================================

const params = new URLSearchParams(window.location.search);
const complaintId = params.get("id");

// =========================================
// Load Complaint
// =========================================

async function loadComplaint() {

    try {

        const response = await fetch(
            `http://127.0.0.1:8000/api/complaints/${complaintId}/`
        );

        if (!response.ok) {

            alert("Complaint not found");

            window.location.replace("dashboard.html");

            return;

        }

        const complaint = await response.json();

        document.getElementById("complaintId").innerText =
            complaint.complaint_id;

        document.getElementById("citizen").innerText =
            complaint.citizen_name;

        document.getElementById("category").innerText =
            complaint.category;

        document.getElementById("title").innerText =
            complaint.title;

        document.getElementById("description").innerText =
            complaint.description;

        document.getElementById("address").innerText =
            complaint.address;

        document.getElementById("status").innerText =
            complaint.status;

        document.getElementById("date").innerText =
            new Date(complaint.created_at).toLocaleDateString();

        // Correct Image ID
        document.getElementById("complaintImage").src =
            "http://127.0.0.1:8000" + complaint.image;

    }

    catch (error) {

        console.log(error);

        alert("Unable to load complaint.");

    }

}

// =========================================
// Update Status
// =========================================

async function updateStatus(status) {

    try {

        const response = await fetch(

            `http://127.0.0.1:8000/api/complaints/${complaintId}/status/`,

            {

                method: "PATCH",

                headers: {

                    "Content-Type": "application/json"

                },

                body: JSON.stringify({

                    status: status

                })

            }

        );

        const data = await response.json();

        console.log(data);

        if (response.ok) {

            alert("Status Updated Successfully");

            // Wait half second then go to dashboard
            setTimeout(function () {

                window.location.replace("./dashboard.html");

            }, 500);

        }

        else {

            alert("Failed to update status");

            console.log(data);

        }

    }

    catch (error) {

        console.log(error);

        alert("Cannot connect to Django");

    }

}

// =========================================
// Button Events
// =========================================

document.getElementById("acceptBtn").addEventListener("click", function () {

    updateStatus("Accepted");

});

document.getElementById("progressBtn").addEventListener("click", function () {

    updateStatus("In Progress");

});

document.getElementById("resolveBtn").addEventListener("click", function () {

    updateStatus("Resolved");

});

document.getElementById("rejectBtn").addEventListener("click", function () {

    updateStatus("Rejected");

});

// =========================================

loadComplaint();