// ======================================
// CivicConnect Admin Settings
// ======================================

// Save Profile

document.getElementById("saveProfile")

.addEventListener("click",function(){

alert("Profile Updated Successfully.");

});

// Change Password

document.getElementById("changePassword")

.addEventListener("click",function(){

alert("Password Changed Successfully.");

});

// Save Settings

document.getElementById("saveSettings")

.addEventListener("click",function(){

alert("Settings Saved Successfully.");

});

// Page Animation

document.querySelectorAll(".settings-card")

.forEach((card,index)=>{

card.style.opacity="0";

card.style.transform="translateY(30px)";

setTimeout(()=>{

card.style.transition=".5s";

card.style.opacity="1";

card.style.transform="translateY(0)";

},index*200);

});