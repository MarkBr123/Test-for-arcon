let currentPage = 1;
let pageSize = 24;
let currentSortBy = "date";
let currentSortDir = "desc";
let currentSearch = "";


function loadPurchaseOrders(page = 1) {
    currentPage = page;

    fetch(`/api/purchase-orders?page=${page}&pageSize=${pageSize}&sortBy=${currentSortBy}&sortDir=${currentSortDir}&search=${encodeURIComponent(currentSearch)}`)
        .then(r => {
            if (!r.ok) throw new Error("Failed to load purchase orders");
            return r.json();
        })
        .then(data => {
            renderPurchaseOrders(data.items);
            renderPagination(data.totalCount); 
            // ✅ SHOW TOTAL PO COUNT
            updatePoCount(data.totalCount);
        })
        .catch(err => {
            console.error(err);
            alert(err.message);
        });

}

// the render table
function renderPurchaseOrders(items) {

    const tbody = document.getElementById("purchaseOrdersTableBody");

    // ✅ REQUIRED GUARD
    if (!tbody) {
        console.warn("purchaseOrdersTableBody not found — skipping render");
        return;
    }

    tbody.innerHTML = "";

    if (!items.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="11" class="text-center text-muted">
                    No purchase orders found
                </td>
            </tr>`;
        return;
    }

    items.forEach(po => {

        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td class="fw-semibold">${po.po_number ?? "—"}</td>
            <td>${po.supplier_name ?? "—"}</td>
            <td>${po.branch_name ?? "—"}</td>
            <td>
                <span class="badge ${getStatusBadge(po.status)}">
                    ${po.status}
                </span>
            </td>
            <td>${po.payment_type ?? "—"}</td>
            <td>${formatDate(po.expected_delivery)}</td>
            <td>${formatCurrency(po.freight_cost)}</td>
            <td class="fw-semibold">${formatCurrency(po.total_amount)}</td>
            <td class="text-center">${po.item_count}</td>
            <td class="text-center">${po.total_quantity}</td>
            <td>${formatDateTime(po.created_at)}</td>
            <td>${formatDateTime(po.updated_at)}</td>


             <td class="text-center">
                <div class="action-wrapper">
                    <button class="btn btn-outline-secondary btn-sm"
                            onclick="togglePoMenu(this);">
                        ⋮
                    </button>

                    <div class="action-menu" onclick="event.stopPropagation();">
                        <button onclick="downloadPoPdf(${po.id})">
                            PDF
                        </button>

                        <button onclick="openPoSummary(${po.id})">
                            Details
                        </button>

                        <button onclick="editPo(${po.id})"
                                ${po.status !== "DRAFT" ? "disabled" : ""}>
                            Edit
                        </button>
                        <button onclick="sendPo(${po.id})"
                                    ${po.status !== "DRAFT" ? "disabled" : ""}>
                                Mark as Sent
                            </button>

                        <button onclick="archivePo(${po.id})"
                                ${po.status !== "DRAFT" ? "disabled" : ""}>
                            Archive
                        </button>
                    </div>
                </div>
            </td>
            `;



        tr.addEventListener("click", () => {
            openPoSummary(po.id);
        });

        tbody.appendChild(tr);
    });
}


// search (LIKE SUPPLIERS)
function applyPurchaseOrderSearch() {
    currentSearch = document
        .getElementById("purchaseOrderSearchInput")
        .value
        .trim();

    loadPurchaseOrders(1);
}

let searchTimeout;

// live search (no need for enter)
document.addEventListener("DOMContentLoaded", () => {

    const tableBody = document.getElementById("purchaseOrdersTableBody");
    const searchInput = document.getElementById("purchaseOrderSearchInput");

    // ✅ Wire search ONLY if input exists
    if (searchInput) {
        searchInput.addEventListener("input", () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                currentSearch = searchInput.value.trim();
                loadPurchaseOrders(1);
            }, 400);
        });
    }

    // ✅ Load ONLY if table exists
    if (tableBody) {
        loadPurchaseOrders();
    }
});


//sort handler
function sortPurchaseOrders(field) {
    if (currentSortBy === field) {
        currentSortDir = currentSortDir === "asc" ? "desc" : "asc";
    } else {
        currentSortBy = field;
        currentSortDir = "asc";
    }

    loadPurchaseOrders(currentPage);
}

