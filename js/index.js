const modal = document.getElementById("categoryModal");

const title = document.getElementById("modalTitle");
const beforeImage = document.getElementById("beforeImage");
const afterImage = document.getElementById("afterImage");
const description = document.getElementById("modalDescription");

function openCategory(type){

    modal.style.display = "flex";

    if(type==="road"){

        title.innerText="Road Damage";

        beforeImage.src="images/before-after/road-before.jpg";

        afterImage.src="images/before-after/road-after.jpg";

        description.innerText="Pothole repaired by the Road Department.";

    }

    if(type==="garbage"){

        title.innerText="Garbage";

        beforeImage.src="images/before-after/garbage-before.jpg";

        afterImage.src="images/before-after/garbage-after.jpg";

        description.innerText="Garbage removed by the Sanitation Department.";

    }

    if(type==="streetlight"){

        title.innerText="Street Lights";

        beforeImage.src="images/before-after/streetlight-before.jpg";

        afterImage.src="images/before-after/streetlight-after.jpg";

        description.innerText="Street lights repaired successfully.";

    }

    if(type==="water"){

        title.innerText="Water Leakage";

        beforeImage.src="images/before-after/water-before.jpg";

        afterImage.src="images/before-after/water-after.jpg";

        description.innerText="Water leakage fixed by the Water Department.";

    }

}

function closeModal(){

    modal.style.display="none";

}

window.onclick=function(event){

    if(event.target==modal){

        closeModal();

    }

}