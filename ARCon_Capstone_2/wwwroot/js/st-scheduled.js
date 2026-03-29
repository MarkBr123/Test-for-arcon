let currentPage = 1;
let pageSize = 24;

let currentSearch = "";
let currentSort = "createdAt";
let currentDirection = "desc";

async function loadScheduledServices() {
    const spinner = document.getElementById("loadingSpinner");
    spinner.style.display = "block";

    const url = `/api/service-transactions/scheduled?page=${currentPage}&pageSize=${pageSize}&search=${currentSearch}&sortBy=${currentSort}&sortDir=${currentDirection}`;

    const res = await fetch(url);
    const result = await res.json();

    renderTable(result.data);
    renderPagination(result.totalCount);

    spinner.style.display = "none";
}

let debounceTimer;

document.getElementById("scheduledSearchInput")
    .addEventListener("input", function () {

        clearTimeout(debounceTimer);

        debounceTimer = setTimeout(() => {
            currentSearch = this.value;
            currentPage = 1;
            loadScheduledServices();
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
    loadScheduledServices();
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
    loadScheduledServices();
}

function renderTable(data) {
    const tbody = document.getElementById("scheduledServicesTableBody");

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
                                               href="/Admin/Services/SB_ST_Summary/${item.id}">
                                                <i class="bi bi-receipt text-info"></i>
                                                <span class="fw-medium">View Transaction</span>
                                            </a>
                                        </li>

                                        <li><hr class="dropdown-divider my-2"></li>

                                        <!-- MARK AS ONGOING -->
                                        <li>
                                            <button class="dropdown-item d-flex align-items-center gap-2 py-2 rounded"
                                                    title="Mark as Ongoing"
                                                    ${item.status !== 'SCHEDULED' ? 'disabled' : ''}
                                                    onclick="openMarkAsOngoingModal(${item.id})">
                                                <i class="bi bi-play-circle text-primary"></i>
                                                <span class="fw-medium">Mark as Ongoing</span>
                                            </button>
                                        </li>

                                        <li><hr class="dropdown-divider my-2"></li>

                                        <!-- ONGOING ACTIONS -->
                                        <li>
                                            <button class="dropdown-item d-flex align-items-center gap-2 py-2 rounded"
                                                    ${item.status !== 'ONGOING' ? 'disabled' : ''}
                                                    onclick="openFailedModal(${item.id})">
                                                <i class="bi bi-x-octagon text-danger"></i>
                                                <span class="fw-medium">Failed</span>
                                            </button>
                                        </li>

                                        <li>
                                            <button class="dropdown-item d-flex align-items-center gap-2 py-2 rounded"
                                                    ${item.status !== 'ONGOING' ? 'disabled' : ''}
                                                    onclick="openPartialModal(${item.id})">
                                                <i class="bi bi-exclamation-circle text-warning"></i>
                                                <span class="fw-medium">Partially Completed</span>
                                            </button>
                                        </li>

                                        <li>
                                            <button class="dropdown-item d-flex align-items-center gap-2 py-2 rounded"
                                                    ${item.status !== 'ONGOING' ? 'disabled' : ''}
                                                    onclick="openCompleteModal(${item.id}, '${item.paymentMethod}', '${item.paymentStatus}', '${item.totalAmount}')">
                                                <i class="bi bi-check-circle text-success"></i>
                                                <span class="fw-medium">Completed</span>
                                            </button>
                                        </li>

                                        <li><hr class="dropdown-divider my-2"></li>

                                        <!-- CANCEL -->
                                        <li>
                                            <button class="dropdown-item d-flex align-items-center gap-2 py-2 rounded action-hover-danger"
                                                    title="Cancel booking"
                                                    ${item.status !== 'SCHEDULED' ? 'disabled' : ''}
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
    loadScheduledServices();
});

document.querySelectorAll(".sortable").forEach(th => {
    th.addEventListener("click", function () {
        const column = this.dataset.column;
        sort(column);
    });
});

//////////////////////////////////////////////////////                        Cancel Service Transaction                            //////////////////////////////////////////////////

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

////////////////////////////          Mark as Ongoing Service Transaction        ////////////////////////////

let currentScheduledId = null;

function openMarkAsOngoingModal(id) {
    currentScheduledId = id;

    let seconds = 5;
    const countdownText = document.getElementById("ongoingCountdownText");
    const progressBar = document.getElementById("ongoingCountdownBar");
    const confirmBtn = document.getElementById("confirmOngoingBtn");

    countdownText.innerText = seconds;
    confirmBtn.disabled = true;
    progressBar.style.width = "0%";

    const modalEl = document.getElementById("ongoingModal");
    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    const total = seconds;

    const interval = setInterval(() => {
        seconds--;

        countdownText.innerText = seconds;

        const progress = ((total - seconds) / total) * 100;
        progressBar.style.width = progress + "%";

        if (seconds <= 0) {
            clearInterval(interval);
            confirmBtn.disabled = false;
        }

    }, 1000);

    // Confirm click
    confirmBtn.onclick = () => {
        modal.hide();
        markAsOngoing();
    };

    // Reset if modal closed
    modalEl.addEventListener("hidden.bs.modal", () => {
        clearInterval(interval);
        confirmBtn.disabled = true;
        countdownText.innerText = "5";
        progressBar.style.width = "0%";
    }, { once: true });
}


async function markAsOngoing(id)
{
    try {
        const res = await fetch(`/api/service-transactions/${currentScheduledId}/ongoing`, {
            method: "PUT",
        })

        if (res.ok) {
            const data = await res.json();

            showToast("Service Transaction is now Ongoing", "success");
            loadScheduledServices();
            // notify the customer and the admin
            location.reload();
        }
        else {
            const err = await res.text();
            showToast(err || "Set to ongoing failed.", "danger")
        }
    }

    catch (err) {
        console.error(err)
        showToast("Error setting service transaction to Ongoing", "danger")
    }    
}

//auto-close dropdown before opening modal

document.querySelectorAll('.dropdown-menu.show')
    .forEach(el => el.classList.remove('show'));



////////////////////////////          Mark as Failed Service Transaction        ////////////////////////////

let toFailedTransactionId = null;

function openFailedModal(id) {
    toFailedTransactionId = id;

    // reset textarea
    document.getElementById("failureReason").value = "";

    const modal = new bootstrap.Modal(document.getElementById("failedModal"));
    modal.show();
}



document.getElementById("proceedFailedBtn").addEventListener("click", () => {
    const reason = document.getElementById("failureReason").value.trim();

    if (!reason) {
        showToast("Please enter a failure reason.", "warning");
        return;
    }

    // close first modal
    bootstrap.Modal.getInstance(document.getElementById("failedModal")).hide();

    // open confirm modal
    showFinalFailedModal();
});


function showFinalFailedModal() {
    let seconds = 5;

    const countdownText = document.getElementById("failedCountdownText");
    const progressBar = document.getElementById("failedCountdownBar");
    const confirmBtn = document.getElementById("confirmFailedBtn");

    countdownText.innerText = seconds;
    confirmBtn.disabled = true;
    progressBar.style.width = "0%";

    const modalEl = document.getElementById("finalFailedModal");
    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    const total = seconds;

    const interval = setInterval(() => {
        seconds--;

        countdownText.innerText = seconds;

        const progress = ((total - seconds) / total) * 100;
        progressBar.style.width = progress + "%";

        if (seconds <= 0) {
            clearInterval(interval);
            confirmBtn.disabled = false;
        }

    }, 1000);

    // confirm click
    confirmBtn.onclick = () => {
        modal.hide();
        submitFailed();
    };

    // reset when closed
    modalEl.addEventListener("hidden.bs.modal", () => {
        clearInterval(interval);
        confirmBtn.disabled = true;
        countdownText.innerText = "5";
        progressBar.style.width = "0%";
    }, { once: true });
}


async function submitFailed() {
    const reason = document.getElementById("failureReason").value.trim();

    try {
        const res = await fetch(`/api/service-transactions/${toFailedTransactionId}/failed`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                failure_reason: reason
            })
        });

        const result = await res.json();

        if (res.ok) {
            showToast(result.message || "Service marked as failed", "success");
            location.reload();
        } else {
            showToast(result.message || "Failed to update", "danger");
        }

    } catch (err) {
        console.error(err);
        showToast("Error marking service as failed", "danger");
    }
}


