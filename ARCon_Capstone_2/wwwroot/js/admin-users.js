
let adminUserModalMode = "CREATE"; // CREATE | SUMMARY | EDIT
let currentAdminUserId = null;
let currentSearch = "";
let searchTimer;


function openCreateUserModal() {
    adminUserModalMode = "CREATE";
    resetUserModalState();
    hideCreateUserError();
    clearCreateUserFieldErrors();
    resetCreateUserValidation();  // clears errors
    resetCreateUserForm();

    // 🔹 SET TITLE
    document.getElementById("adminUserModalTitle").textContent =
        "New Admin User";

    const btn = document.getElementById("btnSubmitAdminUser");
    btn.textContent = "Create";
    btn.onclick = createUser;

    buildScheduleTable();

    new bootstrap.Modal(
        document.getElementById("createUserModal")
    ).show();
};


function toggleRestDay(cb) {
    const row = cb.closest("tr");
    row.querySelector(".sched-login").disabled = cb.checked;
    row.querySelector(".sched-logout").disabled = cb.checked;

    if (cb.checked) {
        row.querySelector(".sched-login").value = null;
        row.querySelector(".sched-logout").value = null;
    }
}



function buildScheduleTable()
{
    const days = [
        "Monday", "Tuesday", "Wednesday",
        "Thursday", "Friday", "Saturday", "Sunday"
    ];

    const tbody = document.getElementById("scheduleBody");
    tbody.innerHTML = "";

    days.forEach(d => {
        tbody.insertAdjacentHTML("beforeend", `
            <tr>
                <td class="fw-semibold">${d}</td>
                <td>
                    <input type="time"
                           class="form-control sched-login">
                </td>
                <td>
                    <input type="time"
                           class="form-control sched-logout">
                </td>
                <td class="text-center">
                    <input type="checkbox"
                           class="form-check-input sched-rest"
                           onchange="toggleRestDay(this)">
                </td>
            </tr>
        `);
    });
}

function toggleRestDay(cb) {
    const row = cb.closest("tr");
    row.querySelector(".sched-login").disabled = cb.checked;
    row.querySelector(".sched-logout").disabled = cb.checked;

    if (cb.checked) {
        row.querySelector(".sched-login").value = null;
        row.querySelector(".sched-logout").value = null;
    }
}

