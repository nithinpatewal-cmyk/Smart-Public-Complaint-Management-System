// ==========================================
// CivicConnect Department Dashboard
// ==========================================

const table = document.getElementById("complaintsTable");

let complaints = [];

// ==========================================
// Load Complaints
// ==========================================

async function loadDashboard() {

    try {

        const response = await fetch(
            "http://127.0.0.1:8000/api/complaints/"
        );

        complaints = await response.json();

        updateCards();

        loadTable();

    }

    catch (error) {

        console.log(error);

        alert("Unable to connect to Django.");

    }

}

// ==========================================
// Dashboard Cards
// ==========================================

function updateCards() {

    document.getElementById("totalComplaints").innerText =
        complaints.length;

    document.getElementById("pendingComplaints").innerText =
        complaints.filter(c => c.status === "Pending").length;

    document.getElementById("progressComplaints").innerText =
        complaints.filter(c => c.status === "In Progress").length;

    document.getElementById("resolvedComplaints").innerText =
        complaints.filter(c => c.status === "Resolved").length;

}

// ==========================================
// Complaint Table
// ==========================================

function loadTable() {

    table.innerHTML = "";

    complaints.forEach(c => {

        table.innerHTML += `

        <tr>

            <td>${c.complaint_id}</td>

            <td>${c.citizen_name}</td>

            <td>${c.category}</td>

            <td>${c.status}</td>

            <td>${new Date(c.created_at).toLocaleDateString()}</td>

            <td>

                <button
                class="view"
                onclick="viewComplaint('${c.complaint_id}')">

                View

                </button>

            </td>

        </tr>

        `;

    });

}

// ==========================================
// View Complaint
// ==========================================

function viewComplaint(id){

    alert("Complaint : " + id);

}

// ==========================================

loadDashboard();