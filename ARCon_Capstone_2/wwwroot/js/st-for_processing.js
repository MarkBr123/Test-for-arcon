let currentPage = 1;
let pageSize = 24;
let sortBy = "createdAt";
let sortDir = "desc";
let search = "";
let debounceTimer;
let processBookingId = null;


let currentItems = []; // This is the array of service_booking_items

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

    const res = await fetch(`/api/service-transactions/processing-services?page=${currentPage}&pageSize=${pageSize}&sortBy=${sortBy}&sortDir=${sortDir}&search=${search}`);
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
                <td class="text-center">${formatDateTime(item.confirmedAt)}</td>
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
                        <button class="dropdown-item d-flex align-items-center gap-2"
                                onclick="processBooking(${item.id})">
                            <i class="bi bi-gear text-success"></i>
                            <span>Process</span>
                        </button>
                    </li>

                    <li>
                        <button class="dropdown-item d-flex align-items-center gap-2 text-danger"
                                title="Cancel booking"
                                onclick="cancelBooking(${item.id})">
                            <i class="bi bi-x-circle"></i>
                            <span>Cancel</span>
                        </button>
                    </li>

                </ul>
            </div>
        </td>

        </td>
    </tr>
    `;
    });

    document.getElementById("serviceProcessingInfo").innerText =
        `Showing ${result.data.length} of ${result.totalCount}`;

    renderPagination(result.totalCount);
    updateSortUI();

    hideSpinner();
}

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
        <tr class="child-row selected-row"> <!-- 👈 add same class -->
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
document.getElementById("processingSearchInput")
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


/////////////////////////////////////////////////                START This is the Processing of service_transaction                   //////////////////////////////////////


async function processBooking(id) {
    processBookingId = id;
    console.log("PROCESS BOOKING ID:", id);
    const modal = new bootstrap.Modal(document.getElementById("processBookingModal"));
    modal.show();

    const res = await fetch(`/api/service-transactions/pending-summary/${id}`);
    const data = await res.json();

    // 🔹 STORE ITEMS (SAFE)
    currentItems = data.items || [];
    console.log("PROCESS ITEMS:", currentItems);

    // 🔹 FILL SUMMARY
    document.getElementById("procRefCode").innerText = data.referenceCode;
    document.getElementById("procFailCount").innerText = data.failure_count ?? " - ";
    document.getElementById("procCustomer").innerText = data.customer.name;

    document.getElementById("procBusinessName").innerText =
        data.businessName ?? "N/A";

    document.getElementById("procContactNo").innerText = data.customer.contact;

    document.getElementById("procSchedule").innerText =
        `${formatDate(data.scheduledDate)} ${formatTime(data.preferredTime)}`;

    document.getElementById("procPropType").innerText = data.propertyType;
    document.getElementById("procAddress").innerText = data.deliveryAddress;
    document.getElementById("procPaymentMethod").innerText = data.payment.method;
    document.getElementById("procPaymentStatus").innerText = data.payment.status;
    document.getElementById("procCustomerNote").innerText = data.customerNote;

    // 🔹 SERVICES TABLE
    let html = '';

    currentItems.forEach(i => {
        html += `
        <tr>
            <td>
                <div class="fw-bold text-uppercase">${i.serviceName}</div>
                <span class="badge bg-secondary mt-1">x${i.unitCount}</span>
            </td>

            <td class="small">
                ${i.airconType ? `
                    <div class="row">
                        <div class="col-5 text-muted">AC Type</div>
                        <div class="col-7">${i.airconType}</div>
                    </div>` : ''}

                ${i.unit ? `
                    <div class="row">
                        <div class="col-5 text-muted">Unit</div>
                        <div class="col-7">${i.unit}</div>
                    </div>` : ''}

                ${i.capacity ? `
                    <div class="row">
                        <div class="col-5 text-muted">Capacity</div>
                        <div class="col-7">${i.capacity}</div>
                    </div>` : ''}

                ${i.brand ? `
                    <div class="row">
                        <div class="col-5 text-muted">Brand</div>
                        <div class="col-7">${i.brand}</div>
                    </div>` : ''}
            </td>

            <td class="text-end">
                <div class="text-muted small">
                    ₱ ${i.price?.toFixed(2) ?? '0.00'} each
                </div>
                <div class="fw-bold text-success">
                    ₱ ${i.total?.toFixed(2) ?? '0.00'} Total
                </div>
            </td>
        </tr>
        `;
    });

    document.getElementById("procServices").innerHTML = html;
}

//// Validation with UI feedback /////
function validateServiceTransaction() {

    // 🔹 RESET ALL ERRORS
    document.querySelectorAll('.form-control').forEach(el => {
        el.classList.remove('is-invalid');
    });

    let isValid = true;

    // GET ELEMENTS
    const technicians = document.getElementById('procTechnicians');
    const difficulty = document.getElementById('procDifficulty');
    const date = document.getElementById('procDate');
    const time = document.getElementById('procTime');
    const estDate = document.getElementById('procEstDate');
    const estTime = document.getElementById('procEstTime');
    const fee = document.getElementById('procFee');


    //1. TECHNICIANS (INTEGER ≥ 1)

    const techValue = Number(technicians.value);

    if (!Number.isInteger(techValue) || techValue < 1) {
        technicians.classList.add('is-invalid');
        isValid = false;
    }


    //2. DIFFICULTY (1.0 – 5.0)

    if (difficulty.value !== '') {
        const diffValue = Number(difficulty.value);

        if (isNaN(diffValue) || diffValue < 1 || diffValue > 5) {
            difficulty.classList.add('is-invalid');
            isValid = false;
        }
    }


    //3. REQUIRED SCHEDULE

    if (!date.value) {
        date.classList.add('is-invalid');
        isValid = false;
    }

    if (!time.value) {
        time.classList.add('is-invalid');
        isValid = false;
    }


    //4. SCHEDULE NOT IN PAST

    if (date.value && time.value) {

        const scheduled = new Date(`${date.value}T${time.value}`);
        const now = new Date();

        if (isNaN(scheduled) || scheduled < now) {
            date.classList.add('is-invalid');
            time.classList.add('is-invalid');
            isValid = false;
        }

  
        //5. ESTIMATED > SCHEDULED

        if (estDate.value && estTime.value) {

            const estimated = new Date(`${estDate.value}T${estTime.value}`);

            if (isNaN(estimated) || estimated <= scheduled) {
                estDate.classList.add('is-invalid');
                estTime.classList.add('is-invalid');
                isValid = false;
            }
        }
    }
    //6. FEE (REQUIRED ≥ 0)

    const feeValue = Number(fee.value);

    if (fee.value === '' || isNaN(feeValue) || feeValue < 0) {
        fee.classList.add('is-invalid');
        isValid = false;
    }

    return isValid;
}

//// POST ////
async function submitServiceTransaction() {

    // 🔹 Use your existing validator ONLY
    if (!validateServiceTransaction()) return;

    const dto = {
        ServiceBookingId: processBookingId,

        NumTechniciansReq: Number(document.getElementById('procTechnicians').value),

        DifficultyRate: document.getElementById('procDifficulty').value
            ? Number(document.getElementById('procDifficulty').value)
            : null,

        ActualSchedDate: document.getElementById('procDate').value,
        ActualSchedTime: document.getElementById('procTime').value + ":00",

        EstimatedCompletionDate: document.getElementById('procEstDate').value || null,
        EstimatedCompletionTime: document.getElementById('procEstTime').value
            ? document.getElementById('procEstTime').value + ":00"
            : null,

        ReserviceFee: Number(document.getElementById('procFee').value),

        PartsNeeded: document.getElementById('procParts').value || null,
        ToolsNeeded: document.getElementById('procTools').value || null,
        NoteToTechnicians: document.getElementById('procNotes').value || null,

        Items: currentItems.map(i => ({
            ServiceBookingItemsId: i.id
        }))
    };

    console.log("FINAL DTO:", dto); // 🔥 IMPORTANT DEBUG

    try {
        const response = await fetch('/api/service-transactions/create-service-transaction', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dto)
        });

        if (!response.ok) {
            const error = await response.text();
            alert(error);
            return;
        }

        const result = await response.json();

        alert(`✅ Transaction Created!\nRef: ${result.referenceCode}`);

        bootstrap.Modal.getInstance(document.getElementById("processBookingModal")).hide();
        loadData();

    } catch (err) {
        console.error(err);
        alert('Something went wrong.');
    }
    console.log("PROCESS BOOKING ID:", id);
    console.log("Submitting Booking ID:", processBookingId);
}

// JS LOGIC (COUNTDOWN)
let confirmInterval;

function openConfirmModal() {

    const modal = new bootstrap.Modal(document.getElementById("confirmModal"));
    modal.show();

    const btn = document.getElementById("confirmSubmitBtn");
    const text = document.getElementById("countdownText");
    const bar = document.getElementById("countdownBar");

    let countdown = 5;

    btn.disabled = true;
    text.innerText = countdown;
    bar.style.width = "0%";

    confirmInterval = setInterval(() => {

        countdown--;

        text.innerText = countdown;

        const progress = ((5 - countdown) / 5) * 100;
        bar.style.width = progress + "%";

        if (countdown <= 0) {
            clearInterval(confirmInterval);

            btn.disabled = false;
            text.innerText = "Ready";
        }

    }, 1000);
}
//FINAL SUBMIT
document.getElementById("confirmSubmitBtn")
    .addEventListener("click", () => {

        submitServiceTransaction();

        bootstrap.Modal.getInstance(
            document.getElementById("confirmModal")
        ).hide();
    });

//(RESET WHEN CLOSED)
document.getElementById("confirmModal")
    .addEventListener("hidden.bs.modal", () => {

        clearInterval(confirmInterval);

        document.getElementById("confirmSubmitBtn").disabled = true;
        document.getElementById("countdownText").innerText = "5";
        document.getElementById("countdownBar").style.width = "0%";
    });



///////////////////////////////// CANCELLATION (2-STAGES) ////////////////////////////////////////////////
let cancelBookingId = null;
let cancelCountdownInterval;

function cancelBooking(id) {
    cancelBookingId = id;

    const modal = bootstrap.Modal.getOrCreateInstance(
        document.getElementById("cancelStep1Modal")
    );
    modal.show();
}

function handleCancelStep1Yes() {
    const step1ModalEl = document.getElementById("cancelStep1Modal");
    const step2ModalEl = document.getElementById("cancelStep2Modal");

    const step1Modal = bootstrap.Modal.getOrCreateInstance(step1ModalEl);

    // hide step 1 first
    step1Modal.hide();

    // prevent bootstrap modal conflict
    setTimeout(() => {
        const step2Modal = bootstrap.Modal.getOrCreateInstance(step2ModalEl);
        step2Modal.show();

        startCancelCountdown();
    }, 300);
}

function startCancelCountdown() {
    let seconds = 5;

    const countdownEl = document.getElementById("cancelCountdown");
    const finalBtn = document.getElementById("cancelFinalBtn");

    finalBtn.disabled = true;
    finalBtn.innerText = "Please wait...";

    countdownEl.innerText = seconds;

    clearInterval(cancelCountdownInterval);

    cancelCountdownInterval = setInterval(() => {
        seconds--;
        countdownEl.innerText = seconds;

        if (seconds <= 0) {
            clearInterval(cancelCountdownInterval);
            finalBtn.disabled = false;
            finalBtn.innerText = "Yes, Cancel this Service Booking";
        }
    }, 1000);
}

async function executeCancel() {
    const finalBtn = document.getElementById("cancelFinalBtn");

    try {
        finalBtn.disabled = true;
        finalBtn.innerText = "Processing...";

        const res = await fetch(`/api/service-transactions/cancel/${cancelBookingId}`, {
            method: "PUT"
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.message || "Failed to cancel booking");
            finalBtn.disabled = false;
            finalBtn.innerText = "Yes, Cancel this Service Booking";
            return;
        }

        bootstrap.Modal.getInstance(
            document.getElementById("cancelStep2Modal")
        ).hide();

        alert("Booking cancelled!");
        loadData();

    } catch (err) {
        console.error(err);
        alert("Something went wrong");
    }
}

document.getElementById("cancelStep2Modal")
    .addEventListener("hidden.bs.modal", () => {
        clearInterval(cancelCountdownInterval);

        document.getElementById("cancelCountdown").innerText = 5;

        const btn = document.getElementById("cancelFinalBtn");
        btn.disabled = true;
        btn.innerText = "Yes, Cancel this Service Booking";
    });