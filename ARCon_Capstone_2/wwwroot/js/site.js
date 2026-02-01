function openCreateUserModal() {
    loadRoles();
    buildScheduleTable();

    new bootstrap.Modal(
        document.getElementById("createUserModal")
    ).show();
}

function loadRoles() {
    fetch("/admin/api/roles")
        .then(r => r.json())
        .then(data => {
            const select = document.getElementById("cuRole");
            select.innerHTML = "";
            data.forEach(r => {
                select.innerHTML += `<option value="${r.id}">${r.roleName}</option>`;
            });
        });
}

function buildScheduleTable() {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const tbody = document.getElementById("scheduleBody");
    tbody.innerHTML = "";

    days.forEach(d => {
        tbody.innerHTML += `
            <tr>
                <td>${d}</td>
                <td><input type="time" class="form-control sched-login"></td>
                <td><input type="time" class="form-control sched-logout"></td>
                <td><input type="checkbox" class="sched-rest"></td>
            </tr>`;
    });
}

function createUser() {

    const schedule = [];
    document.querySelectorAll("#scheduleBody tr").forEach(r => {
        schedule.push({
            dayOfWeek: r.children[0].innerText,
            loginTime: r.querySelector(".sched-login").value,
            logoutTime: r.querySelector(".sched-logout").value,
            isRestday: r.querySelector(".sched-rest").checked
        });
    });

    const payload = {
        userName: cuUserName.value,
        firstName: cuFirstName.value,
        lastName: cuLastName.value,
        emailAddress: cuEmail.value,
        roleId: cuRole.value,
        schedule: schedule
    };

    fetch("/admin/api/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
        .then(r => {
            if (!r.ok) throw new Error();
            alert("User created. Email sent.");
            location.reload();
        })
        .catch(() => alert("Failed to create user"));
}
