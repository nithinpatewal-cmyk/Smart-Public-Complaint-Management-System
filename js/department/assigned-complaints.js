// ======================================
// CivicConnect Department
// Assigned Complaints
// ======================================

// Get complaints
let complaints = JSON.parse(localStorage.getItem("complaints")) || [];

// Get Table
const table = document.getElementById("complaintTable");

// Dashboard Counts
let total = 0;
let pending = 0;
let progress = 0;
let resolved = 0;

// ==============================
// Load Complaints
// ==============================

function loadComplaints(data){

    table.innerHTML="";

    if(data.length===0){

        table.innerHTML=`

        <tr>

            <td colspan="5">

            No Assigned Complaints

            </td>

        </tr>

        `;

        return;

    }

    data.forEach(c=>{

        total++;

        if(c.status==="Pending") pending++;

        if(c.status==="In Progress") progress++;

        if(c.status==="Resolved") resolved++;

        let badge="pending";

        if(c.status==="In Progress")
            badge="progress";

        if(c.status==="Resolved")
            badge="resolved";

        table.innerHTML+=`

        <tr>

            <td>${c.id}</td>

            <td>${c.category}</td>

            <td>

                <span class="status ${badge}">

                    ${c.status}

                </span>

            </td>

            <td>${c.date}</td>

            <td>

                <button

                class="view-btn"

                onclick="viewComplaint('${c.id}')">

                View

                </button>

                <button

                class="update-btn"

                onclick="updateStatus('${c.id}')">

                Update

                </button>

            </td>

        </tr>

        `;

    });

    document.getElementById("totalAssigned").innerText=total;
    document.getElementById("pendingCount").innerText=pending;
    document.getElementById("progressCount").innerText=progress;
    document.getElementById("resolvedCount").innerText=resolved;

}

// Load Page
loadComplaints(complaints);

// ==============================
// Search
// ==============================

document.getElementById("searchComplaint")

.addEventListener("keyup",function(){

const value=this.value.toLowerCase();

const result=complaints.filter(c=>

c.id.toLowerCase().includes(value) ||

c.category.toLowerCase().includes(value)

);

total=0;
pending=0;
progress=0;
resolved=0;

loadComplaints(result);

});

// ==============================
// View Complaint
// ==============================

function viewComplaint(id){

window.location.href=

"complaint-details.html?id="+id;

}

// ==============================
// Update Status
// ==============================

function updateStatus(id){

window.location.href=

"update-status.html?id="+id;

}