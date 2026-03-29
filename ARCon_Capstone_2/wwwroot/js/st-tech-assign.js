let currentPage = 1;
let pageSize = 24;

let currentSearch = "";
let currentSort = "createdAt";
let currentDirection = "desc";

async function loadTechAssign() {
    const spinner = document.getElementById("loadingSpinner");
    spinner.style.display = "block";

    const url = `/api/service-transactions/tech-assign-services?page=${currentPage}&pageSize=${pageSize}&search=${currentSearch}&sortBy=${currentSort}&sortDir=${currentDirection}`;

    const res = await fetch(url);
    const result = await res.json();

    renderTable(result.data);
    renderPagination(result.totalCount);

    spinner.style.display = "none";
}

let debounceTimer;

document.getElementById("techAssignSearchInput")
    .addEventListener("input", function () {

        clearTimeout(debounceTimer);

        debounceTimer = setTimeout(() => {
            currentSearch = this.value;
            currentPage = 1;
            loadTechAssign();
        }, 400);
    }); 

function sort(column) {

    if (currentSort === column) {
        currentDirection = currentDirection === "asc" ? "desc" : "asc";
    } else {
        currentSort = column;
        currentDirection = "asc";
    }

    currentPage = 1;
    loadTechAssign();
}

function renderPagination(totalRecords) {
    const totalPages = Math.ceil(totalRecords / pageSize);
    const container = document.getElementById("pagination");

    container.innerHTML = "";

    for (let i = 1; i <= totalPages; i++) {
        container.innerHTML += `
            <li class="page-item ${i === currentPage ? "active" : ""}">
                <button class="page-link" onclick="goToPage(${i})">${i}</button>
            </li>
        `;
    }
}

function goToPage(page) {
    if (page < 1) return;
    currentPage = page;
    loadTechAssign();
}

