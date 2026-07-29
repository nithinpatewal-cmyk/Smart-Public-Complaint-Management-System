document.getElementById("passwordForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const old_password = document.getElementById("oldPassword").value;
    const new_password = document.getElementById("newPassword").value;
    const confirm_password = document.getElementById("confirmNewPassword").value;

    if (new_password.length < 6) {
        showToast("Validation Error", "New password must be at least 6 characters.", "error");
        return;
    }

    if (new_password !== confirm_password) {
        showToast("Validation Error", "New passwords do not match.", "error");
        return;
    }

    try {
        const response = await fetch("http://127.0.0.1:8000/api/profile/change-password/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ old_password, new_password })
        });

        const data = await response.json();

        if (response.ok) {
            showToast("Success", "Password updated successfully!", "success");
            document.getElementById("passwordForm").reset();
        } else {
            showToast("Error", data.error || "Password update failed.", "error");
        }
    } catch (err) {
        showToast("Error", "Network connection error.", "error");
    }
});