///////////////////////////////////////////////// Mark Service Transaction as Partially_Completed  /////////////////////////////////////////////////////

let toPartialTransactionId = null;

function openPartialModal(id) {
    toPartialTransactionId = id;

    // close dropdowns (UX)
    document.querySelectorAll('.dropdown-menu.show')
        .forEach(el => el.classList.remove('show'));

    // reset textarea
    document.getElementById("partialCompleteReason").value = "";

    const modal = new bootstrap.Modal(document.getElementById("partialModal"));
    modal.show();
}

document.getElementById("proceedPartialBtn").addEventListener("click", function () {
    const reason = document.getElementById("partialCompleteReason").value.trim();

    if (!reason) {
        showToast("Please enter a reason.", "warning");
        return;
    }

    // prevent spam click
    this.disabled = true;

    bootstrap.Modal.getInstance(document.getElementById("partialModal")).hide();

    showFinalPartialModal();

    setTimeout(() => this.disabled = false, 500);
});

function showFinalPartialModal() {
    let seconds = 5;

    const countdownText = document.getElementById("partialCountdownText");
    const progressBar = document.getElementById("partialCountdownBar");
    const confirmBtn = document.getElementById("confirmPartialBtn");

    countdownText.innerText = seconds;
    confirmBtn.disabled = true;
    confirmBtn.innerText = "Set as partially completed";
    progressBar.style.width = "0%";

    const modalEl = document.getElementById("finalPartialModal");
    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    const total = seconds;

    const interval = setInterval(() => {
        seconds--;

        countdownText.innerText = seconds;

        const progress = ((total - seconds) / total) * 100;
        progressBar.style.width = progress + "%";

        if (seconds <= 0) {
            clearInterval(interval);
            confirmBtn.disabled = false;
        }

    }, 1000);

    // confirm click
    confirmBtn.onclick = async () => {
        confirmBtn.disabled = true;
        confirmBtn.innerText = "Processing...";

        await submitPartial();

        modal.hide();
    };

    // reset when closed
    modalEl.addEventListener("hidden.bs.modal", () => {
        clearInterval(interval);
        confirmBtn.disabled = true;
        confirmBtn.innerText = "Set as partially completed";
        countdownText.innerText = "5";
        progressBar.style.width = "0%";
    }, { once: true });
}