//pagination
function renderPagination(totalCount) {

    const ul = document.getElementById("pagination");

    //  REQUIRED GUARD
    if (!ul) {
        console.warn("pagination element not found — skipping pagination");
        return;
    }

    const totalPages = Math.ceil(totalCount / pageSize);
    ul.innerHTML = "";

    if (totalPages <= 1) return;

    // Previous
    ul.insertAdjacentHTML("beforeend", `
        <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
            <a class="page-link" href="#"
               onclick="loadPurchaseOrders(${currentPage - 1})">
                Previous
            </a>
        </li>
    `);

    for (let i = 1; i <= totalPages; i++) {
        ul.insertAdjacentHTML("beforeend", `
            <li class="page-item ${i === currentPage ? "active" : ""}">
                <a class="page-link" href="#"
                   onclick="loadPurchaseOrders(${i})">
                    ${i}
                </a>
            </li>
        `);
    }

    // Next
    ul.insertAdjacentHTML("beforeend", `
        <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
            <a class="page-link" href="#"
               onclick="loadPurchaseOrders(${currentPage + 1})">
                Next
            </a>
        </li>
    `);
}


//Action Stubs
function openPoSummary(id) {
    window.location.href = `/Admin/PurchaseOrders/Summary/${id}`;
}

function editPo(id) {
    window.location.href = `/Admin/PurchaseOrders/Edit/${id}`;
}

//Helpers (REUSE ACROSS PROJECT)
function formatDate(val) {
    if (!val) return "—";
    return new Date(val).toLocaleDateString();
}

function formatCurrency(val) {
    if (val == null) return "—";
    return Number(val).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function formatDateTime(val) {
    if (!val) return "—";
    return new Date(val).toLocaleString();
}


function getStatusBadge(status) {
    switch (status) {
        case "DRAFT": return "badge bg-success-subtle text-success";   // mint
        case "SENT": return "badge bg-primary";
        case "SENT_LATE": return "badge bg-warning text-dark";         // orange
        case "COMPLETED": return "badge bg-success";
        case "EXPIRED": return "badge bg-danger";
        case "ARCHIVED": return "badge bg-secondary";
        default: return "badge bg-light";
    }
}



//Archive PO
function archivePo(id) {

    if (!confirm("Are you sure you want to archive this purchase order? This PO will not show on the list.")) {
        return;
    }

    fetch(`/api/purchase-orders/${id}`, {
        method: "DELETE"
    })
        .then(async r => {
            if (!r.ok) {
                const msg = await r.text();
                throw new Error(msg || "Archive failed");
            }
            return r.json();
        })
        .then(res => {
            console.log("Archived:", res);

            // reload current page (pagination-safe)
            loadPurchaseOrders(currentPage);
        })
        .catch(err => {
            console.error(err);
            alert(err.message);
        });
}

function updatePoCount(totalCount) {
    const el = document.getElementById("poCountInfo");
    if (!el) return;

    if (totalCount === 0) {
        el.textContent = "No purchase orders found";
    } else if (totalCount === 1) {
        el.textContent = "1 purchase order found";
    } else {
        el.textContent = `${totalCount} purchase orders found`;
    }
}


//this will mark the po 'Sent'
function sendPo(poId) {
    if (!confirm("Send this Purchase Order to supplier?")) return;

    fetch(`/api/purchase-orders/${poId}/send`, {
        method: "PUT"
    })
        .then(res => {
            if (!res.ok) throw new Error("Failed to send PO");
            return res.json();
        })
        .then(() => {
            alert("Purchase Order marked as 'SENT'.");

            // Refresh table to update status & buttons
            loadPurchaseOrders();
        })
        .catch(err => {
            alert(err.message);
        });
}



function downloadPoPdf(id) {
    window.open(`/api/purchase-orders/${id}/pdf`, "_blank");
}

///action button
function togglePoMenu(btn) {
    event.stopPropagation();
    // Close all open menus
    document.querySelectorAll('.action-menu')
        .forEach(m => m.style.display = 'none');

    const menu = btn.nextElementSibling;
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
}

// Close menu when clicking outside
document.addEventListener('click', () => {
    document.querySelectorAll('.action-menu')
        .forEach(m => m.style.display = 'none');
});

