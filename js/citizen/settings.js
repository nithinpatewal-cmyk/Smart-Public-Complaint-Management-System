// ==========================================
// CivicConnect Citizen Settings
// ==========================================

// Elements

const notifications = document.getElementById("notifications");
const locationPermission = document.getElementById("location");
const darkMode = document.getElementById("darkMode");
const language = document.getElementById("language");

// ==========================================
// Load Settings
// ==========================================

window.onload = function(){

    const settings = JSON.parse(localStorage.getItem("citizenSettings"));

    if(settings){

        notifications.checked = settings.notifications;

        locationPermission.checked = settings.location;

        darkMode.checked = settings.darkMode;

        language.value = settings.language;

        if(settings.darkMode){

            document.body.classList.add("dark-mode");

        }

    }

};

// ==========================================
// Save Settings
// ==========================================

document.getElementById("saveSettings")

.addEventListener("click",function(){

    const settings={

        notifications:notifications.checked,

        location:locationPermission.checked,

        darkMode:darkMode.checked,

        language:language.value

    };

    localStorage.setItem(

        "citizenSettings",

        JSON.stringify(settings)

    );

    if(darkMode.checked){

        document.body.classList.add("dark-mode");

    }

    else{

        document.body.classList.remove("dark-mode");

    }

    alert("Settings Saved Successfully!");

});

// ==========================================
// Dark Mode Toggle
// ==========================================

darkMode.addEventListener("change",function(){

    if(this.checked){

        document.body.classList.add("dark-mode");

    }

    else{

        document.body.classList.remove("dark-mode");

    }

});

// ==========================================
// Page Animation
// ==========================================

const card = document.querySelector(".settings-card");

card.style.opacity="0";
card.style.transform="translateY(30px)";

setTimeout(()=>{

    card.style.transition=".5s";

    card.style.opacity="1";

    card.style.transform="translateY(0)";

},300);