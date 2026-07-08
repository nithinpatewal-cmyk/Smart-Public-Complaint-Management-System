document.addEventListener("DOMContentLoaded",()=>{

console.log("Admin Dashboard Loaded");

const cards=document.querySelectorAll(".card");

cards.forEach((card,index)=>{

card.style.opacity="0";
card.style.transform="translateY(30px)";

setTimeout(()=>{

card.style.transition=".5s";
card.style.opacity="1";
card.style.transform="translateY(0)";

},index*150);

});

});