// ===== STATE =====
let inventoryPage = 1;
let inventoryPageSize = 3;
let inventorySortBy = "createDate";
let inventorySortDir = "desc";
let inventorySearch = "";
let inventorySearchTimer = null;


// ===== INITIAL LOAD =====
document.addEventListener("DOMContentLoaded", () => {
    loadInventory();
});


///==================================================== This will Display the parent Row =============================================================
// ===== LOAD INVENTORY =====
function loadInventory() {

    const params = new URLSearchParams({
        page: inventoryPage,
        pageSize: inventoryPageSize,
        sortBy: inventorySortBy,
        sortDir: inventorySortDir,
        search: inventorySearch
    });

    fetch(`/api/inventory/inventory-list?${params}`)
        .then(res => {
            if (!res.ok) throw new Error("Failed to load inventory");
            return res.json();
        })
        .then(data => {
            renderInventory(data.items);

            updateInventorySummary(
                data.totalCount,
                data.totalStock,
                data.goodStock
            );

            renderInventoryPagination(data.totalCount); // ✅ HERE
        })
        .catch(err => {
            console.error(err);
            alert("Failed to load inventory.");
        });

       
}


// ===== RENDER TABLE =====
function renderInventory(items) {

    const body = document.getElementById("inventoryBody");
    body.innerHTML = "";

    if (!items || items.length === 0) {
        body.innerHTML = `
            <tr>
                <td colspan="11" class="text-center text-muted">
                    No inventory items found.
                </td>
            </tr>`;
        return;
    }

    items.forEach(p => {

        const stockBadge =
            p.stock_status === "LOW_STOCK"
                ? `<span class="badge bg-danger">LOW</span>`
                : `<span class="badge bg-success">OK</span>`;

        const rowClass =
            p.stock_status === "LOW_STOCK"
                ? "table-warning"
                : "";

        body.innerHTML += `
                <!-- PARENT ROW -->
                <tr class="${rowClass}" data-product-id="${p.id}">
                    <td class="text-center toggle"
                        onclick="toggleInventoryRow(${p.id}, this)">
                        ▶
                    </td>

                    <td>${p.sku}</td>
                    <td>${p.manufacturer}</td>
                    <td>${p.product_model}</td>
                    <td>${p.product_series ?? "—"}</td>
                    <td>${p.formfactor ?? "—"}</td>

                    <td class="text-center">
                        ${stockBadge}
                    </td>

                    <td class="text-center">
                        ${p.total_stock}
                    </td>

                    <td class="text-center">
                        ${p.reorder_level ?? "—"}
                    </td>

                    <td>
                        ${formatDate(p.created_at)}
                    </td>
                </tr>

                <!-- CHILD ROW (HIDDEN) -->
                <tr id="inventory-child-${p.id}" class="d-none bg-light">
                    <td colspan="10" class="text-center text-muted">
                        Loading stock…
                    </td>
                </tr>
            `;
    });
}

// ===== SORT HANDLER =====
function changeSort(column) {

    if (inventorySortBy === column) {
        inventorySortDir =
            inventorySortDir === "asc" ? "desc" : "asc";
    } else {
        inventorySortBy = column;
        inventorySortDir = "asc";
    }

    inventoryPage = 1;
    loadInventory();
}

// ===== SEARCH HANDLER =====
function searchInventory() {

    clearTimeout(inventorySearchTimer);

    inventorySearchTimer = setTimeout(() => {
        inventorySearch =
            document.getElementById("inventorySearch").value.trim();
        inventoryPage = 1;
        loadInventory();
    }, 300); // 300ms debounce
}

///==================================================== This will Display the Child Row =============================================================

function toggleInventoryRow(productId, toggleEl) {

    const childRow =
        document.getElementById(`inventory-child-${productId}`);

    if (!childRow) return;

    // CLOSE
    if (!childRow.classList.contains("d-none")) {
        childRow.classList.add("d-none");
        toggleEl.innerText = "▶";
        return;
    }

    // OPEN
    toggleEl.innerText = "▼";
    childRow.classList.remove("d-none");

    // If already loaded, don't fetch again
    if (childRow.dataset.loaded === "1") return;

    fetch(`/api/inventory/by-product/${productId}`)
        .then(res => res.json())
        .then(data => renderInventoryChild(productId, data))
        .catch(() => {
            childRow.innerHTML =
                `<td colspan="10" class="text-danger">
                    Failed to load inventory.
                 </td>`;
        });
}

function renderInventoryChild(productId, items) {

    const childRow =
        document.getElementById(`inventory-child-${productId}`);

    if (!items || items.length === 0) {
        childRow.innerHTML = `
            <td colspan="10" class="text-center text-muted">
                No stock records found.
            </td>`;
        return;
    }

    let html = `
    <td colspan="10">
        <div class="inventory-child-content">

            <strong class="d-block mb-2">
                Stock List & Serial Numbers
            </strong>

            <div class="inventory-child-scroll">
                <table class="table table-sm table-bordered mb-0">
                    <thead class="table-light">
                        <tr>
                            <th>#</th>
                            <th>Serial Number</th>
                            <th>Status</th>
                            <th>Supplier</th>
                            <th>Received As</th>
                            <th>Received Date</th>
                        </tr>
                    </thead>
                    <tbody>
`;



    items.forEach((i, idx) => {
        html += `
            <tr>
                <td>${idx + 1}</td>
                <td>${i.serial_number}</td>
                <td>
                    <span class="badge ${getInventoryStatusBadge(i.status)}">
                        ${i.status}
                    </span>
                </td>
                <td>${i.supplier_name}</td>
                <td>${i.received_as}</td>
                <td>${formatDate(i.created_at)}</td>
                <td>
                 <button class="btn btn-outline-secondary markasdefective-btn">
                        Set As Defective
                    </button>
                </td>
            </tr>
        `;
    });

    html += `
                    </tbody>
                </table>
            </div>
        </div>
    </td>
`;



    childRow.innerHTML = html;
    childRow.dataset.loaded = "1";
}



// ===== HELPERS =====
function formatDate(date) {
    if (!date) return "—";
    return new Date(date).toLocaleDateString();
}

function getInventoryStatusBadge(status) {
    switch (status) {
        case "GOOD_STOCK": return "bg-success";
        case "RESERVED": return "bg-warning text-dark";
        case "SOLD": return "bg-secondary";
        case "DEFECTIVE": return "bg-danger";
        default: return "bg-light text-dark";
    }
}

// this will be use to get info on inventory (below the searchbar text)
function updateInventorySummary(totalProducts, totalStock, goodStock) {

    const el = document.getElementById("inventorySummary");
    if (!el) return;

    el.innerHTML = `
        <strong>${totalProducts}</strong> products •
        <strong>${totalStock}</strong> total stocks •
        <strong>${goodStock}</strong> good stocks
    `;
}


//pagination
function renderInventoryPagination(totalCount) {

    const ul = document.getElementById("inventoryPagination");
    if (!ul) return;

    ul.innerHTML = "";

    const totalPages = Math.ceil(totalCount / inventoryPageSize);
    if (totalPages <= 1) return;

    for (let p = 1; p <= totalPages; p++) {
        ul.innerHTML += `
            <li class="page-item ${p === inventoryPage ? "active" : ""}">
                <button class="page-link"
                        onclick="goToInventoryPage(${p})">
                    ${p}
                </button>
            </li>
        `;
    }
}
function goToInventoryPage(page) {
    inventoryPage = page;
    loadInventory();
}

