//// for po modal ////
let poModal;
let productModal;

//for inventory modal
let inventoryModal;
let currentInventoryItem = null;
let currentReceivedId = null; 
let purchaseOrderReceivedId = null;

let inventoryItems = [];

let selectedPo = null;


function openPoModal() {
    poModal.show();
    loadReceivablePOs();
}

function loadReceivablePOs() {
    fetch("/api/purchase-orders/receivable")
        .then(res => res.json())
        .then(result => {
            const pos = Array.isArray(result) ? result : result.data;

            if (!Array.isArray(pos)) {
                console.error("Unexpected API response:", result);
                return;
            }

            const body = document.getElementById("poModalBody");
            body.innerHTML = "";

            if (pos.length === 0) {
                body.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center text-muted">
                            No receivable purchase orders found.
                        </td>
                    </tr>`;
                return;
            }
            pos.forEach(po => {
                const isLate = po.expected_delivery
                    ? new Date(po.expected_delivery) < new Date()
                    : false;

                        body.innerHTML += `
                <tr>
                    <td>${po.po_number}</td>
                    <td>${po.supplier_name}</td>
                    <td>${formatDate(po.expected_delivery)}</td>
                    <td class="text-end">${formatCurrency(po.total_amount)}</td>
                    <td>
                        <span class="badge ${isLate ? 'badge bg-warning text-dark' : 'bg-primary'}">
                            ${isLate ? 'SENT_LATE' : 'SENT'}
                        </span>
                    </td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-primary"
                            onclick='selectPo(${JSON.stringify(po)})'>
                            Select
                        </button>
                    </td>
                </tr>`;
                    });

        })
        .catch(err => console.error("Failed to load receivable POs:", err));
}


// this will load po
function selectPo(po) {
    selectedPo = po.id;
    if (!clearDeliveredItemsWithConfirm()) return;
    clearDeliveredItems();
    document.getElementById("poNumber").innerText = po.po_number;
    document.getElementById("poSupplier").innerText = po.supplier_name;
    document.getElementById("poBranch").innerText = po.branch_name;
    document.getElementById("poPayment").innerText = po.payment_type;
    document.getElementById("poExpected").innerText =
        formatDate(po.expected_delivery);

    document.getElementById("poItems").innerText = po.item_count;
    document.getElementById("poStatus").innerText = po.status;
    document.getElementById("poQuantity").innerText = po.total_quantity;
    document.getElementById("poTotal").innerText =
        formatCurrency(po.total_amount);
    document.getElementById("poFreight").innerText =
        formatCurrency(po.freight_cost);

    document.getElementById("poInfo").classList.remove("d-none");


    // loading PO Articles
    loadPoArticles(po.id);
    poModal.hide();
}

//Load Purchase Order Articles
function loadPoArticles(poId) {
    fetch(`/api/purchase-orders/${poId}/articles`)
        .then(res => res.json())
        .then(items => {
            const body = document.getElementById("poArticlesBody");
            body.innerHTML = "";

            if (items.length === 0) {
                body.innerHTML = `
                    <tr>
                        <td colspan="10" class="text-center text-muted">
                            No articles found for this PO.
                        </td>
                    </tr>`;
                return;
            }

            items.forEach(item => {
                body.innerHTML += `
                    <tr>
                        <td>${item.sku}</td>
                        <td>${item.manufacturer}</td>
                        <td>${item.product_model}</td>
                        <td>${item.product_series}</td>
                        <td>${item.part_number_a}</td>
                        <td class="text-center">${item.total_gross_weight}</td>
                        <td>${item.form_factor}</td>
                        <td class="text-center fw-semibold">${item.qty}</td>
                        <td class="text-end">${formatCurrency(item.unit_price)}</td>
                        <td class="text-end fw-semibold">
                            ${formatCurrency(item.line_total)}
                        </td>
                        <td class="text-center">
                            <button class="btn btn-sm btn-outline-success" title="Copy to Delivered"
                                onclick='copyToDelivered(${JSON.stringify(item)})'>
                                📋 Copy
                            </button>
                        </td>
                    </tr>
                `;

            });

            document
                .getElementById("poArticlesSection")
                .classList.remove("d-none");
        })
        .catch(err => console.error("Failed to load PO articles:", err));
}

//this will copy the reference to the actual delivered
function copyToDelivered(item) {

    if (document.querySelector(`[data-sku="${item.sku}"]`)) {
        alert("This item is already copied to Section C (Actual Delivered Articles)");
        return;
    }

    addDeliveredItem({
        sku: item.sku,
        product_id: item.product_id,
        product_name: `${item.manufacturer}    ${item.product_model}    ${item.product_series}    ${ item.form_factor ?? ""}`.trim(),
        qty: item.qty,                 // default from PO
        unit_price: item.unit_price,   // default from PO
    });
}

function addDeliveredItem(data) {
    const body = document.getElementById("deliveredItemsBody");

    const row = document.createElement("tr");

    // 🔥 SET DATASET EXPLICITLY
    row.dataset.productId = data.product_id;
    row.dataset.sku = data.sku;

    row.innerHTML = `
        <td>
            <div class="fw-semibold">${data.product_name}</div>
            <div class="text-muted small">${data.sku}</div>
        </td>

        <td class="text-center">
            <input type="number"
                   class="form-control form-control-sm text-center qty-input"
                   value="${data.qty}"
                   min="0">
        </td>

        <td class="text-end">
            <input type="number"
                   class="form-control form-control-sm text-end price-input"
                   value="${data.unit_price}"
                   step="0.01">
        </td>

        <td class="text-center">
            <button class="btn btn-sm btn-outline-danger ms-1"
                    onclick="this.closest('tr').remove()">
                ×
            </button>
        </td>
    `;

    body.appendChild(row);
}



//helpers
function formatDate(date) {
    if (!date) return "—";
    return new Date(date).toLocaleDateString();
}

function formatCurrency(value) {
    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP"
    }).format(value ?? 0);
}

// this will be use to clear section c if new po reference is selected
function clearDeliveredItems() {
    const body = document.getElementById("deliveredItemsBody");
    body.innerHTML = "";
}
//ask if they realy want to clear po
function clearDeliveredItemsWithConfirm() {
    const body = document.getElementById("deliveredItemsBody");

    if (body.children.length > 0) {
        if (!confirm("Changing PO will clear Section C Actual Delivered Article/s. Continue?")) {
            return false;
        }
    }

    body.innerHTML = "";
    return true;
}

//JS: open modal
function openProductModal() {
    document.getElementById("productSearchInput").value = "";
    loadProducts(""); // initial load
    productModal.show();
}

//Search for add Product
function searchProducts() {
    const search = document
        .getElementById("productSearchInput")
        .value;

    loadProducts(search);
}

//this will show products in the add products modal
function loadProducts(search) {
    fetch(`/admin/api/products/po-search?search=${encodeURIComponent(search)}`)
        .then(res => res.json())
        .then(products => {
            const body = document.getElementById("productModalBody");
            body.innerHTML = "";

            if (products.length === 0) {
                body.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center text-muted">
                            No products found.
                        </td>
                    </tr>`;
                return;
            }

            products.forEach(p => {
                body.innerHTML += `
                    <tr>
                        <td>${p.sku}</td>
                        <td>${p.manufacturer}</td>
                        <td>${p.product_model}</td>
                        <td>${p.product_series ?? ""}</td>
                        <td>${p.form_factor}</td>
                        <td class="text-center">
                            <button class="btn btn-sm btn-outline-primary"
                                onclick='selectProduct(${JSON.stringify(p)})'>
                                Select
                            </button>
                        </td>
                    </tr>
                `;
            });
        })
        .catch(err => console.error("Product search failed:", err));
}
//this will add products to section C
function selectProduct(product) {

    // prevent duplicate add
    if (document.querySelector(`[data-sku="${product.sku}"]`)) {
        alert("This product is already added.");
        return;
    }

    addDeliveredItem({
        sku: product.sku,
        product_id: product.id, 
        product_name: `${product.manufacturer}    ${product.product_model}    ${product.product_series}    ${product.form_factor1 ?? ""}`.trim(),
        qty: 1,
        unit_price: 0   // no price from this API (correct for now)
    });

    productModal.hide();
}

