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

    const assignBtn = document.getElementById("assignBtn");

    if (assignBtn) {
        assignBtn.addEventListener("click", async () => {
            if (selectedTechs.length === 0) {
                showToast("Please select at least one technician.", "warning");
                return;
            }

            if (selectedTechs.length < requiredCount) {
                showConfirmModal(() => submitAssignment());
                return;
            }

            try {
                await submitAssignment();
                showToast("Assigned successfully!", "success");
                setTimeout(() => location.reload(), 800);
            } catch (err) {
                showToast(err.message, "danger");
            }
        });
    }
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

// ================= OPEN MODAL =================
async function openAssignModal(transactionId, requiredTechs) {

    currentTransactionId = transactionId;
    requiredCount = requiredTechs;
    selectedTechs = [];

    // ✅ SAFE ELEMENT GETTERS
    const assignBtn = document.getElementById("assignBtn");
    const countEl = document.getElementById("selectedTechCount");
    const requiredEl = document.getElementById("requiredTechCount");
    const container = document.getElementById("technicianList");
    const modalEl = document.getElementById("assignTechModal");

    // ❌ HARD STOP if container missing (THIS FIXES YOUR ERROR)
    if (!container || !modalEl) {
        console.error("Modal or technicianList not found in DOM");
        return;
    }

    // Reset UI
    if (assignBtn) assignBtn.disabled = true;
    if (countEl) countEl.innerText = `0 / ${requiredCount} selected`;
    if (requiredEl) requiredEl.innerText = requiredCount;

    container.innerHTML = `<div class="text-muted">Loading technicians...</div>`;

    try {
        const res = await fetch(`/api/service-transactions/${transactionId}/available-technicians`);
        const data = await res.json();

        requiredCount = data.requiredTechnicians;
        const techs = data.technicians;

        // Update required count safely
        if (requiredEl) requiredEl.innerText = requiredCount;

        // Clear container safely
        container.innerHTML = "";

        if (!techs || techs.length === 0) {
            container.innerHTML = `<div class="text-muted">No available technicians</div>`;
            return;
        }

        // ✅ BUILD USING JOIN (FASTER + SAFER THAN +=)
        const html = techs.map(tech => `
            <div class="col-md-4">
                <div class="card tech-card p-2 position-relative"
                     onclick="toggleTech(${tech.id}, this)">

                    <div class="d-flex align-items-start gap-2">

                        <div class="position-relative">
                            <i class="bi bi-person-circle fs-4 text-primary"></i>
                            <span class="status-dot ${tech.is_online ? 'online' : 'offline'}"></span>
                        </div>

                        <div>
                            <div class="fw-semibold">${tech.name}</div>
                            <small class="d-block text-muted">${tech.contact_no}</small>
                            <small class="d-block text-muted">${tech.email_address}</small>
                        </div>

                    </div>
                </div>
            </div>
        `).join("");

        container.innerHTML = html;

        // Show modal AFTER everything is ready
        const modal = new bootstrap.Modal(modalEl);
        modal.show();

        // Ensure UI sync
        setTimeout(() => updateAssignButton(), 50);

    } catch (err) {
        console.error(err);
        container.innerHTML = `<div class="text-danger">Error loading technicians</div>`;
    }
}

// ================= TOGGLE =================
function toggleTech(id, el) {

    if (selectedTechs.includes(id)) {
        selectedTechs = selectedTechs.filter(x => x !== id);
        el.classList.remove("selected");
    } else {

        if (selectedTechs.length >= requiredCount) {
            showToast(`You can only select ${requiredCount} technician(s).`, "warning");
            return;
        }

        selectedTechs.push(id);
        el.classList.add("selected");
    }

    updateAssignButton();
}

// ================= ASSIGN BUTTON =================
document.getElementById("assignBtn").addEventListener("click", async () => {

    if (selectedTechs.length === 0) {
        showToast("Please select at least one technician.", "warning");
        return;
    }

    if (selectedTechs.length < requiredCount) {
        showConfirmModal(() => submitAssignment());
        return;
    }

    try {
        await submitAssignment();
        showToast("Assigned successfully!", "success");

        setTimeout(() => location.reload(), 800);
    } catch (err) {
        showToast(err.message, "danger");
    }
});

// ================= SUBMIT =================
async function submitAssignment() {
    const res = await fetch(`/api/service-transactions/${currentTransactionId}/assign-technicians`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            technicianIds: selectedTechs
        })
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Assignment failed.");
    }

    const modalEl = document.getElementById('assignTechModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    modal?.hide();
}