function createUser() {

    const userName = document.getElementById("cuUserName").value.trim();
    const firstName = document.getElementById("cuFirstName").value.trim();
    const lastName = document.getElementById("cuLastName").value.trim();
    const email = document.getElementById("cuEmail").value.trim();
    const contactNo = document.getElementById("cuContactNo").value.trim();
    const birthDay = document.getElementById("cuBirthday").value.trim();
    const homeAddress = document.getElementById("cuHomeAddress").value.trim();
    const roleId = document.getElementById("cuRole").value;
    const status = document.getElementById("cuStatus").value || "ACTIVE";

    if (!userName || !email || !roleId) {
        alert("Username, Email, and Role are required.");
        return;
    }

    const payload = {
        userName,
        firstName,
        lastName,
        emailAddress: email,
        contactNo,
        birthday: birthDay !== "" ? birthDay : null,
        Status: status,
        homeAddress,
        roleId: parseInt(roleId),
        schedule: collectSchedule()
    };

    fetch("/api/adminusers/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
        .then(async r => {
            if (!r.ok) {
                const msg = await r.text();
                throw new Error(msg);
            }

            // ✅ CLEAR VALIDATION
            resetCreateUserValidation();

            // success
            hideCreateUserError();
            alert("User created successfully.");
            location.reload();
        })
        .catch(err => {
            showCreateUserError(err.message);
            highlightCreateUserField(err.message);
        });

}

function showCreateUserError(message) {
    const box = document.getElementById("createUserError");
    box.textContent = message;
    box.classList.remove("d-none");
}

function hideCreateUserError() {
    const box = document.getElementById("createUserError");
    box.classList.add("d-none");
    box.textContent = "";
}

function clearCreateUserFieldErrors() {
    document
        .querySelectorAll("#createUserModal .is-invalid")
        .forEach(e => e.classList.remove("is-invalid"));
}

function highlightCreateUserField(message) {
    clearCreateUserFieldErrors();

    const msg = message.toLowerCase();

    if (msg.includes("username")) {
        document.getElementById("cuUserName")?.classList.add("is-invalid");
    }

    if (msg.includes("email")) {
        document.getElementById("cuEmail")?.classList.add("is-invalid");
    }

    if (msg.includes("contact")) {
        document.getElementById("cuContactNo")?.classList.add("is-invalid");
    }
}

// get all rows

let currentPage = 1;
let pageSize = 24;
let currentSortBy = "date";
let currentSortDir = "desc";


/* ================= LOAD USERS ================= */

function loadAdminUsers(page = 1) {
    currentPage = page;

    fetch(`/api/adminusers?page=${page}&pageSize=${pageSize}&sortBy=${currentSortBy}&sortDir=${currentSortDir}`)
        .then(r => {
            if (!r.ok) throw new Error("Failed to load users");
            return r.json();
        })
        .then(data => {
            renderAdminUsers(data.items);
        })
        .catch(err => {
            console.error(err);
            alert(err.message);
        });
}


/* ================= RENDER TABLE ================= */

/* ================= RENDER TABLE ================= */
function renderAdminUsers(users) {

    const tbody = document.getElementById("adminUsersTableBody");
    tbody.innerHTML = "";

    if (!users.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="13" class="text-center text-muted">
                    No users found
                </td>
            </tr>`;
        return;
    }

    users.forEach(au => {

        const rolesHtml = au.roles.length
            ? au.roles.map(r =>
                `<span class="badge bg-primary me-1">${r}</span>`
            ).join("")
            : `<span class="text-muted">—</span>`;

        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td class="fw-semibold">${au.user_name}</td>
            <td>${au.last_name}</td>
            <td>${au.first_name}</td>
            <td>${rolesHtml}</td>
            <td>${au.email_address}</td>
            <td>${au.contact_no}</td>
            <td>
                <span class="badge ${au.status === "ACTIVE"
                ? "bg-success"
                : au.status === "DISABLED"
                    ? "bg-warning"
                    : "bg-secondary"
            }">
                    ${au.status}
                </span>
            </td>
            <td>${au.home_address}</td>
            <td>${au.birthday ?? "—"}</td>
            <td>${formatDateTime(au.created_at)}</td>
            <td>${formatDateTime(au.updated_at)}</td>
            <td>${formatDateTime(au.last_login)}</td>
            <td class="text-center">
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-info details-btn">
                        Details
                    </button>
                    <button class="btn btn-outline-primary edit-btn">
                        Edit
                    </button>
                    <button class="btn btn-outline-danger archive-btn">
                        Archive
                    </button>
                </div>
            </td>
        `;

        /* 🔥 ROW CLICK → SUMMARY */
        tr.addEventListener("click", () => {
            openUserSummary(au.id);
        });

        /* 🔥 PREVENT BUTTONS FROM TRIGGERING ROW CLICK */
        tr.querySelector(".details-btn").addEventListener("click", e => {
            e.stopPropagation();
            openUserSummary(au.id);
        });

        tr.querySelector(".edit-btn").addEventListener("click", e => {
            e.stopPropagation();
            openEditUserModal(au.id);
        });

        tr.querySelector(".archive-btn").addEventListener("click", e => {
            e.stopPropagation();
            archiveUser(au.id);
        });

        tbody.appendChild(tr);
    });
}


/* ================= ACTIONS ================= */


function archiveUser(id) {
    if (!confirm("Archive this user?")) return;

    fetch(`/api/adminusers/${id}`, {
        method: "DELETE"
    })
        .then(r => {
            if (!r.ok) throw new Error("Archive failed");
            loadAdminUsers(currentPage);
        })
        .catch(err => alert(err.message));
}

/* ================= HELPERS ================= */

function formatDateTime(val) {
    if (!val) return "—";
    return new Date(val).toLocaleString();
}

//sort handler
function sortUsers(field) {
    if (currentSortBy === field) {
        currentSortDir = currentSortDir === "asc" ? "desc" : "asc";
    } else {
        currentSortBy = field;
        currentSortDir = "asc";
    }

    loadAdminUsers(currentPage);
}


//pagination
function renderPagination(totalCount) {

    const totalPages = Math.ceil(totalCount / pageSize);
    const ul = document.getElementById("pagination");

    ul.innerHTML = "";

    if (totalPages <= 1) return;

    // Previous
    ul.insertAdjacentHTML("beforeend", `
        <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
            <a class="page-link" href="#" onclick="loadAdminUsers(${currentPage - 1})">
                Previous
            </a>
        </li>
    `);

    for (let i = 1; i <= totalPages; i++) {
        ul.insertAdjacentHTML("beforeend", `
            <li class="page-item ${i === currentPage ? "active" : ""}">
                <a class="page-link" href="#" onclick="loadAdminUsers(${i})">
                    ${i}
                </a>
            </li>
        `);
    }

    // Next
    ul.insertAdjacentHTML("beforeend", `
        <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
            <a class="page-link" href="#" onclick="loadAdminUsers(${currentPage + 1})">
                Next
            </a>
        </li>
    `);
}

