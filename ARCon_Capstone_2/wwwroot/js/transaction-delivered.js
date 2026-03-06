let currentPage = 1;
let pageSize = 10;
let currentSearch = "";
let currentSortBy = "deliveredAt";
let currentSortDir = "desc";

document.addEventListener("DOMContentLoaded", () => {
    attachSearch();
    attachSorting();
    loadDelivered();
});

async function loadDelivered() {

    try {

        const response = await fetch(
            `/api/delivery/delivered?page=${currentPage}` +
            `&pageSize=${pageSize}` +
            `&search=${encodeURIComponent(currentSearch)}` +
            `&sortBy=${currentSortBy}` +
            `&sortDir=${currentSortDir}`
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText);
        }

        const result = await response.json();

        renderTable(result.data);
        renderPagination(result.totalCount);
        updateSortIndicators();

    } catch (error) {
        console.error("Load error:", error);
        alert(error.message);
    }
}

function renderTable(data) {

    const tbody = document.getElementById("deliveredTableBody");
    tbody.innerHTML = "";

    if (!data || data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted">
                    No delivered records found.
                </td>
            </tr>
        `;
        return;
    }

    data.forEach(d => {

        const deliveredAt = d.delivered_at
            ? formatDate(d.delivered_at)
            : "-";

        const scheduledAt = d.scheduled_at
            ? formatDate(d.scheduled_at)
            : "-";

        const row = `
            <tr>
                <td class="text-center fw-semibold">${d.delivery_ref_code}</td>
                <td class="text-center">${d.transactionCode}</td>
                <td class="text-center">${d.courier}</td>
                <td class="text-center">${scheduledAt}</td>
                <td class="text-center">${deliveredAt}</td>
                <td class="text-center fw-bold">₱${Number(d.grandTotal).toFixed(2)}</td>
                <td class="text-center">${d.delivery_tries}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary"
                            onclick="openMasterSummary(${d.id})">
                        Master Summary
                    </button>
                </td>
            </tr>
        `;

        tbody.insertAdjacentHTML("beforeend", row);
    });
}

function attachSearch() {

    const input = document.getElementById("deliveredSearchInput");

    let timeout = null;

    input.addEventListener("input", function () {

        clearTimeout(timeout);

        timeout = setTimeout(() => {

            currentSearch = this.value;
            currentPage = 1;
            loadDelivered();

        }, 400); // debounce delay
    });
}

function attachSorting() {

    document.querySelectorAll(".sortable").forEach(header => {

        header.addEventListener("click", function () {

            const sortField = this.getAttribute("data-sort");

            if (currentSortBy === sortField) {
                currentSortDir = currentSortDir === "asc" ? "desc" : "asc";
            } else {
                currentSortBy = sortField;
                currentSortDir = "asc";
            }

            currentPage = 1;
            loadDelivered();
        });
    });
}

function updateSortIndicators() {

    document.querySelectorAll(".sort-indicator").forEach(el => {
        el.innerHTML = "";
    });

    const activeHeader = document.querySelector(`[data-sort="${currentSortBy}"]`);

    if (activeHeader) {
        const indicator = activeHeader.querySelector(".sort-indicator");
        indicator.innerHTML = currentSortDir === "asc" ? "▲" : "▼";
    }
}

function renderPagination(totalCount) {

    const pagination = document.getElementById("pagination");
    pagination.innerHTML = "";

    const totalPages = Math.ceil(totalCount / pageSize);

    if (totalPages <= 1) return;

    for (let i = 1; i <= totalPages; i++) {

        const li = document.createElement("li");
        li.className = `page-item ${i === currentPage ? "active" : ""}`;

        li.innerHTML = `<button class="page-link">${i}</button>`;

        li.addEventListener("click", () => {
            currentPage = i;
            loadDelivered();
        });

        pagination.appendChild(li);
    }
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

async function openMasterSummary(deliveryId) {

    try {

        const response = await fetch(`/api/delivery/${deliveryId}/master-summary`);

        if (!response.ok) {
            const text = await response.text();
            throw new Error(text);
        }

        const data = await response.json();

        renderMasterSummary(data);

        const modal = new bootstrap.Modal(
            document.getElementById("masterSummaryModal")
        );

        modal.show();

    } catch (error) {
        alert(error.message);
    }
}


/// MASTER SUMMARY MODAL FUNCTION
function renderMasterSummary(data) {

    const container = document.getElementById("masterSummaryBody");

    const deliveredAt = data.deliveredAt
        ? formatDate(data.deliveredAt)
        : "-";

    const placedAt = data.transactionPlacedAt
        ? formatDate(data.transactionPlacedAt)
        : "-";

    container.innerHTML = `

        <!-- ================= DELIVERY INFO ================= -->
        <div class="card shadow-sm mb-4">
            <div class="card-header fw-bold">
                A. Delivery Information
            </div>
            <div class="card-body">

                <div class="row mb-2">
                    <div class="col-md-6">
                        Delivery Code:<br/>
                        <strong class="fs-5">${data.deliveryCode}</strong>
                    </div>
                    <div class="col-md-6">
                        Status:<br/>
                        <span class="badge bg-success fs-6">${data.status}</span>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-6">
                        Courier:<br/>
                        <strong>${data.courier}</strong>
                    </div>
                    <div class="col-md-6">
                        Delivered At:<br/>
                        <strong>${deliveredAt}</strong>
                    </div>
                </div>

            </div>
        </div>


        <!-- ================= CUSTOMER INFO ================= -->
        <div class="card shadow-sm mb-4">
            <div class="card-header fw-bold">
                B. Customer Information
            </div>
            <div class="card-body">

                <div class="row mb-3">
                    <div class="col-md-6">
                        Customer Name:<br/>
                        <strong>${data.customerName}</strong>
                    </div>
                    <div class="col-md-6">
                        Contact Number:<br/>
                        <strong>${data.customerContactNo ?? "-"}</strong>
                    </div>
                </div>

                <div>
                    Delivery Address:<br/>
                    <strong class="text-muted">
                        ${data.deliveryAddress ?? "-"}
                    </strong>
                </div>
                <br/>
                <div>
                    Email:<br/>
                    <strong class="text-muted">
                        ${data.customerEmail ?? "-"}
                    </strong>
                </div>

            </div>
        </div>


        <!-- ================= TRANSACTION INFO ================= -->
        <div class="card shadow-sm mb-4">
            <div class="card-header fw-bold">
                C. Transaction & Payment
            </div>
            <div class="card-body">

                <div class="row mb-3">
                    <div class="col-md-6">
                        Transaction Code:<br/>
                        <strong>${data.transactionCode}</strong>
                    </div>
                    <div class="col-md-6">
                        Placed At:<br/>
                        <strong>${placedAt}</strong>
                    </div>
                </div>

                <div class="row mb-3">
                    <div class="col-md-6">
                        Shipping Method:<br/>
                        <strong>${data.shippingMethod ?? "-"}</strong>
                    </div>
                    <div class="col-md-6">
                        Payment Method:<br/>
                        <strong>${data.paymentMethod ?? "-"}</strong>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-6">
                        Payment Status:<br/>
                        <strong>${data.paymentStatus ?? "-"}</strong>
                    </div>
                    <div class="col-md-6">
                        Grand Total:<br/>
                        <strong class="fs-5 text-success">
                            ₱${Number(data.grandTotal).toFixed(2)}
                        </strong>
                    </div>
                </div>

            </div>
        </div>


        <!-- ================= DELIVERED ITEMS ================= -->
        <div class="card shadow-sm">
            <div class="card-header fw-bold">
                D. Delivered Items
            </div>
            <div class="card-body p-0">

                <table class="table table-sm table-bordered align-middle mb-0">
                    <thead class="table-light">
                        <tr>
                            <th style="width:70%">Product Details</th>
                            <th style="width:30%">Serial Number</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.items && data.items.length > 0
            ? data.items.map(i => `
                                <tr>
                                    <td>
                                        <strong>${i.productBrand ?? ""}</strong><br/>
                                        ${i.productSeries ?? ""} ${i.productModel ?? ""}<br/>
                                        <small class="text-muted">
                                            SKU: ${i.productSku ?? "-"} |
                                            ${i.formFactor ?? "-"}
                                        </small>
                                    </td>
                                    <td class="fw-semibold text-center">
                                        ${i.serialNumber ?? "-"}
                                    </td>
                                </tr>
                            `).join("")
            : `
                                <tr>
                                    <td colspan="2" class="text-center text-muted">
                                        No delivered items found.
                                    </td>
                                </tr>
                            `
        }
                    </tbody>
                </table>

            </div>
        </div>
    `;
}