// CivicConnect Citizen Registration Handler

document.addEventListener("DOMContentLoaded", function () {
    const registerForm = document.getElementById("registerForm");
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const passwordStrengthBar = document.getElementById("passwordStrengthBar");
    const passwordHelp = document.getElementById("passwordHelp");
    const phoneInput = document.getElementById("phone");
    const submitBtn = document.getElementById("submitBtn");
    const submitSpinner = document.getElementById("submitSpinner");
    const btnIcon = document.getElementById("btnIcon");
    const alertBox = document.getElementById("alertBox");
    const successBox = document.getElementById("successBox");

    // Real-time Password Strength Meter
    if (passwordInput && passwordStrengthBar) {
        passwordInput.addEventListener("input", function () {
            const val = passwordInput.value;
            let score = 0;
            if (val.length >= 6) score += 25;
            if (val.length >= 8) score += 25;
            if (/[A-Z]/.test(val) && /[0-9]/.test(val)) score += 25;
            if (/[^A-Za-z0-9]/.test(val)) score += 25;

            passwordStrengthBar.style.width = score + "%";

            if (score <= 25) {
                passwordStrengthBar.className = "progress-bar bg-danger";
                passwordHelp.innerText = "Weak (Minimum 6 characters)";
                passwordHelp.className = "form-text small text-danger";
            } else if (score <= 50) {
                passwordStrengthBar.className = "progress-bar bg-warning";
                passwordHelp.innerText = "Fair (Add numbers or uppercase)";
                passwordHelp.className = "form-text small text-warning";
            } else if (score <= 75) {
                passwordStrengthBar.className = "progress-bar bg-info";
                passwordHelp.innerText = "Good password";
                passwordHelp.className = "form-text small text-info";
            } else {
                passwordStrengthBar.className = "progress-bar bg-success";
                passwordHelp.innerText = "Strong password!";
                passwordHelp.className = "form-text small text-success";
            }
        });
    }

    // Restrict phone input to digits
    if (phoneInput) {
        phoneInput.addEventListener("input", function () {
            this.value = this.value.replace(/\D/g, '').slice(0, 10);
        });
    }

    // Form Submit Listener
    registerForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        // Reset Alerts
        alertBox.classList.add("d-none");
        alertBox.innerHTML = "";
        successBox.classList.add("d-none");
        successBox.innerHTML = "";

        const username = document.getElementById("username").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const email = document.getElementById("email").value.trim();
        const address = document.getElementById("address").value.trim();
        const role = document.querySelector('input[name="role"]:checked')?.value;
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        // Front-end Validation Checks
        let errors = [];

        if (!username) {
            errors.push("Username is required.");
        } else if (!/^[a-zA-Z0-9_.]+$/.test(username)) {
            errors.push("Username can only contain letters, numbers, dots, and underscores.");
        }

        if (!phone || phone.length !== 10) {
            errors.push("Please enter a valid 10-digit mobile number.");
        }

        if (!email || !email.includes("@") || !email.includes(".")) {
            errors.push("Please enter a valid email address.");
        }

        if (!address) {
            errors.push("Residential address is required.");
        }

        if (!role) {
            errors.push("Please select a role.");
        }

        if (password.length < 6) {
            errors.push("Password must be at least 6 characters long.");
        }

        if (password !== confirmPassword) {
            errors.push("Password and Confirm Password do not match.");
        }

        if (errors.length > 0) {
            alertBox.innerHTML = `<strong>Registration Error:</strong><ul class="mb-0 ps-3">${errors.map(err => `<li>${err}</li>`).join("")}</ul>`;
            alertBox.classList.remove("d-none");
            return;
        }

        const userData = {
            username: username,
            email: email,
            password: password,
            confirm_password: confirmPassword,
            phone: phone,
            address: address,
            role: role
        };

        // Enable Loading State
        submitBtn.disabled = true;
        submitSpinner.classList.remove("d-none");
        btnIcon.classList.add("d-none");

        try {
            const response = await fetch("http://127.0.0.1:8000/api/register/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (response.ok) {
                successBox.innerHTML = `<strong><i class="fa-solid fa-circle-check me-1"></i> Registration Successful!</strong> Account created for <strong>${data.user?.username || username}</strong>. Redirecting to login page...`;
                successBox.classList.remove("d-none");

                if (typeof showToast === "function") {
                    showToast("Success", "Registration successful! Please log in.", "success");
                }

                setTimeout(() => {
                    window.location.href = "login.html";
                }, 1500);
            } else {
                let errMessages = [];

                if (typeof data === "object" && data !== null) {
                    if (data.error) errMessages.push(data.error);
                    if (data.detail) errMessages.push(data.detail);
                    if (data.non_field_errors) {
                        errMessages.push(...(Array.isArray(data.non_field_errors) ? data.non_field_errors : [data.non_field_errors]));
                    }

                    for (const [field, msgs] of Object.entries(data)) {
                        if (["error", "detail", "non_field_errors"].includes(field)) continue;
                        const msgStr = Array.isArray(msgs) ? msgs.join(", ") : msgs;
                        const fieldName = field.charAt(0).toUpperCase() + field.slice(1).replace("_", " ");
                        errMessages.push(`<strong>${fieldName}:</strong> ${msgStr}`);
                    }
                }

                if (errMessages.length === 0) {
                    errMessages.push("Server validation failed. Please check your inputs and try again.");
                }

                alertBox.innerHTML = `<strong>Registration Failed:</strong><ul class="mb-0 ps-3">${errMessages.map(err => `<li>${err}</li>`).join("")}</ul>`;
                alertBox.classList.remove("d-none");
            }
        } catch (error) {
            console.error("Register Network Error:", error);
            alertBox.innerHTML = `<strong>Connection Error:</strong> Unable to connect to CivicConnect backend server at <code>http://127.0.0.1:8000</code>. Please ensure the server is running.`;
            alertBox.classList.remove("d-none");
        } finally {
            submitBtn.disabled = false;
            submitSpinner.classList.add("d-none");
            btnIcon.classList.remove("d-none");
        }
    });
});