// ================= UPDATE BUTTON + COUNTER =================
function updateAssignButton() {
    const btn = document.getElementById("assignBtn");
    if (btn) {
        btn.disabled = selectedTechs.length === 0;
    }

    const countEl = document.getElementById("selectedTechCount");

    // ✅ FIX: prevent crash
    if (countEl) {
        countEl.innerText = `${selectedTechs.length} / ${requiredCount} selected`;

        // optional visual state
        countEl.className =
            selectedTechs.length === requiredCount
                ? "badge bg-success"
                : "badge bg-light text-dark";
    }
}

// ================= CONFIRM MODAL =================
let confirmInterval;

function showConfirmModal(callback) {
    let seconds = 5;
    const total = 5;

    const countdownText = document.getElementById("countdownText");
    const countdownBar = document.getElementById("countdownBar");
    const confirmBtn = document.getElementById("confirmSubmitBtn");

    const modalEl = document.getElementById("confirmModal");
    const modal = new bootstrap.Modal(modalEl);

    confirmBtn.disabled = true;
    countdownText.innerText = seconds;
    countdownBar.style.width = "0%";

    modal.show();

    if (confirmInterval) clearInterval(confirmInterval);

    confirmInterval = setInterval(() => {
        seconds--;

        countdownText.innerText = seconds;
        countdownBar.style.width = ((total - seconds) / total) * 100 + "%";

        if (seconds <= 0) {
            clearInterval(confirmInterval);
            confirmBtn.disabled = false;
        }

    }, 1000);

    // ✅ FIX: await callback + reload AFTER
    confirmBtn.onclick = async () => {
        confirmBtn.disabled = true;

        try {
            await callback();
            modal.hide();

            showToast("Assigned successfully!", "success");

            setTimeout(() => location.reload(), 800);

        } catch (err) {
            showToast(err.message, "danger");
            confirmBtn.disabled = false;
        }
    };

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
    confirmBtn.innerText = "Please wait...";
    countdownText.innerText = seconds;
    countdownBar.style.width = "0%";

    modal.show();

    // Clear old interval
    if (confirmInterval) clearInterval(confirmInterval);

    confirmInterval = setInterval(() => {
        seconds--;

        countdownText.innerText = seconds;

        const progress = ((total - seconds) / total) * 100;
        countdownBar.style.width = progress + "%";

        if (seconds <= 0) {
            clearInterval(confirmInterval);
            confirmBtn.disabled = false;
            confirmBtn.innerText = "Confirm";
        }

    }, 1000);

    // ✅ CONFIRM CLICK (FULL FIX)
    confirmBtn.onclick = async () => {
        confirmBtn.disabled = true;
        confirmBtn.innerText = "Processing...";

        try {
            await callback(); // wait for API
            modal.hide();

            // ✅ SUCCESS FEEDBACK
            showToast("Action completed successfully!", "success");

            // ✅ REFRESH PAGE
            setTimeout(() => {
                location.reload();
            }, 800);

        } catch (err) {
            console.error(err);

            showToast("Something went wrong. Please try again.", "danger");

            confirmBtn.disabled = false;
            confirmBtn.innerText = "Confirm";
        }
    };

    // Reset on close
    modalEl.addEventListener("hidden.bs.modal", () => {
        clearInterval(confirmInterval);
        confirmBtn.disabled = true;
        confirmBtn.innerText = "Confirm";
        countdownBar.style.width = "0%";
        countdownText.innerText = "5";
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

function showToast(message, type = "success", delay = 3000) {

    let container = document.getElementById("toastContainer");

    // ✅ FIX: auto-create if missing
    if (!container) {
        container = document.createElement("div");
        container.id = "toastContainer";
        container.className = "toast-container position-fixed top-0 end-0 p-3";
        container.style.zIndex = "9999";
        document.body.appendChild(container);
    }

    const bgClass = {
        success: "bg-success",
        error: "bg-danger",
        warning: "bg-warning text-dark",
        info: "bg-info text-dark"
    }[type] || "bg-secondary";

    const toastEl = document.createElement("div");
    toastEl.className = `toast align-items-center text-white ${bgClass} border-0`;
    toastEl.role = "alert";

    toastEl.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;

    container.appendChild(toastEl);

    const toast = new bootstrap.Toast(toastEl, { delay });
    toast.show();

    toastEl.addEventListener("hidden.bs.toast", () => {
        toastEl.remove();
    });
}