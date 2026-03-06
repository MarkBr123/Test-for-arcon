let currentPage = 1;
let pageSize = 10;
let currentSearch = "";

// Load on page start
document.addEventListener("DOMContentLoaded", () => {
    loadCancelledFailedDeliveries();
    attachSearch();
});

async function loadCancelledFailedDeliveries() {

    try {

        const response = await fetch(
            `/api/delivery/cancelled-failed?page=${currentPage}&pageSize=${pageSize}&search=${encodeURIComponent(currentSearch)}`
        );

        if (!response.ok) {
            throw new Error("Failed to load deliveries.");
        }

        const result = await response.json();

        renderTable(result.data);
        renderPagination(result.totalCount);
        renderInfo(result.totalCount);

    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}

function renderTable(data) {

    const tbody = document.getElementById("processingTransactionTableBody");
    tbody.innerHTML = "";

    if (!data || data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted">
                    No cancelled or failed deliveries found.
                </td>
            </tr>
        `;
        return;
    }

    data.forEach(d => {

        const cancellationReason = d.cancellation_reason ?? "-";
        const failReasonCode = d.fail_reason_code ?? "-";

        const dateCancelled = d.date_cancelled
            ? formatDate(d.date_cancelled)
            : "-";

        const failedAt = d.failed_at
            ? formatDate(d.failed_at)
            : "-";

        const row = `
    <tr>
        <td class="text-center fw-semibold">${d.delivery_ref_code}</td>
        <td class="text-center">${d.transactionCode}</td>
        <td class="text-center text-danger">${cancellationReason}</td>
        <td class="text-center text-warning">${failReasonCode}</td>
        <td class="text-center">${dateCancelled}</td>
        <td class="text-center">${failedAt}</td>
        <td class="text-center fw-bold">${d.delivery_tries}</td>
    </tr>
`;

        tbody.insertAdjacentHTML("beforeend", row);
    });
}

function renderInfo(totalCount) {

    const info = document.getElementById("cancelledOrFailedDeliveryInfo");

    info.innerText = `Showing ${totalCount} cancelled / failed deliveries`;
}

function renderPagination(totalCount) {

    const pagination = document.getElementById("pagination");
    pagination.innerHTML = "";

    const totalPages = Math.ceil(totalCount / pageSize);

    for (let i = 1; i <= totalPages; i++) {

        const li = document.createElement("li");
        li.className = `page-item ${i === currentPage ? "active" : ""}`;

        li.innerHTML = `
            <button class="page-link">${i}</button>
        `;

        li.addEventListener("click", () => {
            currentPage = i;
            loadCancelledFailedDeliveries();
        });

        pagination.appendChild(li);
    }
}

function attachSearch() {

    const input = document.getElementById("cancelledOrFailedSearchInput");

    let timeout = null;

    input.addEventListener("input", function () {

        clearTimeout(timeout);

        timeout = setTimeout(() => {

            currentSearch = this.value;
            currentPage = 1;
            loadCancelledFailedDeliveries();

        }, 400);
    });
}
function formatDate(dateString) {

    const date = new Date(dateString);

    return date.toLocaleString("en-PH", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    });
}
