// ===============================
// Toggle Password
// ===============================

function togglePassword() {

    const password = document.getElementById("password");

    password.type =
        password.type === "password"
        ? "text"
        : "password";
}

// ===============================
// Django Login
// ===============================

document
.getElementById("loginForm")
.addEventListener("submit", async function(e){

    e.preventDefault();

    const email = document.getElementById("email").value.trim();

    const password = document.getElementById("password").value.trim();

    const role = document.getElementById("role").value;

    try{

        const response = await fetch("http://127.0.0.1:8000/api/login/",{

            method:"POST",

            headers:{
                "Content-Type":"application/json"
            },

            body:JSON.stringify({

                email:email,
                password:password

            })

        });

        const data = await response.json();

        if(response.ok){

            localStorage.setItem("access", data.access);
localStorage.setItem("refresh", data.refresh);
localStorage.setItem("userId", data.id);
localStorage.setItem("username", data.username);
localStorage.setItem("email", data.email);
localStorage.setItem("role", data.role);

            alert("Login Successful");

            if(data.role==="Citizen"){

                window.location.href="citizen/dashboard.html";

            }

            else if(data.role==="Department"){

                window.location.href="department/dashboard.html";

            }

            else{

                window.location.href="admin/dashboard.html";

            }

        }

        else{

            alert(data.error || "Invalid Login");

        }

    }

    catch(error){

        console.log(error);

        alert("Cannot connect to Django Server");

    }

});