function renderTable(data) {
    const tbody = document.getElementById("techAssignServicesTableBody");
    
    tbody.innerHTML = "";

    if (!data || data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="15" class="text-center text-muted">No data found</td>
            </tr>
        `;
        return;
    }

    data.forEach(item => {
        const scheduleLabel = getScheduleLabel(item.actualScheduledDate);
        tbody.innerHTML += `
            <tr>
                <td></td>
                <td class="text-center">${item.stRefCode ?? ""}</td>
                <td class="text-center">${item.bookingRefCode ?? ""}</td>
                <td class="text-center">${item.customerName ?? ""}</td>
                <td class="text-center fw-semibold">${scheduleLabel}</td>
                <td class="text-center">${formatDate(item.actualScheduledDate)}</td>
                <td class="text-center">${formatTime(item.actualScheduledTime)}</td>
                <td class="text-center">${formatDate(item.estimatedCompletionDate)}</td>
                <td class="text-center">${formatTime(item.estimatedCompletionTime)}</td>
                <td class="text-center">${item.techniciansRequired ?? 0}</td>
                <td class="text-center">${item.difficultyRate ?? ""}</td>
                <td class="text-center">${formatDateTime(item.createdAt)}</td>
                <td class="text-center">${item.status ?? ""}</td>
                            <td class="text-center">
                                <div class="dropdown">

                            <button class="btn btn-sm btn-outline-secondary"
                                    type="button"
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false">
                                ⋮
                            </button>
                            <ul class="dropdown-menu shadow-sm border-0 rounded-3 p-2">

                                    <!-- VIEW -->
                                    <li>
                                        <a class="dropdown-item d-flex align-items-center gap-2 py-2 rounded action-hover"
                                           href="/Admin/Services/SBooking_Summary/${item.bookingId}">
                                            <i class="bi bi-eye-fill text-primary"></i>
                                            <span class="fw-medium">View Booking</span>
                                        </a>
                                    </li>

                                    <li>
                                        <a class="dropdown-item d-flex align-items-center gap-2 py-2 rounded action-hover"
                                           href="/Admin/Services/SB_ST_Summary/${item.id}">
                                            <i class="bi bi-receipt text-info"></i>
                                            <span class="fw-medium">View Transaction</span>
                                        </a>
                                    </li>

                                    <li><hr class="dropdown-divider my-2"></li>

                                    <!-- ACTION -->
                                    <li>
                                       <button class="dropdown-item d-flex align-items-center gap-2 py-2 rounded action-hover"
                                                onclick="openAssignModal(${item.id}, ${item.no_technicians_req})">
                                            <i class="bi bi-person-gear text-success"></i>
                                            <span class="fw-medium">Assign Technician</span>
                                        </button>
                                    </li>

                                    <li>
                                        <button class="dropdown-item d-flex align-items-center gap-2 py-2 rounded action-hover-danger"
                                                title="Cancel booking"
                                                onclick="openCancelModal(${item.id})">
                                            <i class="bi bi-x-circle-fill text-danger"></i>
                                            <span class="fw-medium">Cancel Transaction</span>
                                        </button>
                                    </li>

                                </ul>
                        </div>
                    </td>
            </tr>
        `;
    });
}


function formatDate(date) {
    if (!date) return "";
    return new Date(date).toLocaleDateString();
}

function formatTime(time) {
    if (!time) return "";
    return time.substring(0, 5); // HH:mm
}

function formatDateTime(dt) {
    if (!dt) return "";
    return new Date(dt).toLocaleString();
}

document.addEventListener("DOMContentLoaded", () => {
    loadTechAssign();
}); 

document.querySelectorAll(".sortable").forEach(th => {
    th.addEventListener("click", function () {
        const column = this.dataset.column;
        sort(column);
    });
});



//////////////////////////// Assign Technician /////////////////////////

let selectedTechs = [];
let requiredCount = 0;
let currentTransactionId = null;

//Open Modal + Load Technicians
async function openAssignModal(transactionId, requiredTechs) {
    currentTransactionId = transactionId;
    requiredCount = requiredTechs;
    selectedTechs = [];

    document.getElementById("requiredTechCount").innerText = requiredTechs;
    document.getElementById("assignBtn").disabled = true;

    const container = document.getElementById("technicianList");
    container.innerHTML = `<div class="text-muted">Loading technicians...</div>`;

    try {
        const res = await fetch(`/api/service-transactions/${transactionId}/available-technicians`);
        const data = await res.json();

        requiredCount = data.requiredTechnicians;
        const techs = data.technicians;

        const container = document.getElementById("technicianList");
        container.innerHTML = "";

        document.getElementById("requiredTechCount").innerText = requiredCount;

        if (!techs.length) {
            container.innerHTML = `<div class="text-muted">No available technicians</div>`;
            return;
        }

        techs.forEach(tech => {
            container.innerHTML += `
       <div class="col-md-4">
            <div class="card tech-card p-2"
                 onclick="toggleTech(${tech.id}, this)">

                <div class="d-flex align-items-start gap-2">

                    <!-- ICON + STATUS DOT -->
                    <div class="position-relative">
                        <i class="bi bi-person-circle fs-4 text-primary"></i>

                        <span class="status-dot ${tech.is_online ? 'online' : 'offline'}"></span>
                    </div>

                    <div>
                        <div class="fw-semibold">
                            ${tech.name} 
                        </div>

                        <small class="d-block text-muted">${tech.contact_no}</small>
                        <small class="d-block text-muted">${tech.email_address}</small>
                    </div>

                </div>
            </div>
        </div>
    `;
        });

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('assignTechModal'));
        modal.show();

    } catch (err) {
        console.error(err);
        container.innerHTML = `<div class="text-danger">Error loading technicians</div>`;
    }
}

//Toggle Selection
function toggleTech(id, el) {

    if (selectedTechs.includes(id)) {
        // Remove
        selectedTechs = selectedTechs.filter(x => x !== id);
        el.classList.remove("selected");
    } else {

        // Limit check
        if (selectedTechs.length >= requiredCount) {
            showToast(`You can only select ${requiredCount} technician(s).`, "warning");
            return;
        }

        selectedTechs.push(id);
        el.classList.add("selected");
    }

    updateAssignButton();
}



document.getElementById("assignBtn").addEventListener("click", async () => {

    //block if zero
    if (selectedTechs.length === 0) {
        showToast("Please select at least one technician.", "warning");
        return;
    }

    //If less than required → show modal instead
    if (selectedTechs.length < requiredCount) {
        showConfirmModal(() => submitAssignment());
        return;
    }

    // Exact → proceed directly
    submitAssignment();
});


async function submitAssignment() {
    try {
        const res = await fetch(`/api/service-transactions/${currentTransactionId}/assign-technicians`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                technicianIds: selectedTechs
            })
        });

        if (res.ok) {
            showToast("Technicians assigned successfully!", "success");

            const modalEl = document.getElementById('assignTechModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            modal.hide();

            location.reload();
        } else {
            const errText = await res.text();
            showToast(errText || "Assignment failed.", "danger");
        }

    } catch (err) {
        console.error(err);
        showToast("Error assigning technicians.", "danger");
    }
}


//Enable / Disable Assign Button
function updateAssignButton() {
    const btn = document.getElementById("assignBtn");

    //allow less than required (but not zero)
    btn.disabled = selectedTechs.length === 0;
}


let confirmInterval; // global to prevent stacking

function showConfirmModal(callback) {
    let seconds = 5;
    const total = 5;

    const countdownText = document.getElementById("countdownText");
    const countdownBar = document.getElementById("countdownBar");
    const confirmBtn = document.getElementById("confirmSubmitBtn");

    const modalEl = document.getElementById("confirmModal");
    const modal = new bootstrap.Modal(modalEl);

    // Reset UI
    confirmBtn.disabled = true;
    countdownText.innerText = seconds;
    countdownBar.style.width = "0%";

    modal.show();

    // Clear old interval if exists
    if (confirmInterval) clearInterval(confirmInterval);

    confirmInterval = setInterval(() => {
        seconds--;

        countdownText.innerText = seconds;

        // progress bar
        const progress = ((total - seconds) / total) * 100;
        countdownBar.style.width = progress + "%";

        if (seconds <= 0) {
            clearInterval(confirmInterval);
            confirmBtn.disabled = false;
            countdownText.innerText = "0";
        }

    }, 1000);

    // Confirm click
    confirmBtn.onclick = () => {
        modal.hide();
        callback();
    };

    // Reset on close
    modalEl.addEventListener("hidden.bs.modal", () => {
        clearInterval(confirmInterval);
        confirmBtn.disabled = true;
        countdownBar.style.width = "0%";
        countdownText.innerText = "5";
    }, { once: true });
}

//////////////// Cancel Service Transaction //////////////////

let currentCancelId = null;

function openCancelModal(id) {
    currentCancelId = id;
    document.getElementById("cancelReason").value = "";

    const modal = new bootstrap.Modal(document.getElementById("cancelModal"));
    modal.show();
}

document.getElementById("proceedCancelBtn").addEventListener("click", () => {

    const reason = document.getElementById("cancelReason").value.trim();

    if (!reason) {
        showToast("Cancellation reason is required.", "warning");
        return;
    }

    // Close first modal
    const modal1 = bootstrap.Modal.getInstance(document.getElementById("cancelModal"));
    modal1.hide();

    // Open final confirm
    showFinalCancelModal(reason);
});

let cancelInterval;

function showFinalCancelModal(reason) {
    let seconds = 5;
    const total = 5;

    const text = document.getElementById("cancelCountdownText");
    const bar = document.getElementById("cancelCountdownBar");
    const btn = document.getElementById("confirmCancelBtn");

    const modalEl = document.getElementById("finalCancelModal");
    const modal = new bootstrap.Modal(modalEl);

    btn.disabled = true;
    text.innerText = seconds;
    bar.style.width = "0%";

    modal.show();

    if (cancelInterval) clearInterval(cancelInterval);

    cancelInterval = setInterval(() => {
        seconds--;

        text.innerText = seconds;
        bar.style.width = ((total - seconds) / total * 100) + "%";

        if (seconds <= 0) {
            clearInterval(cancelInterval);
            btn.disabled = false;
        }

    }, 1000);

    btn.onclick = () => {
        modal.hide();
        submitCancel(reason);
    };

    modalEl.addEventListener("hidden.bs.modal", () => {
        clearInterval(cancelInterval);
        btn.disabled = true;
        text.innerText = "5";
        bar.style.width = "0%";
    }, { once: true });
}

async function submitCancel(reason) {
    try {
        const res = await fetch(`/api/service-transactions/${currentCancelId}/cancel`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                cancellationReason: reason
            })
        });

        if (res.ok) {
            const data = await res.json();

            showToast("Transaction cancelled successfully", "success");

            if (data.paymentWarning) {
                showToast(data.paymentWarning, "warning");
            }

            location.reload();
        } else {
            const err = await res.text();
            showToast(err || "Cancel failed", "danger");
        }

    } catch (err) {
        console.error(err);
        showToast("Error cancelling transaction", "danger");
    }
}

function getScheduleLabel(dateStr) {
    if (!dateStr) return "-";

    const today = new Date();
    const sched = new Date(dateStr);

    // remove time part
    today.setHours(0, 0, 0, 0);
    sched.setHours(0, 0, 0, 0);

    const diffTime = sched - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Missed";
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";

    return `In ${diffDays} days`;
}