//Send to inventory
//OPEN INVENTORY MODAL (per delivered item)
function openInventoryModal(items, purchaseOrderReceivedId) {

    inventoryItems = items;
    currentReceivedId = purchaseOrderReceivedId;

    const body = document.getElementById("inventorySerialBody");
    body.innerHTML = "";

    for (const item of items) {

        // product header row
        body.innerHTML += `
            <tr class="table-light">
                <td colspan="2">
                    <div class="fw-semibold">${item.product_name}</div>
                    <div class="text-muted small">SKU: ${item.sku}</div>
                </td>
            </tr>
        `;

        // serial rows
        for (let i = 1; i <= item.qty; i++) {
            body.innerHTML += `
                <tr data-product-id="${item.product_id}">
                    <td style="width:60px;" class="text-center">${i}</td>
                    <td>
                        <input type="text"
                               class="form-control form-control-sm serial-input"
                               placeholder="Enter serial number">
                    </td>
                </tr>
            `;
        }
    }

    inventoryModal.show();
}




//Collect ALL delivered items from Section C
function openInventoryModalForAll() {

    const rows = document.querySelectorAll("#deliveredItemsBody tr");

    if (rows.length === 0) {
        notifyError("No delivered items to add to inventory.");
        return;
    }

    const items = [];

    for (const row of rows) {

        const productId = Number(row.dataset.productId);
        const sku = row.dataset.sku;
        const name = row.querySelector(".fw-semibold")?.innerText ?? "";
        const qty = Number(row.querySelector(".qty-input")?.value);
        const price = Number(row.querySelector(".price-input")?.value);

        if (!productId) {
            notifyError("Invalid product reference.");
            return;
        }

        if (!qty || qty <= 0) {
            notifyError("Quantity must be greater than 0 for all items.");
            return;
        }

        if (!price || price <= 0) {
            notifyError("Unit price must be greater than 0 for all items.");
            return;
        }

        items.push({
            product_id: productId,
            sku,
            product_name: name,
            qty,
            unit_price: price
        });
    }

    if (items.length === 0) {
        notifyError("No valid delivered items found.");
        return;
    }

    // ✅ Open inventory modal with grouped items
    openInventoryModal(items);
}