// end get all rows



//archive user API
function archiveUser(id) {

    if (!confirm("Are you sure you want to archive this user? This user will not show on the list.")) {
        return;
    }

    fetch(`/api/adminusers/${id}`, {
        method: "DELETE"
    })
        .then(async r => {
            if (!r.ok) {
                const msg = await r.text();
                throw new Error(msg || "Archive failed");
            }
            return r.json();
        })
        .then(res => {
            console.log("Archived:", res);

            // reload current page (pagination-safe)
            loadAdminUsers(currentPage);
        })
        .catch(err => {
            console.error(err);
            alert(err.message);
        });
}
//end archive user API



// SUMMARY API {ID}
//Helper: Make (HTML) Modal Read-Only

function setModalReadOnly(readOnly) {
    document
        .querySelectorAll(
            "#createUserModal input, #createUserModal select, #createUserModal textarea"
        )
        .forEach(el => {
            el.disabled = readOnly;
        });

    // Hide save button in summary mode
    document
        .getElementById("btnSubmitAdminUser")
        .classList.toggle("d-none", readOnly);
}

//Populate Schedule (Read-Only)
function populateScheduleSummary(schedule) {
    buildScheduleTable();

    const rows = document.querySelectorAll("#scheduleBody tr");

    rows.forEach(row => {
        const day = row.children[0].innerText;
        const data = schedule.find(s => s.day_of_week === day);
        if (!data) return;

        const restCb = row.querySelector(".sched-rest");
        const login = row.querySelector(".sched-login");
        const logout = row.querySelector(".sched-logout");

        restCb.checked = data.is_restday;
        login.value = data.login_time?.substring(0, 5) ?? "";
        logout.value = data.logout_time?.substring(0, 5) ?? "";

        // 🔒 READ ONLY
        restCb.disabled = true;
        login.disabled = true;
        logout.disabled = true;
    });
}

//Open Summary Modal(MAIN FUNCTION) - This is the only function you call
function openUserSummary(id) {
    adminUserModalMode = "SUMMARY";
    currentAdminUserId = id;
    resetUserModalState(); // start clean


    // 🔹 SET TITLE
    document.getElementById("adminUserModalTitle").textContent =
        "Admin User Summary";

    //FIX openUserSummary() (SET READ-ONLY MODE)
    // Disable everything


    // Hide create button
    const btn = document.getElementById("btnSubmitAdminUser");
    if (btn) btn.classList.add("d-none");


    fetch(`/api/adminusers/${id}/summary`)
        .then(r => {
            if (!r.ok) throw new Error("Failed to load user summary");
            return r.json();
        })
        .then(au => {

            // Basic info
            document.getElementById("cuUserName").value = au.user_name;
            document.getElementById("cuFirstName").value = au.first_name;
            document.getElementById("cuLastName").value = au.last_name;
            document.getElementById("cuEmail").value = au.email_address;
            document.getElementById("cuContactNo").value = au.contact_no ?? "";
            document.getElementById("cuHomeAddress").value = au.home_address ?? "";
            document.getElementById("cuBirthday").value =
                au.birthday?.split("T")[0] ?? "";

            // Status dropdown
            document.getElementById("cuStatus").value = au.status;

            // Roles (dropdown hidden, text shown)
            document.getElementById("cuRole").classList.add("d-none");
            const roleText = document.getElementById("roleSummaryText");
            roleText.textContent = au.roles.join(", ");
            roleText.classList.remove("d-none");

            // Schedule
            populateScheduleSummary(au.schedule);

            // 🔒 READ ONLY MODE
            setModalReadOnly(true);

            new bootstrap.Modal(
                document.getElementById("createUserModal")
            ).show();
        })
        .catch(err => {
            console.error(err);
            alert(err.message);
        });
}

