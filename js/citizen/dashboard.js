// ==========================================
// CivicConnect Citizen Dashboard
// ==========================================

// Get complaints from Local Storage
let complaints = JSON.parse(localStorage.getItem("complaints")) || [];

// Dashboard Cards
const total = complaints.length;

const pending = complaints.filter(c => c.status === "Pending").length;

const progress = complaints.filter(c => c.status === "In Progress").length;

const resolved = complaints.filter(c => c.status === "Resolved").length;

// Update Dashboard Cards
document.getElementById("totalComplaints").innerText = total;
document.getElementById("pendingComplaints").innerText = pending;
document.getElementById("progressComplaints").innerText = progress;
document.getElementById("resolvedComplaints").innerText = resolved;

// ==========================================
// Recent Complaints Table
// ==========================================

const table = document.getElementById("recentComplaints");

table.innerHTML = "";

if (complaints.length === 0) {

    table.innerHTML = `
    <tr>
        <td colspan="4">No Complaints Found</td>
    </tr>
    `;

} else {

    // Latest 5 complaints
    complaints.slice().reverse().slice(0,5).forEach(c => {

        table.innerHTML += `

        <tr>

            <td>${c.id}</td>

            <td>${c.category}</td>

            <td>${c.status}</td>

            <td>

                <a href="complaint-details.html?id=${c.id}">

                    <button>View</button>

                </a>

            </td>

        </tr>

        `;

    });

}

// ==========================================
// Dashboard Animation
// ==========================================

document.querySelectorAll(".card").forEach((card,index)=>{

    card.style.opacity="0";
    card.style.transform="translateY(25px)";

    setTimeout(()=>{

        card.style.transition=".5s";

        card.style.opacity="1";

        card.style.transform="translateY(0)";

    },index*150);

});