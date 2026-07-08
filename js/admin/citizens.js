// ======================================
// CivicConnect Admin - Citizens
// ======================================

// Demo Citizens Data
// Later this will come from Django Database

let citizens = JSON.parse(localStorage.getItem("citizens")) || [

    {
        name: "Nithin Kumar",
        email: "nithin@gmail.com",
        phone: "9876543210",
        complaints: 4,
        status: "Active"
    },

    {
        name: "Rahul Sharma",
        email: "rahul@gmail.com",
        phone: "9876501234",
        complaints: 2,
        status: "Active"
    },

    {
        name: "Priya Patel",
        email: "priya@gmail.com",
        phone: "9988776655",
        complaints: 1,
        status: "Inactive"
    }

];

// Save Demo Data
localStorage.setItem("citizens", JSON.stringify(citizens));

// ======================================
// Load Citizens
// ======================================

function loadCitizens() {

    const table = document.getElementById("citizenTable");

    table.innerHTML = "";

    citizens.forEach((citizen, index) => {

        table.innerHTML += `

        <tr>

            <td>${citizen.name}</td>

            <td>${citizen.email}</td>

            <td>${citizen.phone}</td>

            <td>${citizen.complaints}</td>

            <td>

                <span class="status ${citizen.status == "Active" ? "active-status" : "inactive-status"}">

                    ${citizen.status}

                </span>

            </td>

            <td>

                <button class="view-btn" onclick="viewCitizen(${index})">

                    View

                </button>

                <button class="delete-btn" onclick="deleteCitizen(${index})">

                    Delete

                </button>

            </td>

        </tr>

        `;

    });

    updateCards();

}

loadCitizens();

// ======================================
// Dashboard Cards
// ======================================

function updateCards(){

    document.getElementById("totalCitizens").innerText = citizens.length;

    document.getElementById("activeCitizens").innerText =
    citizens.filter(c=>c.status=="Active").length;

    let complaints = JSON.parse(localStorage.getItem("complaints")) || [];

    document.getElementById("totalComplaints").innerText =
    complaints.length;

}

// ======================================
// Search
// ======================================

document.getElementById("searchCitizen")

.addEventListener("keyup",function(){

    const value=this.value.toLowerCase();

    const rows=document.querySelectorAll("#citizenTable tr");

    rows.forEach(row=>{

        row.style.display=

        row.innerText.toLowerCase().includes(value)

        ? ""

        : "none";

    });

});

// ======================================
// View Citizen
// ======================================

function viewCitizen(index){

    const c=citizens[index];

    alert(

`Citizen Details

Name : ${c.name}

Email : ${c.email}

Phone : ${c.phone}

Complaints : ${c.complaints}

Status : ${c.status}`

);

}

// ======================================
// Delete Citizen
// ======================================

function deleteCitizen(index){

    if(confirm("Delete this citizen?")){

        citizens.splice(index,1);

        localStorage.setItem(

            "citizens",

            JSON.stringify(citizens)

        );

        loadCitizens();

    }

}