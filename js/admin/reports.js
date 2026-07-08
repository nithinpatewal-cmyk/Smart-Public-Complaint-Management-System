// =====================================
// CivicConnect Admin Reports
// =====================================

// Fetch Complaints
let complaints = JSON.parse(localStorage.getItem("complaints")) || [];

// Count Status

let total = complaints.length;

let pending = complaints.filter(c => c.status === "Pending").length;

let resolved = complaints.filter(c => c.status === "Resolved").length;

let rejected = complaints.filter(c => c.status === "Rejected").length;

// Update Dashboard Cards

document.getElementById("totalComplaints").innerText = total;

document.getElementById("pendingComplaints").innerText = pending;

document.getElementById("resolvedComplaints").innerText = resolved;

document.getElementById("rejectedComplaints").innerText = rejected;

// =====================================
// Department Count
// =====================================

let road = 0;
let sanitation = 0;
let electrical = 0;
let water = 0;

complaints.forEach(c => {

    switch(c.category){

        case "Road Damage":
        case "Pothole":
            road++;
            break;

        case "Garbage":
            sanitation++;
            break;

        case "Street Light":
            electrical++;
            break;

        case "Water Leakage":
            water++;
            break;

    }

});

// =====================================
// Status Chart
// =====================================

new Chart(

document.getElementById("statusChart"),

{

type:"pie",

data:{

labels:[

"Pending",

"Resolved",

"Rejected"

],

datasets:[{

data:[

pending,

resolved,

rejected

],

backgroundColor:[

"#ffc107",

"#198754",

"#dc3545"

]

}]

}

}

// =====================================

);

// =====================================
// Department Chart
// =====================================

new Chart(

document.getElementById("departmentChart"),

{

type:"bar",

data:{

labels:[

"Road",

"Sanitation",

"Electrical",

"Water"

],

datasets:[{

label:"Complaints",

data:[

road,

sanitation,

electrical,

water

],

backgroundColor:[

"#0d6efd",

"#20c997",

"#fd7e14",

"#6610f2"

]

}]

},

options:{

responsive:true,

plugins:{

legend:{

display:false

}

}

}

}

// =====================================

);

// =====================================
// Export Report (CSV)
// =====================================

document.getElementById("exportBtn")

.addEventListener("click",function(){

let csv="Complaint ID,Category,Status,Date\n";

complaints.forEach(c=>{

csv+=`${c.id},${c.category},${c.status},${c.date}\n`;

});

const blob=new Blob([csv],{

type:"text/csv"

});

const url=URL.createObjectURL(blob);

const a=document.createElement("a");

a.href=url;

a.download="CivicConnect_Report.csv";

a.click();

URL.revokeObjectURL(url);

alert("Report Exported Successfully!");

});