//this will reset the modals like "clear"
// 🔄 FULL RESET — called BEFORE opening modal in ANY mode
function resetUserModalState() {

    /* ===============================
       ENABLE ALL FIELDS
    =============================== */
    document
        .querySelectorAll(
            "#createUserModal input, #createUserModal select, #createUserModal textarea"
        )
        .forEach(el => {
            el.disabled = false;
            el.classList.remove("is-invalid");
        });

    /* ===============================
       CLEAR INPUT VALUES
    =============================== */
    document
        .querySelectorAll("#createUserModal input, #createUserModal textarea")
        .forEach(el => {
            el.value = "";
        });

    /* ===============================
       RESET SELECTS
    =============================== */
    const roleSelect = document.getElementById("cuRole");
    if (roleSelect) {
        roleSelect.value = "";
        roleSelect.classList.remove("d-none");
    }

    const statusSelect = document.getElementById("cuStatus");
    if (statusSelect) {
        statusSelect.value = "ACTIVE";
    }

    /* ===============================
       ROLE SUMMARY TEXT
    =============================== */
    const roleText = document.getElementById("roleSummaryText");
    if (roleText) {
        roleText.classList.add("d-none");
        roleText.textContent = "";
    }

    /* ===============================
       RESET SCHEDULE TABLE
    =============================== */
    const scheduleBody = document.getElementById("scheduleBody");
    if (scheduleBody) {
        scheduleBody.innerHTML = "";
    }

    /* ===============================
       RESET SUBMIT BUTTON
    =============================== */
    const submitBtn = document.getElementById("btnSubmitAdminUser");
    if (submitBtn) {
        submitBtn.classList.remove("d-none");
        submitBtn.disabled = false;
        submitBtn.textContent = "Create User";
        submitBtn.onclick = null; // 🔥 IMPORTANT
    }

    /* ===============================
       CLEAR ERROR BOX (IF ANY)
    =============================== */
    const errorBox = document.getElementById("createUserError");
    if (errorBox) {
        errorBox.classList.add("d-none");
        errorBox.textContent = "";
    }
}



function resetCreateUserValidation() {
    // Hide error box
    hideCreateUserError();

    // Remove invalid styles
    document
        .querySelectorAll("#createUserModal .is-invalid")
        .forEach(el => el.classList.remove("is-invalid"));
}

function resetCreateUserForm() {
    document
        .querySelectorAll("#createUserModal input, #createUserModal textarea")
        .forEach(el => {
            el.value = "";
        });

    // Reset selects explicitly
    const role = document.getElementById("cuRole");
    if (role) role.value = "";

    const status = document.getElementById("cuStatus");
    if (status) status.value = "ACTIVE";

    // Clear schedule
    const scheduleBody = document.getElementById("scheduleBody");
    if (scheduleBody) scheduleBody.innerHTML = "";
}


////////////////////// Update User //////////////////////////

//FIELD POPULATION HELPER
function fillAdminUserFields(au) {

    // BASIC INFO
    document.getElementById("cuUserName").value = au.user_name ?? "";
    document.getElementById("cuFirstName").value = au.first_name ?? "";
    document.getElementById("cuLastName").value = au.last_name ?? "";
    document.getElementById("cuEmail").value = au.email_address ?? "";
    document.getElementById("cuContactNo").value = au.contact_no ?? "";
    document.getElementById("cuHomeAddress").value = au.home_address ?? "";

    // Birthday (YYYY-MM-DD)
    document.getElementById("cuBirthday").value =
        au.birthday ? au.birthday.split("T")[0] : "";

    // STATUS (dropdown)
    const status = document.getElementById("cuStatus");
    if (status) {
        status.value = au.status;
    }

    // ROLE (single role)
    const roleSelect = document.getElementById("cuRole");
    if (roleSelect && au.roles && au.roles.length > 0) {
        roleSelect.value = au.roles[0]; // role ID OR name (depends on your API)
    }
}


