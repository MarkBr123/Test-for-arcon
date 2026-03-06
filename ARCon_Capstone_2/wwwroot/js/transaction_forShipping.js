let currentPage = 1;
let pageSize = 10;
let currentSearch = "";
let currentSortBy = "createdAt";
let currentSortDir = "desc";

let debounceTimer;

// 🔎 SEARCH WITH DEBOUNCE
document.getElementById("forShippinhSearchInput")
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
        `/api/delivery/booked?page=${currentPage}&pageSize=${pageSize}&search=${currentSearch}&sortBy=${currentSortBy}&sortDir=${currentSortDir}`
    );

    const data = await response.json();

    renderTable(data.deliveries);
    renderPagination(data.totalCount);
    renderInfo(data.totalCount);
}


// 🧾 RENDER TABLE
function renderTable(deliveries) {

    const tbody = document.getElementById("forShippingTableBody");
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
                    <div class="btn-group btn-group-sm">

                        <button class="btn btn-outline-primary"
                                onclick="viewDetails(${d.deliveryId})">
                            <i class="bi bi-eye"></i> Details
                        </button>

                        <button class="btn btn-outline-success"
                                onclick="shipOutDelivery(${d.deliveryId})">
                            <i class="bi bi-truck"></i> Ship Out
                        </button>

                        <button class="btn btn-outline-danger"
                                onclick="openCancelModal(${d.deliveryId})">
                            <i class="bi bi-x-circle"></i> Cancel
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

    const info = document.getElementById("processingTransactiontInfo");

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

    if (!dateString) return "-";

    const date = new Date(dateString);

    return date.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "2-digit"
    });
}


// 🚀 INITIAL LOAD
document.addEventListener("DOMContentLoaded", function () {
    loadDeliveries();
});


////// View Details of for Shipping

async function viewDetails(deliveryId) {

    const response = await fetch(`/api/delivery/${deliveryId}`);

    if (!response.ok) {
        alert("Failed to load delivery details.");
        return;
    }

    const data = await response.json();

    // Populate delivery info
    document.getElementById("detailDeliveryCode").innerText = data.deliveryCode;
    document.getElementById("detailDeliveryStatus").innerText = data.status;
    document.getElementById("detailCourier").innerText = data.courier;

    // Populate transaction info
    document.getElementById("detailTransactionCode").innerText =
        data.transaction.transactionCode;

    document.getElementById("detailCustomerName").innerText =
        data.customer.name;

    document.getElementById("detailCustomerContact").innerText =
        data.customer.contactNo;


    // Populate items
    const tbody = document.getElementById("detailItemsBody");
    tbody.innerHTML = "";

    data.items.forEach(item => {

        const row = `
            <tr>
                <td>${item.productName}</td>
                <td class="text-center">${item.quantity}</td>
                <td>${item.serialNumbers.join(", ")}</td>
                <td class="text-end">${item.totalWeight.toFixed(2)}</td>
            </tr>
        `;

        tbody.insertAdjacentHTML("beforeend", row);
    });

    document.getElementById("detailTotalWeight").innerText =
        data.totalWeight?.toFixed(2) ?? "0.00";

    // Show modal
    const modal = new bootstrap.Modal(
        document.getElementById("deliveryDetailsModal")
    );

    modal.show();
}


/// CANCELATION

let activeCancelDeliveryId = null;
let countdownInterval = null;

function openCancelModal(deliveryId) {

    activeCancelDeliveryId = deliveryId;

    document.getElementById("cancelReasonInput").value = "";
    document.getElementById("cancelWarningMessage").classList.add("d-none");

    const modal = new bootstrap.Modal(
        document.getElementById("cancelDeliveryModal")
    );

    modal.show();
}

document.addEventListener("DOMContentLoaded", function () {

    const confirmBtn = document.getElementById("confirmCancelBtn");

    if (!confirmBtn) return;

    confirmBtn.addEventListener("click", function () {

        const reason = document.getElementById("cancelReasonInput").value.trim();

        if (!reason) {
            alert("Cancellation reason is required.");
            return;
        }

        const warningBox = document.getElementById("cancelWarningMessage");
        const countdownEl = document.getElementById("countdown");

        warningBox.classList.remove("d-none");

        let seconds = 5;
        countdownEl.innerText = seconds;

        confirmBtn.disabled = true;

        countdownInterval = setInterval(() => {

            seconds--;
            countdownEl.innerText = seconds;

            if (seconds <= 0) {

                clearInterval(countdownInterval);
                finalizeCancel(reason);
            }

        }, 1000);
    });

});

async function finalizeCancel(reason) {

    const response = await fetch(
        `/api/delivery/${activeCancelDeliveryId}/cancel`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ reason })
        }
    );

    const modalEl = document.getElementById("cancelDeliveryModal");
    const modal = bootstrap.Modal.getInstance(modalEl);

    modal.hide();

    if (!response.ok) {
        alert("Failed to cancel delivery.");
        return;
    }

    alert("Delivery cancelled successfully.");

    loadDeliveries();
}


/////// ADD NOTIFICATION ///////

//End Cancellation


///Shipped Out
async function shipOutDelivery(deliveryId) {

    if (!confirm("Mark this delivery as IN TRANSIT?")) return;

    const response = await fetch(
        `/api/delivery/${deliveryId}/ship-out`,
        {
            method: "PUT"
        }
    );

    if (!response.ok) {
        alert("Failed to update delivery.");
        return;
    }

    alert("Delivery marked as IN TRANSIT.");

    loadDeliveries();
}