//actual payload
function saveInventorySerials() {

    const rows = document.querySelectorAll("#inventorySerialBody tr[data-product-id]");
    const map = {}; // productId → item

    for (const row of rows) {

        const productId = Number(row.dataset.productId);
        const serial = row.querySelector(".serial-input").value.trim();

        if (!serial) {
            alert("All serial numbers are required.");
            return;
        }

        if (!map[productId]) {
            map[productId] = {
                product_Id: productId,
                qty_Received: 0,
                unit_Price: getUnitPriceForProduct(productId),
                serials: []
            };
        }

        map[productId].serials.push(serial);
        map[productId].qty_Received++;
    }

    const payload = Object.values(map);

    console.log("RECEIVING PAYLOAD:", payload);

    if (!selectedPo) {
        alert("Please select a purchase order first.");
        return;
    }

    if (payload.some(p => !p.qty_Received || p.qty_Received <= 0)) {
        alert("Invalid quantity detected.");
        return;
    }

    if (payload.some(p => !p.unit_Price || p.unit_Price <= 0)) {
        alert("Invalid unit price detected.");
        return;
    }

    fetch(`/api/inventory/from-po/${selectedPo}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
        .then(res => {
            if (!res.ok) throw new Error("Failed to receive PO");
            return res.json();
        })
        .then(() => {
            inventoryModal.hide();
            alert("Inventory received successfully.");
            window.location.href = "/Admin/Inventory";
        })
        .catch(err => alert(err.message));
}

// Confirm-close inventory modal
function confirmInventoryClose() {

    if (!confirm("Serial numbers you entered will be lost. Are you sure?")) {
        return;
    }

    inventoryModal.hide();
    clearInventoryModal();
}


function clearInventoryModal() {
    document.getElementById("inventorySerialBody").innerHTML = "";
    inventoryItems = [];
    currentReceivedId = null;
}

//Helper
function getUnitPriceForProduct(productId) {
    const row = document.querySelector(
        `#deliveredItemsBody tr[data-product-id="${productId}"]`
    );

    return Number(row.querySelector(".price-input")?.value ?? 0);
}






//dom
document.addEventListener("DOMContentLoaded", () => {

    poModal = new bootstrap.Modal(
        document.getElementById("poModal")
    );

    window.openPoModal = function () {
        poModal.show();
        loadReceivablePOs();
    };

    productModal = new bootstrap.Modal(
        document.getElementById("productModal")
    );

    inventoryModal = new bootstrap.Modal(
        document.getElementById("inventoryModal")
    );

});