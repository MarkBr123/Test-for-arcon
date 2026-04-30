let currentPage = 1;
let pageSize = 24;
let sortBy = "createdAt";
let sortDir = "desc";
let search = "";
let debounceTimer;

// ================= LOADING SPINNER =================
function showSpinner() {
    document.getElementById("loadingSpinner").style.display = "block";
}

function hideSpinner() {
    document.getElementById("loadingSpinner").style.display = "none";
}

// ================= LOAD DATA =================


/// Parent ROw
async function loadData() {
    showSpinner();

    const res = await fetch(`/api/service-transactions/for-confimation-services?page=${currentPage}&pageSize=${pageSize}&sortBy=${sortBy}&sortDir=${sortDir}&search=${search}`);
    const result = await res.json();

    const tbody = document.getElementById("pendingServicesTableBody");
    tbody.innerHTML = "";

    if (result.data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-muted">No data found</td>
            </tr>
        `;
    }

    result.data.forEach(item => {
        tbody.innerHTML += `
    <tr>
       <td class="text-center">
            <span class="expand-arrow"
                  onclick="toggleRow(${item.id}, this)">
                ▶
            </span>
        </td>
        <td class="text-center">${item.referenceCode ?? ""}</td>
        <td class="text-center">${item.customerName ?? ""}</td>
         <td class="text-center">${item.businessName ?? ""}</td>
        <td class="text-center">${formatDate(item.scheduledDate)}</td>
        <td class="text-center">${formatTime(item.preferredTime)}</td>
        <td class="text-center">${item.paymentMethod ?? ""}</td>
        <td class="text-center">₱ ${formatMoney(item.totalAmount)}</td>
        <td class="text-center">${item.propertyType ?? ""}</td>
        <td class="text-center">${formatDateTime(item.placedAt)}</td>
        <td class="text-center">
            <span class="badge bg-warning">${item.status}</span>
        </td>
        <td class="text-center">
            <div class="dropdown">

                <button class="btn btn-sm btn-outline-secondary"
                        type="button"
                        data-bs-toggle="dropdown"
                        aria-expanded="false">
                    ⋮
                </button>

                <ul class="dropdown-menu dropdown-menu-end">
                <li>
                    <a class="dropdown-item d-flex align-items-center gap-2"
                       href="/Admin/Services/SBooking_Summary/${item.id}">
                        <i class="bi bi-eye text-primary"></i>
                        <span>View Summary</span>
                    </a>
                </li>

                <li>
                    <button class="dropdown-item d-flex align-items-center gap-2 text-success"
                        ${item.paymentMethod === "ONLINE_PAYMENT" && item.paymentStatus == "PAID" ? "enabled" : ""}
                        onclick="confirmBooking(${item.id})">
                        <i class="bi bi-check-circle"></i>
                        <span>Confirm</span>
                    </button>
                </li>

                <li><hr class="dropdown-divider"></li>

                <li>
                    <button class="dropdown-item d-flex align-items-center gap-2 text-danger"
                        ${item.paymentMethod === "ONLINE_PAYMENT" && item.paymentStatus === "PAID" ? "enabled" : ""}
                        title="Paid booking - notify customer first"
                        onclick="rejectBooking(${item.id})">
                        <i class="bi bi-x-circle"></i>
                        <span>Reject</span>
                    </button>
                </li>

                </ul>
            </div>
        </td>

        </td>
    </tr>
    `;
    });

    document.getElementById("serviceForConfirmationInfo").innerText =
        `Showing ${result.data.length} of ${result.totalCount}`;

    renderPagination(result.totalCount);
    updateSortUI();

    hideSpinner();
}

//// Child Row
async function toggleRow(bookingId, el) {
    const tr = el.closest("tr");

    // collapse if already open
    if (tr.nextElementSibling && tr.nextElementSibling.classList.contains("child-row")) {
        tr.nextElementSibling.remove();
        tr.classList.remove("selected-row"); // 👈 remove parent highlight
        el.classList.remove("open");
        return;
    }

    // OPTIONAL: remove highlight from other rows (accordion style)
    document.querySelectorAll(".selected-row").forEach(r => r.classList.remove("selected-row"));
    document.querySelectorAll(".child-row").forEach(r => r.remove());

    // fetch items
    const res = await fetch(`/api/service-transactions/${bookingId}/items`);
    const items = await res.json();

    let html = `
        <tr class="child-row selected-row"> 
            <td></td>
            <td></td>
            <td colspan="8">
                <div class="p-3 ms-2 border-start border-3 border-primary bg-light rounded">
                    <h6 class="mb-3"><strong>Service Request/s</strong></h6>

                    <table class="table table-sm table-bordered mb-0">
                        <thead class="table-light">
                            <tr>
                                <th>Service</th>
                                <th>Unit</th>
                                <th>Capacity</th>
                                <th>Brand</th>
                                <th>Request Count</th>
                                <th>Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
    `;

    items.forEach(i => {
        html += `
            <tr>
                <td>${i.serviceName}</td>
                <td>${i.unit ?? ""}</td>
                <td>${i.capacity ?? ""}</td>
                <td>${i.brand ?? ""}</td>
                <td>${i.unitCount}</td>
                <td>₱ ${formatMoney(i.price)}</td>
                <td>₱ ${formatMoney(i.total)}</td>
            </tr>
        `;
    });

    html += `
                        </tbody>
                    </table>
                </div>
            </td>
        </tr>
    `;

    tr.insertAdjacentHTML("afterend", html);

    // 🔥 highlight parent
    tr.classList.add("selected-row");

    // rotate arrow
    el.classList.add("open");
}
// ================= SEARCH =================
document.getElementById("forConfirmationSearchInput")
    .addEventListener("input", function () {
        clearTimeout(debounceTimer);

        debounceTimer = setTimeout(() => {
            search = this.value;
            currentPage = 1;
            loadData();
        }, 400);
    });

// ================= PAGINATION =================
function renderPagination(totalCount) {
    const totalPages = Math.ceil(totalCount / pageSize);
    const pagination = document.getElementById("pagination");

    pagination.innerHTML = "";

    for (let i = 1; i <= totalPages; i++) {
        pagination.innerHTML += `
            <li class="page-item ${i === currentPage ? "active" : ""}">
                <a class="page-link" href="#" onclick="goToPage(${i})">${i}</a>
            </li>
        `;
    }
}

function goToPage(page) {
    currentPage = page;
    loadData();
}

// ================= SORT =================
function sort(column) {
    if (sortBy === column) {
        sortDir = sortDir === "asc" ? "desc" : "asc";
    } else {
        sortBy = column;
        sortDir = "asc";
    }

    currentPage = 1;
    loadData();
}

// ================= SORT UI HIGHLIGHT =================
function updateSortUI() {
    document.querySelectorAll(".sortable").forEach(th => {
        th.classList.remove("active-sort");
        th.innerHTML = th.innerText; // reset arrows
    });

    const active = document.querySelector(`[data-column="${sortBy}"]`);
    if (active) {
        active.classList.add("active-sort");

        const arrow = sortDir === "asc" ? " ↑" : " ↓";
        active.innerHTML = active.innerText + arrow;
    }
}

// ================= FORMAT =================
function formatDate(date) {
    if (!date) return "";
    return new Date(date).toLocaleDateString();
}

function formatTime(time) {
    if (!time) return "";
    return time.substring(0, 5);
}

function formatDateTime(dt) {
    if (!dt) return "";
    return new Date(dt).toLocaleString();
}

function formatMoney(amount) {
    if (!amount) return "0.00";
    return Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 });
}

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
    loadData();

});



//////////////////////////////////////////////                              Confirmation with stages                                               ///
let selectedBookingId = null;
let countdownInterval;

// 🔥 STEP 1 TRIGGER
function confirmBooking(id) {
    selectedBookingId = id;

    const modal = new bootstrap.Modal(document.getElementById("confirmStep1Modal"));
    modal.show();
}

// 🔥 STEP 1 → STEP 2
document.getElementById("step1YesBtn").addEventListener("click", () => {
    bootstrap.Modal.getInstance(document.getElementById("confirmStep1Modal")).hide();

    const modal2 = new bootstrap.Modal(document.getElementById("confirmStep2Modal"));
    modal2.show();

    startCountdown();
});

// 🔥 COUNTDOWN LOGIC
function startCountdown() {
    let seconds = 5;
    const countdownEl = document.getElementById("countdown");
    const confirmBtn = document.getElementById("finalConfirmBtn");

    confirmBtn.disabled = true;
    countdownEl.innerText = seconds;

    clearInterval(countdownInterval);

    countdownInterval = setInterval(() => {
        seconds--;
        countdownEl.innerText = seconds;

        if (seconds <= 0) {
            clearInterval(countdownInterval);
            confirmBtn.disabled = false;
        }
    }, 1000);
}

// 🔥 FINAL CONFIRM ACTION
document.getElementById("finalConfirmBtn").addEventListener("click", async () => {
    try {
        const res = await fetch(`/api/service-transactions/confirm/${selectedBookingId}`, {
            method: "PUT"
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.message || "Failed to confirm booking");
            return;
        }

        alert("Booking confirmed!");

        bootstrap.Modal.getInstance(document.getElementById("confirmStep2Modal")).hide();

        loadData();

    } catch (err) {
        console.error(err);
        alert("Something went wrong");
    }
});


/////////////////////////////////////////////////////////////// Reject with stages /////////////////////////////////////////////////////////
// ================= REJECT FLOW =================
let rejectBookingId = null;
let rejectCountdownInterval;

// 🔥 STEP 1: OPEN MODAL
function rejectBooking(id) {
    rejectBookingId = id;

    const modal = bootstrap.Modal.getOrCreateInstance(
        document.getElementById("rejectStep1Modal")
    );
    modal.show();
}

// 🔥 STEP 1 → STEP 2 (FIXED)
function handleRejectStep1Yes() {
    const step1ModalEl = document.getElementById("rejectStep1Modal");
    const step2ModalEl = document.getElementById("rejectStep2Modal");

    const step1Modal = bootstrap.Modal.getOrCreateInstance(step1ModalEl);

    // hide step 1 first
    step1Modal.hide();

    // 🔥 IMPORTANT: wait before opening next modal
    setTimeout(() => {
        const step2Modal = bootstrap.Modal.getOrCreateInstance(step2ModalEl);
        step2Modal.show();

        startRejectCountdown();
    }, 300); // slight delay prevents Bootstrap conflict
}

// 🔥 COUNTDOWN LOGIC
function startRejectCountdown() {
    let seconds = 5;

    const countdownEl = document.getElementById("rejectCountdown");
    const finalBtn = document.getElementById("rejectFinalBtn");

    finalBtn.disabled = true;
    finalBtn.innerText = "Please wait...";

    countdownEl.innerText = seconds;

    clearInterval(rejectCountdownInterval);

    rejectCountdownInterval = setInterval(() => {
        seconds--;
        countdownEl.innerText = seconds;

        if (seconds <= 0) {
            clearInterval(rejectCountdownInterval);
            finalBtn.disabled = false;
            finalBtn.innerText = "Yes, Reject Booking";
        }
    }, 1000);
}

// 🔥 FINAL REJECT ACTION
async function executeReject() {
    const finalBtn = document.getElementById("rejectFinalBtn");

    try {
        finalBtn.disabled = true;
        finalBtn.innerText = "Processing...";

        const res = await fetch(`/api/service-transactions/reject/${rejectBookingId}`, {
            method: "PUT"
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.message || "Failed to reject booking");
            finalBtn.disabled = false;
            finalBtn.innerText = "Yes, Reject Booking";
            return;
        }

        bootstrap.Modal.getInstance(
            document.getElementById("rejectStep2Modal")
        ).hide();

        alert("Booking rejected!");
        loadData();

    } catch (err) {
        console.error(err);
        alert("Something went wrong");
    }
}

document.getElementById("rejectStep2Modal")
    .addEventListener("hidden.bs.modal", () => {
        clearInterval(rejectCountdownInterval);

        document.getElementById("rejectCountdown").innerText = 5;

        const btn = document.getElementById("rejectFinalBtn");
        btn.disabled = true;
        btn.innerText = "Yes, Reject this Service Booking";
    });