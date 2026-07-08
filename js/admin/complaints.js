// ========================================
// CivicConnect Admin Complaints
// ========================================

let complaints = JSON.parse(localStorage.getItem("complaints")) || [];

const table = document.getElementById("complaintTable");
const search = document.getElementById("searchInput");
const filter = document.getElementById("statusFilter");

// Load Complaints
function loadComplaints(data){

    table.innerHTML = "";

    if(data.length===0){

        table.innerHTML = `
        <tr>
            <td colspan="7" class="text-center">
                No Complaints Found
            </td>
        </tr>
        `;

        return;

    }

    data.forEach((c,index)=>{

        let department="General Department";

        switch(c.category){

            case "Road Damage":
            case "Pothole":
                department="Road Department";
                break;

            case "Garbage":
                department="Sanitation Department";
                break;

            case "Street Light":
                department="Electrical Department";
                break;

            case "Water Leakage":
                department="Water Department";
                break;

        }

        let badge="warning";

        if(c.status==="Accepted")
            badge="success";

        if(c.status==="Rejected")
            badge="danger";

        if(c.status==="Resolved")
            badge="primary";

        table.innerHTML += `

        <tr>

        <td>${c.id}</td>

        <td>${c.name || "Citizen"}</td>

        <td>${c.category}</td>

        <td>${department}</td>

        <td>

        <span class="badge bg-${badge}">
        ${c.status}
        </span>

        </td>

        <td>${c.date}</td>

        <td>

        <button
        class="btn btn-success btn-sm"
        onclick="acceptComplaint(${index})">

        Accept

        </button>

        <button
        class="btn btn-danger btn-sm"
        onclick="rejectComplaint(${index})">

        Reject

        </button>

        <button
        class="btn btn-primary btn-sm"
        onclick="viewComplaint('${c.id}')">

        View

        </button>

        </td>

        </tr>

        `;

    });

}

// Initial Load
loadComplaints(complaints);

// ===========================
// Search
// ===========================

search.addEventListener("keyup",()=>{

    let value=search.value.toLowerCase();

    let result=complaints.filter(c=>

        c.id.toLowerCase().includes(value)||

        c.category.toLowerCase().includes(value)||

        (c.name || "").toLowerCase().includes(value)

    );

    loadComplaints(result);

});

// ===========================
// Status Filter
// ===========================

filter.addEventListener("change",()=>{

    if(filter.value==="all"){

        loadComplaints(complaints);

        return;

    }

    let result=complaints.filter(c=>c.status===filter.value);

    loadComplaints(result);

});

// ===========================
// Accept
// ===========================

function acceptComplaint(index){

    complaints[index].status="Accepted";

    localStorage.setItem(

        "complaints",

        JSON.stringify(complaints)

    );

    loadComplaints(complaints);

}

// ===========================
// Reject
// ===========================

function rejectComplaint(index){

    complaints[index].status="Rejected";

    localStorage.setItem(

        "complaints",

        JSON.stringify(complaints)

    );

    loadComplaints(complaints);

}

// ===========================
// View
// ===========================

function viewComplaint(id){

    window.location.href=

    "complaint-details.html?id="+id;

}