async function submitPartial() {
    const reason = document.getElementById("partialCompleteReason").value.trim();

    try {
        const res = await fetch(`/api/service-transactions/${toPartialTransactionId}/partially_completed`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                partially_completed_reason: reason
            })
        });

        const result = await res.json();

        if (res.ok) {
            showToast(result.message || "Service marked as partially completed", "success");
            location.reload();
        } else {
            showToast(result.message || "Failed to update", "danger");
        }

    } catch (err) {
        console.error(err);
        showToast("Error updating partial status", "danger");
    }
}

//////////////////// Complete  /////////////////////////

let currentCompleteId = null;

function openCompleteModal(id, paymentMethod, paymentStatus, totalAmount) {
    currentCompleteId = id;

    const msg = document.getElementById("completeMessage");

    if (paymentMethod === "AFTER_SERVICE") {
        msg.innerHTML = `
            <p class="fw-semibold">Please confirm payment collection.</p>
            <p class="text-muted small">
               Make sure you have collected ₱${ Number(totalAmount).toLocaleString() } payment from the customer.
            </p>
        `;
    }
    else if (paymentMethod === "ONLINE_PAYMENT") {
        if (paymentStatus !== "PAID") {
            msg.innerHTML = `
                <p class="text-danger fw-semibold">
                    ONLINE PAYMENT NOT PAID
                </p>
                <p class="text-muted small">
                    This transaction cannot be completed until payment is confirmed.
                </p>
            `;

            document.getElementById("proceedCompleteBtn").disabled = true;
        } else {
            msg.innerHTML = `
                <p class="fw-semibold">Payment already confirmed.</p>
                <p class="text-muted small">
                    You may proceed to complete the transaction.
                </p>
            `;
        }
    }

    const modal = new bootstrap.Modal(document.getElementById("completeModal"));
    modal.show();
}

document.getElementById("proceedCompleteBtn").addEventListener("click", () => {

    bootstrap.Modal.getInstance(document.getElementById("completeModal")).hide();

    showFinalCompleteModal();
});

function showFinalCompleteModal() {
    let seconds = 5;

    const countdownText = document.getElementById("completeCountdownText");
    const progressBar = document.getElementById("completeCountdownBar");
    const confirmBtn = document.getElementById("confirmCompleteBtn");

    countdownText.innerText = seconds;
    confirmBtn.disabled = true;
    progressBar.style.width = "0%";

    const modalEl = document.getElementById("finalCompleteModal");
    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    const total = seconds;

    const interval = setInterval(() => {
        seconds--;

        countdownText.innerText = seconds;

        const progress = ((total - seconds) / total) * 100;
        progressBar.style.width = progress + "%";

        if (seconds <= 0) {
            clearInterval(interval);
            confirmBtn.disabled = false;
        }

    }, 1000);

    confirmBtn.onclick = async () => {
        confirmBtn.disabled = true;
        confirmBtn.innerText = "Processing...";

        await submitComplete();

        modal.hide();
    };

    modalEl.addEventListener("hidden.bs.modal", () => {
        clearInterval(interval);
        confirmBtn.disabled = true;
        confirmBtn.innerText = "Yes, Complete";
        countdownText.innerText = "5";
        progressBar.style.width = "0%";
    }, { once: true });
}

async function submitComplete() {
    try {
        const res = await fetch(`/api/service-transactions/${currentCompleteId}/completed`, {
            method: "PUT"
        });

        const result = await res.json();

        if (res.ok) {
            showToast("Service completed successfully!", "success");
            location.reload();
        } else {
            showToast(result.message || "Failed to complete service", "danger");
        }

    } catch (err) {
        console.error(err);
        showToast("Error completing service", "danger");
    }
}