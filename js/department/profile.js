// =====================================
// CivicConnect Department Profile
// =====================================

// Get Elements

const officerName = document.getElementById("officerName");
const department = document.getElementById("department");
const email = document.getElementById("email");
const phone = document.getElementById("phone");
const password = document.getElementById("password");

// =====================================
// Load Profile
// =====================================

window.onload = function(){

    const profile = JSON.parse(localStorage.getItem("departmentProfile"));

    if(profile){

        officerName.value = profile.officerName;

        department.value = profile.department;

        email.value = profile.email;

        phone.value = profile.phone;

    }

};

// =====================================
// Save Profile
// =====================================

document.getElementById("saveProfile")

.addEventListener("click",function(){

    const profile = {

        officerName : officerName.value,

        department : department.value,

        email : email.value,

        phone : phone.value,

        password : password.value

    };

    localStorage.setItem(

        "departmentProfile",

        JSON.stringify(profile)

    );

    alert("Profile Updated Successfully!");

    password.value="";

});

// =====================================
// Card Animation
// =====================================

const card = document.querySelector(".profile-card");

card.style.opacity="0";
card.style.transform="translateY(30px)";

setTimeout(()=>{

card.style.transition=".6s";

card.style.opacity="1";

card.style.transform="translateY(0)";

},300);