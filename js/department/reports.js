// =====================================
// CivicConnect Department Reports
// =====================================

// Get Complaints
let complaints = JSON.parse(localStorage.getItem("complaints")) || [];

// Dashboard Counts
let total = complaints.length;

let pending = complaints.filter(c => c.status === "Pending").length;

let progress = complaints.filter(c => c.status === "In Progress").length;

let resolved = complaints.filter(c => c.status === "Resolved").length;

// Update Cards

document.getElementById("totalComplaints").innerText = total;

document.getElementById("pendingComplaints").innerText = pending;

document.getElementById("progressComplaints").innerText = progress;

document.getElementById("resolvedComplaints").innerText = resolved;

// =====================================
// Status Pie Chart
// =====================================

new Chart(

document.getElementById("statusChart"),

{

type:"pie",

data:{

labels:[

"Pending",

"In Progress",

"Resolved"

],

datasets:[{

data:[

pending,

progress,

resolved

],

backgroundColor:[

"#ffc107",

"#0dcaf0",

"#198754"

]

}]

}

}

);

// =====================================
// Monthly Chart
// =====================================

const monthlyData = new Array(12).fill(0);

complaints.forEach(c=>{

if(c.date){

const month = new Date(c.date).getMonth();

if(!isNaN(month)){

monthlyData[month]++;

}

}

});

new Chart(

document.getElementById("monthlyChart"),

{

type:"bar",

data:{

labels:[

"Jan","Feb","Mar","Apr","May","Jun",

"Jul","Aug","Sep","Oct","Nov","Dec"

],

datasets:[{

label:"Complaints",

data:monthlyData,

backgroundColor:"#1565d8"

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

);

// =====================================
// Download Report
// =====================================

document.getElementById("downloadReport")

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

a.download="Department_Report.csv";

a.click();

URL.revokeObjectURL(url);

alert("Department Report Downloaded Successfully.");

});