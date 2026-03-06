let currentPage = 1;
let pageSize = 10;
let currentSearch = "";
let currentSortBy = "createdAt";
let currentSortDir = "desc";

let debounceTimer;

// 🔎 SEARCH WITH DEBOUNCE
document.getElementById("inTransitSearchInput")
    .addEventListener("input", function () {

        clearTimeout(debounceTimer);

        debounceTimer = setTimeout(() => {
            currentSearch = this.value.trim();
            currentPage = 1;
            loadDeliveries();
        }, 400);
    });


// 🔀 SORT
function sort(field) {

    if (currentSortBy === field) {
        currentSortDir = currentSortDir === "asc" ? "desc" : "asc";
    } else {
        currentSortBy = field;
        currentSortDir = "asc";
    }

    loadDeliveries();
}


// 📦 LOAD DELIVERIES
async function loadDeliveries() {

    const response = await fetch(
        `/api/delivery/shipped-out?page=${currentPage}&pageSize=${pageSize}&search=${currentSearch}&sortBy=${currentSortBy}&sortDir=${currentSortDir}`
    );

    const data = await response.json();

    renderTable(data.deliveries);
    renderPagination(data.totalCount);
    renderInfo(data.totalCount);
}


// 🧾 RENDER TABLE
function renderTable(deliveries) {

    const tbody = document.getElementById("inTransitTableBody");
    tbody.innerHTML = "";

    if (!deliveries || deliveries.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted">
                    No deliveries found.
                </td>
            </tr>
        `;
        return;
    }

    deliveries.forEach(d => {

        const row = `
            <tr>
                <td class="text-center fw-semibold">${d.deliveryCode}</td>
                <td class="text-center">${d.transactionCode}</td>
                <td class="text-center">${d.customerName}</td>
                <td class="text-center">${d.courier}</td>
                <td class="text-center">
                    ${formatDate(d.scheduledDate)}
                </td>
                <td class="text-center">
                    <span class="badge ${getStatusBadge(d.scheduleStatus)}">
                        ${d.scheduleStatus}
                    </span>
                </td>
                <td class="text-center">
                    ${formatDate(d.createdAt)}
                </td>
                 <td class="text-center">
                    ${formatDate(d.inTransit)}
                </td>
                </td>
                 <td class="text-center">
                    P ${d.grandTotal}
                </td>
                <td class="text-center">
                    <div class="btn-group btn-group-sm">

                        <button class="btn btn-outline-primary"
                                onclick="viewDetails(${d.deliveryId})">
                            <i class="bi bi-eye"></i> Details
                        </button>
                        <button class="btn btn-outline-danger"
                                onclick="openFailDeliveryModal(${d.deliveryId})">
                            <i class="bi bi-x-circle"></i> Mark As Failed
                        </button>

                        <button class="btn btn-outline-success"
                                onclick="successfulDelivery(${d.deliveryId})">
                            <i class="bi bi-ok"></i> Mark As Delivered
                        </button>

                    </div>
                </td>
            </tr>
        `;

        tbody.insertAdjacentHTML("beforeend", row);
    });
}


// 📄 PAGINATION
function renderPagination(totalCount) {

    const totalPages = Math.ceil(totalCount / pageSize);
    const pagination = document.getElementById("pagination");
    pagination.innerHTML = "";

    if (totalPages <= 1) return;

    for (let i = 1; i <= totalPages; i++) {

        const li = document.createElement("li");
        li.className = `page-item ${i === currentPage ? "active" : ""}`;

        li.innerHTML = `
            <a class="page-link" href="#">${i}</a>
        `;

        li.addEventListener("click", function (e) {
            e.preventDefault();
            currentPage = i;
            loadDeliveries();
        });

        pagination.appendChild(li);
    }
}


// 📊 INFO TEXT
function renderInfo(totalCount) {

    const info = document.getElementById("inTransitTransactiontInfo");

    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalCount);

    info.innerText = `Showing ${start} - ${end} of ${totalCount} deliveries`;
}


// 🎨 BADGE COLOR
function getStatusBadge(status) {

    switch (status) {
        case "SCHEDULED":
            return "bg-primary";
        case "READY_FOR_DELIVERY":
            return "bg-warning text-dark";
        case "PAST_SCHEDULE_DATE":
            return "bg-danger";
        case "COMPLETED":
            return "bg-success";
        default:
            return "bg-secondary";
    }
}


// 📅 FORMAT DATE
function formatDate(dateString) {
    return new Date(dateString).toLocaleString();
}


// 🚀 INITIAL LOAD
document.addEventListener("DOMContentLoaded", function () {
    loadDeliveries();
});


//////// DELIVERED

async function successfulDelivery(deliveryId) {

    if (!confirm("Confirm delivery and collect payment (if Cash On Delivery)?")) {
        return;
    }

    try {

        const response = await fetch(`/api/delivery/${deliveryId}/delivered`, {
            method: "PUT"
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText);
        }

        const result = await response.json();

        // Update status in table
        const row = document.querySelector(
            `tr[data-delivery-id='${deliveryId}']`
        );

        if (row) {

            const statusCell = row.querySelector(".delivery-status");

            if (statusCell) {
                statusCell.innerHTML =
                    `<span class="badge bg-success">DELIVERED</span>`;
            }

            // Disable button
            const btn = row.querySelector("button");
            if (btn) {
                btn.disabled = true;
            }
        }

        alert(result.message || "Delivery completed successfully.");
        location.reload();

    } catch (error) {
        alert("Error: " + error.message);
        location.reload();
    }
}


// failed delivery
function openFailDeliveryModal(deliveryId) {

    document.getElementById("failDeliveryId").value = deliveryId;
    document.getElementById("failReason").value = "";
    document.getElementById("failReasonCode").value = "";

    const modal = new bootstrap.Modal(
        document.getElementById("failDeliveryModal")
    );

    modal.show();
}

async function confirmFailDelivery() {

    const deliveryId = document.getElementById("failDeliveryId").value;
    const reason = document.getElementById("failReason").value;
    const code = document.getElementById("failReasonCode").value;

    if (!reason) {
        alert("Please select a failure reason.");
        return;
    }

    try {

        const response = await fetch(`/api/delivery/${deliveryId}/fail`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                failReason: reason,
                failReasonCode: code
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText);
        }

        alert("Delivery marked as FAILED.");

        const modalElement = document.getElementById("failDeliveryModal");
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        modalInstance.hide();

        location.reload();

    } catch (error) {
        alert("Error: " + error.message);
    }
}

