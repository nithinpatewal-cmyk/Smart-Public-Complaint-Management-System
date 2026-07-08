// ==========================================
// CivicConnect - My Complaints (Django)
// ==========================================

const container = document.getElementById("complaintsContainer");
const searchBox = document.getElementById("searchComplaint");
const statusFilter = document.getElementById("statusFilter");

let complaints = [];

// ==========================================
// Fetch Complaints from Django
// ==========================================

async function fetchComplaints() {

    try {

        const response = await fetch(
            "http://127.0.0.1:8000/api/complaints/"
        );

        complaints = await response.json();

        filterComplaints();

    }

    catch (error) {

        console.log(error);

        container.innerHTML = `

        <div class="empty">

            <h2>Unable to load complaints.</h2>

        </div>

        `;

    }

}

// ==========================================
// Display Complaints
// ==========================================

function loadComplaints(data) {

    container.innerHTML = "";

    if (data.length === 0) {

        container.innerHTML = `

        <div class="empty">

            <i class="fa-solid fa-folder-open"></i>

            <h2>No Complaints Found</h2>

        </div>

        `;

        return;

    }

    data.forEach(c => {

        let badge = "pending";

        if (c.status === "In Progress")
            badge = "progress";

        if (c.status === "Resolved")
            badge = "resolved";

        const imageUrl = c.image
            ? "http://127.0.0.1:8000" + c.image
            : "";

        container.innerHTML += `

        <div class="card">

            <img src="${imageUrl}" alt="Complaint Image">

            <div class="card-body">

                <h3>${c.title}</h3>

                <p><b>ID :</b> ${c.complaint_id}</p>

                <p><b>Category :</b> ${c.category}</p>

                <p><b>Citizen :</b> ${c.citizen_name}</p>

                <p><b>Address :</b> ${c.address}</p>

                <p><b>Date :</b> ${new Date(c.created_at).toLocaleDateString()}</p>

                <span class="status ${badge}">

                    ${c.status}

                </span>

            </div>

        </div>

        `;

    });

}

// ==========================================
// Search & Filter
// ==========================================

function filterComplaints() {

    const keyword = searchBox.value.toLowerCase();

    const status = statusFilter.value;

    const filtered = complaints.filter(c => {

        const searchMatch =

            c.complaint_id.toLowerCase().includes(keyword) ||

            c.category.toLowerCase().includes(keyword) ||

            c.title.toLowerCase().includes(keyword);

        const statusMatch =

            status === "All" ||

            c.status === status;

        return searchMatch && statusMatch;

    });

    loadComplaints(filtered);

}

searchBox.addEventListener("keyup", filterComplaints);

statusFilter.addEventListener("change", filterComplaints);

// ==========================================
// Start
// ==========================================

fetchComplaints();