// This is the complete OpenEditModal(id)
function openEditUserModal(id) {

    adminUserModalMode = "EDIT";
    currentAdminUserId = id;

    // 🔄 RESET EVERYTHING FIRST
    resetUserModalState();

    // 📝 SET MODAL TITLE
    document.getElementById("adminUserModalTitle").textContent =
        "Edit Admin User";

    // 🔘 CONFIGURE SUBMIT BUTTON
    const submitBtn = document.getElementById("btnSubmitAdminUser");
    submitBtn.textContent = "Save Changes";
    submitBtn.classList.remove("d-none");
    submitBtn.onclick = () => updateUser(id);

    // 📡 FETCH USER SUMMARY (REUSE SUMMARY API)
    fetch(`/api/adminusers/${id}/summary`)
        .then(r => {
            if (!r.ok) throw new Error("Failed to load admin user");
            return r.json();
        })
        .then(au => {

            // 🧩 POPULATE BASIC + ROLE + STATUS
            fillAdminUserFields(au);

            // 📅 POPULATE SCHEDULE (EDITABLE)
            buildScheduleTable();

            if (au.schedule && au.schedule.length > 0) {
                const rows = document.querySelectorAll("#scheduleBody tr");

                rows.forEach(row => {
                    const day = row.children[0].innerText;
                    const data = au.schedule.find(s => s.day_of_week === day);
                    if (!data) return;

                    const restCb = row.querySelector(".sched-rest");
                    const login = row.querySelector(".sched-login");
                    const logout = row.querySelector(".sched-logout");

                    restCb.checked = data.is_restday;
                    login.value = data.login_time
                        ? data.login_time.substring(0, 5)
                        : "";
                    logout.value = data.logout_time
                        ? data.logout_time.substring(0, 5)
                        : "";

                    // enable editing
                    restCb.disabled = false;
                    login.disabled = data.is_restday;
                    logout.disabled = data.is_restday;
                });
            }

            // 🚀 SHOW MODAL
            new bootstrap.Modal(
                document.getElementById("createUserModal")
            ).show();
        })
        .catch(err => {
            console.error(err);
            alert(err.message);
        });
}


function collectSchedule() {
    const schedule = [];

    document.querySelectorAll("#scheduleBody tr").forEach(row => {
        const day = row.children[0].innerText;
        const isRest = row.querySelector(".sched-rest").checked;

        const login = row.querySelector(".sched-login").value;
        const logout = row.querySelector(".sched-logout").value;

        schedule.push({
            dayOfWeek: day,
            loginTime: isRest || !login ? null : login + ":00",
            logoutTime: isRest || !logout ? null : logout + ":00",
            isRestday: isRest
        });
    });

    return schedule;
}



//This will get the edited/updated data
function updateUser(id) {

    if (!id) {
        alert("Invalid user ID");
        return;
    }


    const userName = document.getElementById("cuUserName").value.trim();
    const firstName = document.getElementById("cuFirstName").value.trim();
    const lastName = document.getElementById("cuLastName").value.trim();
    const email = document.getElementById("cuEmail").value.trim();
    const contactNo = document.getElementById("cuContactNo").value.trim();
    const birthDay = document.getElementById("cuBirthday").value.trim();
    const homeAddress = document.getElementById("cuHomeAddress").value.trim();
    const roleId = document.getElementById("cuRole").value;
    const status = document.getElementById("cuStatus").value || "ACTIVE";

    if (!userName || !email || !roleId) {
        alert("Username, Email, and Role are required.");
        return;
    }

    const payload = {
        userName,
        firstName,
        lastName,
        emailAddress: email,
        contactNo,
        birthday: birthDay !== "" ? birthDay : null,
        Status: status,
        homeAddress,
        roleId: parseInt(roleId),
        schedule: collectSchedule()
    };

    fetch(`/api/adminusers/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    })
        .then(async r => {
            if (!r.ok) {
                const msg = await r.text();
                throw new Error(msg || "Update failed");
            }
            return r.text();
        })
        .then(() => {
            alert("Admin user updated successfully");

            bootstrap.Modal
                .getInstance(document.getElementById("createUserModal"))
                .hide();

            loadAdminUsers(); // refresh table
        })
        .catch(err => {
            console.error(err);
            alert(err.message);
        });
}

///// search functions

function searchAdminUsers() {
    clearTimeout(searchTimer);

    searchTimer = setTimeout(() => {
        currentSearch = document.getElementById("searchInput").value.trim();

        // 🔥 reload users with search applied
        loadAdminUsers(1); // reset to page 1
    }, 300); // debounce
}

function loadAdminUsers(page = 1) {

    const params = new URLSearchParams({
        page,
        pageSize,
        sortBy: currentSortBy,
        sortDir: currentSortDir,
        search: currentSearch
    });

    fetch(`/api/adminusers?${params.toString()}`)
        .then(r => r.json())
        .then(res => {
            renderAdminUsers(res.items);
            renderPagination(res.totalCount);
        });
}



/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", () => {
    loadAdminUsers();

    // 🔥 Clear validation when modal is closed (Cancel / X / backdrop)
    const modalEl = document.getElementById("createUserModal");
    if (modalEl) {
        modalEl.addEventListener("hidden.bs.modal", () => {
            resetCreateUserValidation();
        });
    }
});
