const API_URL = "http://127.0.0.1:8000/api/register/";

document.getElementById("registerForm").addEventListener("submit", async function (e) {

    e.preventDefault();

    const fullname = document.getElementById("fullname").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const email = document.getElementById("email").value.trim();
    const address = document.getElementById("address").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }

    const userData = {
        username: fullname,
        email: email,
        password: password,
        phone: phone,
        address: address,
        role: "Citizen"
    };

    try {

        const response = await fetch(API_URL, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(userData)

        });

        const data = await response.json();

        if (response.ok) {

            alert("Registration Successful!");

            window.location.href = "login.html";

        } else {

            console.log(data);

            alert("Registration Failed!\n" + JSON.stringify(data));

        }

    } catch (error) {

        console.error(error);

        alert("Cannot connect to Django Backend.");

    }

});