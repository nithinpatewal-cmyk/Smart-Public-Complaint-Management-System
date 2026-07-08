// ======================================
// CivicConnect Admin - Departments
// ======================================

// Department Data
let departments = [

    {
        name: "Road Department",
        head: "Ramesh Kumar",
        complaints: 0,
        status: "Active"
    },

    {
        name: "Sanitation Department",
        head: "Suresh Patil",
        complaints: 0,
        status: "Active"
    },

    {
        name: "Electrical Department",
        head: "Anita Sharma",
        complaints: 0,
        status: "Active"
    },

    {
        name: "Water Department",
        head: "Mahesh Rao",
        complaints: 0,
        status: "Active"
    }

];

// ======================================
// Count Assigned Complaints
// ======================================

const complaints = JSON.parse(localStorage.getItem("complaints")) || [];

complaints.forEach(c=>{

    switch(c.category){

        case "Road Damage":
        case "Pothole":
            departments[0].complaints++;
            break;

        case "Garbage":
            departments[1].complaints++;
            break;

        case "Street Light":
            departments[2].complaints++;
            break;

        case "Water Leakage":
            departments[3].complaints++;
            break;

    }

});

// ======================================
// Load Departments
// ======================================

function loadDepartments(){

    const table=document.getElementById("departmentTable");

    table.innerHTML="";

    departments.forEach((d,index)=>{

        table.innerHTML+=`

<tr>

<td>${d.name}</td>

<td>${d.head}</td>

<td>${d.complaints}</td>

<td>

<span class="status ${d.status=="Active" ? "active-status":"inactive-status"}">

${d.status}

</span>

</td>

<td>

<button class="view-btn"

onclick="viewDepartment(${index})">

View

</button>

<button class="edit-btn"

onclick="editDepartment(${index})">

Edit

</button>

</td>

</tr>

`;

    });

    updateCards();

}

loadDepartments();

// ======================================
// Dashboard Cards
// ======================================

function updateCards(){

    document.getElementById("totalDepartments").innerText=

    departments.length;

    document.getElementById("activeDepartments").innerText=

    departments.filter(d=>d.status=="Active").length;

    let total=0;

    departments.forEach(d=>{

        total+=d.complaints;

    });

    document.getElementById("assignedComplaints").innerText=

    total;

}

// ======================================
// Search
// ======================================

document.getElementById("searchDepartment")

.addEventListener("keyup",function(){

    const value=this.value.toLowerCase();

    const rows=document.querySelectorAll("#departmentTable tr");

    rows.forEach(row=>{

        row.style.display=

        row.innerText.toLowerCase().includes(value)

        ? ""

        : "none";

    });

});

// ======================================
// View
// ======================================

function viewDepartment(index){

    const d=departments[index];

    alert(

`Department

Name : ${d.name}

Head : ${d.head}

Complaints : ${d.complaints}

Status : ${d.status}`

);

}

// ======================================
// Edit
// ======================================

function editDepartment(index){

    const head=prompt(

"Enter New Department Head",

departments[index].head

);

    if(head){

        departments[index].head=head;

        loadDepartments();

    }

}