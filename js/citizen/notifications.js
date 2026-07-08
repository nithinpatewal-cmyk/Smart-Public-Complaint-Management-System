// ==========================================
// CivicConnect Notifications
// ==========================================

// Get Complaints
let complaints = JSON.parse(localStorage.getItem("complaints")) || [];

const container = document.getElementById("notificationContainer");

// ==========================================
// Load Notifications
// ==========================================

function loadNotifications(){

    container.innerHTML = "";

    if(complaints.length === 0){

        container.innerHTML = `

        <div class="empty">

            <i class="fa-solid fa-bell-slash"></i>

            <h2>No Notifications</h2>

            <p>You don't have any notifications yet.</p>

        </div>

        `;

        return;

    }

    complaints.slice().reverse().forEach(c=>{

        let icon = "fa-circle-info";
        let title = "";
        let message = "";

        switch(c.status){

            case "Pending":

                icon = "fa-clock";

                title = "Complaint Submitted";

                message = `Your complaint (${c.id}) has been submitted successfully and is waiting for admin approval.`;

                break;

            case "In Progress":

                icon = "fa-person-digging";

                title = "Work Started";

                message = `Your complaint (${c.id}) is currently being handled by the department.`;

                break;

            case "Resolved":

                icon = "fa-circle-check";

                title = "Complaint Resolved";

                message = `Great news! Your complaint (${c.id}) has been resolved successfully.`;

                break;

            case "Rejected":

                icon = "fa-circle-xmark";

                title = "Complaint Rejected";

                message = `Your complaint (${c.id}) has been rejected by the administrator.`;

                break;

        }

        container.innerHTML += `

        <div class="notification">

            <i class="fa-solid ${icon}"></i>

            <div class="notification-content">

                <h3>${title}</h3>

                <p>${message}</p>

                <span>

                    ${c.date} &nbsp; ${c.time}

                </span>

            </div>

        </div>

        `;

    });

}

loadNotifications();

// ==========================================
// Clear Notifications
// ==========================================

document.getElementById("clearNotifications")

.addEventListener("click",function(){

    if(confirm("Clear all notifications?")){

        container.innerHTML = `

        <div class="empty">

            <i class="fa-solid fa-bell-slash"></i>

            <h2>No Notifications</h2>

            <p>Notifications cleared successfully.</p>

        </div>

        `;

    }

});