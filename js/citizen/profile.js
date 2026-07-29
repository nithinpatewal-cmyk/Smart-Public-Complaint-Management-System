async function loadProfile() {
    try {
        const response = await fetch("http://127.0.0.1:8000/api/profile/");
        if (!response.ok) throw new Error("Failed to load profile");

        const data = await response.json();

        document.getElementById("username").value = data.username || "";
        document.getElementById("email").value = data.email || "";
        document.getElementById("phone").value = data.phone || "";
        document.getElementById("role").value = data.role || "";
        document.getElementById("address").value = data.address || "";
    } catch (err) {
        console.error("Profile load error:", err);
        showToast("Error", "Could not load profile from backend.", "error");
    }
}

document.getElementById("profileForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const address = document.getElementById("address").value.trim();

    try {
        const response = await fetch("http://127.0.0.1:8000/api/profile/", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, phone, address })
        });

        if (response.ok) {
            showToast("Profile Updated", "Your contact profile has been saved.", "success");
        } else {
            showToast("Update Failed", "Could not update profile.", "error");
        }
    } catch (err) {
        showToast("Error", "Network connection error.", "error");
    }
});

document.addEventListener("DOMContentLoaded", loadProfile);