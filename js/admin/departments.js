// CivicConnect Admin - Departments Management & Provisioning Handler

document.addEventListener("DOMContentLoaded", function () {
    loadDepartmentsData();

    // Modal submit handler
    const createForm = document.getElementById("createDeptUserForm");
    if (createForm) {
        createForm.addEventListener("submit", handleCreateDepartmentUser);
    }

    // Search filter
    const searchInput = document.getElementById("searchDepartment");
    if (searchInput) {
        searchInput.addEventListener("keyup", function () {
            const value = this.value.toLowerCase();
            const rows = document.querySelectorAll("#departmentTable tr");
            rows.forEach(row => {
                row.style.display = row.innerText.toLowerCase().includes(value) ? "" : "none";
            });
        });
    }
});

async function loadDepartmentsData() {
    const table = document.getElementById("departmentTable");
    if (!table) return;

    table.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted"><span class="spinner-border spinner-border-sm me-2"></span> Loading departments...</td></tr>`;

    try {
        const [usersRes, complaintsRes] = await Promise.all([
            fetch("http://127.0.0.1:8000/api/admin/users/?role=Department"),
            fetch("http://127.0.0.1:8000/api/complaints/")
        ]);

        let deptUsers = [];
        if (usersRes.ok) {
            deptUsers = await usersRes.json();
        }

        let complaints = [];
        if (complaintsRes.ok) {
            complaints = await complaintsRes.json();
        }

        renderDepartmentTable(deptUsers, complaints);
    } catch (err) {
        console.error("Error loading department data:", err);
        table.innerHTML = `<tr><td colspan="5" class="text-center py-3 text-danger"><i class="fa-solid fa-triangle-exclamation me-1"></i> Unable to load department users from backend API.</td></tr>`;
    }
}

function renderDepartmentTable(deptUsers, complaints) {
    const table = document.getElementById("departmentTable");
    if (!table) return;

    const defaultDepts = [
        "Road Department",
        "Sanitation Department",
        "Electrical Department",
        "Water Department"
    ];

    let rowsHtml = "";
    let totalAssigned = complaints.length;
    let activeOfficers = deptUsers.filter(u => u.role === "Department").length;

    defaultDepts.forEach(deptName => {
        const officers = deptUsers.filter(u => u.department === deptName);
        const deptComplaints = complaints.filter(c => c.department === deptName);

        if (officers.length > 0) {
            officers.forEach(officer => {
                rowsHtml += `
                    <tr>
                        <td><strong class="text-dark">${deptName}</strong></td>
                        <td><span class="badge bg-primary fs-6">${officer.username}</span></td>
                        <td>${officer.email}</td>
                        <td><span class="badge bg-success">Active</span></td>
                        <td>
                            <button type="button" class="btn btn-sm btn-outline-danger" onclick="deactivateUser(${officer.id}, '${officer.username}')">
                                <i class="fa-solid fa-user-slash me-1"></i> Deactivate
                            </button>
                        </td>
                    </tr>
                `;
            });
        } else {
            rowsHtml += `
                <tr class="table-light">
                    <td><strong class="text-dark">${deptName}</strong></td>
                    <td colspan="2" class="text-muted italic"><i class="fa-solid fa-circle-info me-1"></i> No officer assigned yet</td>
                    <td><span class="badge bg-warning text-dark">Unassigned</span></td>
                    <td>
                        <button type="button" class="btn btn-sm btn-primary fw-semibold" onclick="openCreateModalForDept('${deptName}')">
                            <i class="fa-solid fa-plus me-1"></i> Assign Officer
                        </button>
                    </td>
                </tr>
            `;
        }
    });

    table.innerHTML = rowsHtml;

    // Update Counters
    const totalDeptsEl = document.getElementById("totalDepartments");
    const activeDeptsEl = document.getElementById("activeDepartments");
    const assignedComplaintsEl = document.getElementById("assignedComplaints");

    if (totalDeptsEl) totalDeptsEl.innerText = defaultDepts.length;
    if (activeDeptsEl) activeDeptsEl.innerText = activeOfficers;
    if (assignedComplaintsEl) assignedComplaintsEl.innerText = totalAssigned;
}

function openCreateModalForDept(deptName) {
    const deptSelect = document.getElementById("deptSelect");
    if (deptSelect) deptSelect.value = deptName;
    const modalEl = document.getElementById("createDeptUserModal");
    if (modalEl && window.bootstrap) {
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    }
}

async function handleCreateDepartmentUser(e) {
    e.preventDefault();

    const modalAlert = document.getElementById("modalAlert");
    modalAlert.classList.add("d-none");
    modalAlert.innerText = "";

    const dept = document.getElementById("deptSelect").value;
    const username = document.getElementById("deptUsername").value.trim();
    const email = document.getElementById("deptEmail").value.trim();
    const password = document.getElementById("deptPassword").value;
    const phone = document.getElementById("deptPhone").value.trim();

    if (!username || !email || !password) {
        modalAlert.innerText = "Please fill in all required fields (*).";
        modalAlert.classList.remove("d-none");
        return;
    }

    const saveBtn = document.getElementById("saveDeptUserBtn");
    const spinner = document.getElementById("modalSpinner");

    if (saveBtn) saveBtn.disabled = true;
    if (spinner) spinner.classList.remove("d-none");

    try {
        const response = await fetch("http://127.0.0.1:8000/api/admin/create-department-user/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: username,
                email: email,
                password: password,
                department: dept,
                phone: phone
            })
        });

        const data = await response.json();

        if (response.ok) {
            if (typeof showToast === "function") {
                showToast("Account Created", `Department account for ${username} created successfully!`, "success");
            } else {
                alert(`Department account for ${username} created successfully!`);
            }

            // Hide Modal
            const modalEl = document.getElementById("createDeptUserModal");
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) modalInstance.hide();

            // Reset form & reload
            document.getElementById("createDeptUserForm").reset();
            loadDepartmentsData();
        } else {
            let errStr = "Failed to create department user. ";
            if (typeof data === "object") {
                for (const [k, v] of Object.entries(data)) {
                    errStr += `${k}: ${Array.isArray(v) ? v.join(", ") : v} `;
                }
            }
            modalAlert.innerText = errStr;
            modalAlert.classList.remove("d-none");
        }
    } catch (err) {
        console.error("Create Dept User Error:", err);
        modalAlert.innerText = "Connection error. Make sure Django backend server is running.";
        modalAlert.classList.remove("d-none");
    } finally {
        if (saveBtn) saveBtn.disabled = false;
        if (spinner) spinner.classList.add("d-none");
    }
}

async function deactivateUser(userId, username) {
    if (!confirm(`Are you sure you want to deactivate officer account '${username}'?`)) return;

    try {
        const res = await fetch(`http://127.0.0.1:8000/api/admin/users/${userId}/`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ is_active: false })
        });
        if (res.ok) {
            if (typeof showToast === "function") showToast("Account Deactivated", `Officer ${username} account deactivated.`, "warning");
            loadDepartmentsData();
        }
    } catch (err) {
        console.error("Deactivate error:", err);
    }
}