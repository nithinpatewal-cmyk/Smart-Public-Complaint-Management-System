// ==========================================
// CivicConnect Citizen Profile
// ==========================================

// Elements

const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const phoneInput = document.getElementById("phone");
const addressInput = document.getElementById("address");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");

// ==========================================
// Load Profile
// ==========================================

window.onload = function(){

    const profile = JSON.parse(localStorage.getItem("citizenProfile"));

    if(profile){

        nameInput.value = profile.name || "";
        emailInput.value = profile.email || "";
        phoneInput.value = profile.phone || "";
        addressInput.value = profile.address || "";

    }

};

// ==========================================
// Save Profile
// ==========================================

document.getElementById("saveProfile")

.addEventListener("click",function(){

    // Validation

    if(nameInput.value.trim()===""){

        alert("Please enter your name.");

        return;

    }

    if(emailInput.value.trim()===""){

        alert("Please enter your email.");

        return;

    }

    if(phoneInput.value.trim()===""){

        alert("Please enter your mobile number.");

        return;

    }

    if(passwordInput.value !== confirmPasswordInput.value){

        alert("Passwords do not match.");

        return;

    }

    const profile = {

        name : nameInput.value,

        email : emailInput.value,

        phone : phoneInput.value,

        address : addressInput.value,

        password : passwordInput.value

    };

    localStorage.setItem(

        "citizenProfile",

        JSON.stringify(profile)

    );

    passwordInput.value="";
    confirmPasswordInput.value="";

    alert("Profile Updated Successfully!");

});

// ==========================================
// Animation
// ==========================================

const card = document.querySelector(".profile-card");

card.style.opacity="0";
card.style.transform="translateY(30px)";

setTimeout(()=>{

card.style.transition=".5s";

card.style.opacity="1";

card.style.transform="translateY(0)";

},300);