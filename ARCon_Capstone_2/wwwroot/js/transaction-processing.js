let currentPage = 1;
let pageSize = 24;
let currentSortBy = "createdAt";
let currentSortDir = "desc";
let currentSearch = "";

// ===============================
// LOAD DATA
// ===============================
async function loadProcessingTransactions() {
    try {
        const response = await fetch(
            `/api/transaction/processing-transactions?page=${currentPage}&pageSize=${pageSize}&sortBy=${currentSortBy}&sortDir=${currentSortDir}&search=${encodeURIComponent(currentSearch)}`,
            { method: "GET" }
        );

        if (!response.ok) {
            console.error("Failed to load processing transactions");
            return;
        }

        const result = await response.json();

        renderTable(result.data);
        renderPagination(result.totalCount);
        renderInfo(result.totalCount);

    } catch (error) {
        console.error("Error loading processing transactions:", error);
    }
}

// ===============================
// RENDER TABLE
// ===============================
function renderTable(data) {

    const tbody = document.getElementById("processingTransactionTableBody");
    tbody.innerHTML = "";

    if (!data || data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-muted">
                    No processing transactions found.
                </td>
            </tr>
        `;
        return;
    }

    let rows = "";

    data.forEach(item => {

        const grandTotal = item.grandTotal
            ? `₱${Number(item.grandTotal).toFixed(2)}`
            : "₱0.00";

        const statusBadge = getStatusBadge(item.status);

        rows += `
            <tr>
                <td class="text-center fw-semibold">
                    ${item.transactionCode ?? ""}
                </td>
                <td class="text-center">
                    ${item.customerName ?? ""}
                </td>
                <td>
                    ${item.paymentMethod ?? "N/A"}
                </td>
                <td class="text-center">
                    ${grandTotal}
                </td>
                <td class="text-center">
                    ${formatDate(item.createdAt)}
                </td>
                <td class="text-center">
                    ${formatDate(item.dateConfirmed)}
                </td>
                <td class="text-center">
                    ${statusBadge}
                </td>
                <td class="text-center">
                    <a href="/Admin/Transactions/Details/${item.id}"
                       class="btn btn-sm btn-primary">
                        View Summary
                    </a>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = rows;
}

// ===============================
// STATUS BADGE
// ===============================
function getStatusBadge(status) {

    switch (status) {
        case "CONFIRMED":
            return `<span class="badge bg-success">${status}</span>`;

        case "READY_FOR_SHIPPING":
            return `<span class="badge bg-info">${status}</span>`;

        case "REJECTED":
            return `<span class="badge bg-danger">${status}</span>`;

        default:
            return `<span class="badge bg-secondary">${status ?? "UNKNOWN"}</span>`;
    }
}

// ===============================
// INFO
// ===============================
function renderInfo(totalCount) {
    const info = document.getElementById("processingTransactiontInfo");
    info.innerText = `Total Processing Transactions: ${totalCount}`;
}

// ===============================
// PAGINATION
// ===============================
function renderPagination(totalCount) {
    const pagination = document.getElementById("pagination");
    pagination.innerHTML = "";

    const totalPages = Math.ceil(totalCount / pageSize);
    if (totalPages <= 1) return;

    for (let i = 1; i <= totalPages; i++) {
        pagination.innerHTML += `
            <li class="page-item ${i === currentPage ? "active" : ""}">
                <button class="page-link" onclick="goToPage(${i})">
                    ${i}
                </button>
            </li>
        `;
    }
}

function goToPage(page) {
    currentPage = page;
    loadProcessingTransactions();
}

// ===============================
// SORT
// ===============================
function sort(column) {
    if (currentSortBy === column) {
        currentSortDir = currentSortDir === "asc" ? "desc" : "asc";
    } else {
        currentSortBy = column;
        currentSortDir = "asc";
    }

    currentPage = 1;
    loadProcessingTransactions();
}

// ===============================
// DATE FORMAT
// ===============================
function formatDate(dateString) {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString();
}

// ===============================
// SEARCH (Debounced)
// ===============================
function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

document.addEventListener("DOMContentLoaded", () => {

    loadProcessingTransactions();

    const searchInput = document.getElementById("paymentProcessingTransactionSearchInput");

    if (searchInput) {
        searchInput.addEventListener("input",
            debounce(function () {
                currentSearch = this.value;
                currentPage = 1;
                loadProcessingTransactions();
            }, 400)
        );
    }
});

// ===============================
// REFRESH ON BACK
// ===============================
window.addEventListener("pageshow", function (event) {
    if (event.persisted ||
        performance.getEntriesByType("navigation")[0]?.type === "back_forward") {
        location.reload();
    }
});