// ================= GLOBAL STATE =================
let currentPage = 1;
let pageSize = 24;
let sortBy = "createdAt";
let sortDir = "desc";
let search = "";
let debounceTimer;
let selectedStatuses = [];

// ================= LOADING =================
function showSpinner() {
    document.getElementById("loadingSpinner").style.display = "block";
}

function hideSpinner() {
    document.getElementById("loadingSpinner").style.display = "none";
}

// ================= LOAD DATA =================
async function loadData() {
    showSpinner();

    const statusQuery = selectedStatuses.join(",");

    const res = await fetch(`/api/service-transactions/all-bookings?page=${currentPage}&pageSize=${pageSize}&sortBy=${sortBy}&sortDir=${sortDir}&search=${search}&statuses=${statusQuery}`);
    const result = await res.json();

    renderTable(result.data);

    // ✅ INFO TEXT
    const start = (currentPage - 1) * pageSize + 1;
    const end = start + result.data.length - 1;

    document.getElementById("allBookingsInfo").innerText =
        result.totalCount === 0
            ? "No records found"
            : `Showing ${start} to ${end} of ${result.totalCount}`;

    renderPagination(result.totalCount);
    updateSortUI();

    hideSpinner();
}

// ================= TABLE =================
function renderTable(data) {
    const tbody = document.getElementById("allBookingsTableBody");
    tbody.innerHTML = "";

    if (!data.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="11" class="text-center text-muted">No data found</td>
            </tr>
        `;
        return;
    }

    data.forEach(item => {
        tbody.innerHTML += `
        <tr>
            <td></td>
            <td class="text-center">${item.referenceCode ?? ""}</td>
            <td class="text-center">${item.customerName ?? ""}</td>
            <td class="text-center">${item.businessName ?? ""}</td>
            <td class="text-center">${formatDate(item.scheduledDate)}</td>
            <td class="text-center">${formatTime(item.preferredTime)}</td>
            <td class="text-center">${item.paymentMethod ?? ""}</td>
            <td class="text-center">₱ ${formatMoney(item.totalAmount)}</td>
            <td class="text-center">${item.propertyType ?? ""}</td>
            <td class="text-center">${formatDateTime(item.createdAt)}</td>
            <td class="text-center">${formatStatus(item.status)}</td>

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
                </ul>
            </div>
        </td>
        </tr>
        `;
    });
}

// ================= SEARCH (DEBOUNCE) =================
document.getElementById("allBookingsSearchInput")
    .addEventListener("input", function () {
        clearTimeout(debounceTimer);

        debounceTimer = setTimeout(() => {
            search = this.value;
            currentPage = 1;
            loadData();
        }, 400);
    });

// ================= STATUS FILTER =================
document.querySelectorAll(".status-filter").forEach(cb => {
    cb.addEventListener("change", () => {
        selectedStatuses = Array.from(
            document.querySelectorAll(".status-filter:checked")
        ).map(x => x.value);

        currentPage = 1;
        loadData();
    });
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

// ================= SORT UI =================
function updateSortUI() {
    document.querySelectorAll(".sortable").forEach(th => {
        th.classList.remove("active-sort");
        th.innerHTML = th.innerText;
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

// ================= STATUS BADGE =================
function formatStatus(status) {
    switch (status) {
        case "COMPLETED":
            return `<span class="badge bg-success">Completed</span>`;
        case "FAILED":
            return `<span class="badge bg-danger">Failed</span>`;
        case "FAILED_FOR_REFUND":
            return `<span class="badge bg-warning text-dark">FAILED, FOR REFUND</span>`;
        case "PARTIALLY_COMPLETED":
            return `<span class="badge bg-secondary">Partial Complete</span>`;
        case "CANCELLED":
            return `<span class="badge bg-dark">Cancelled</span>`;
        default:
            return `<span class="badge bg-light text-dark">${status}</span>`;
    }
}

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
    loadData();
});