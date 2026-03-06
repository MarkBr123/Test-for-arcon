let selectedTransactionId = null;
let selectedInventoryMap = {};
let deliverySelections = {};
let checkoutItems = []; // store items when transaction loads
let activeCheckoutItemId = null;
let activeOrderedQty = 0;

document.addEventListener("DOMContentLoaded", function () {

    const modal = document.getElementById("transactionModal");

    modal.addEventListener("show.bs.modal", function () {
        loadTransactions();
    });

});
///Open Inventory Modal Properly
//Attach click event to.select - inventory - btn when building rows:
document.addEventListener("click", async function (e) {

    if (e.target.classList.contains("select-inventory-btn")) {

        const row = e.target.closest("tr");

        activeCheckoutItemId = parseInt(row.dataset.checkoutItemId);
        activeOrderedQty = parseInt(row.dataset.orderedQty);
        const productId = parseInt(row.dataset.productId);

        await loadInventoryForProduct(productId);

        const modal = new bootstrap.Modal(
            document.getElementById("inventoryModal")
        );

        modal.show();
    }
});

// this will load only status = "CONFIRMED"
async function loadTransactions() {

    const response = await fetch("/api/transaction/processing-transactions");
    const result = await response.json();

    const transactions = result.data;

    const tbody = document.getElementById("transactionListBody");
    tbody.innerHTML = "";

    if (!Array.isArray(transactions)) {
        console.error("Data is not array:", transactions);
        return;
    }

    transactions.forEach(t => {

        const row = `
            <tr>
                <td>${t.transactionCode}</td>
                <td>${t.customerName}</td>
                <td>${formatToPhilippineDateTime(t.createdAt)}</td>
                <td>${formatToPhilippineDateTime(t.dateConfirmed)}</td>
                <td>${t.status}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-primary select-transaction-btn"
                            data-id="${t.id}">
                        Select
                    </button>
                </td>
            </tr>
        `;

        tbody.insertAdjacentHTML("beforeend", row);
    });

    attachSelectEvents();
}

//Select Button of the modal
function attachSelectEvents() {

    document.querySelectorAll(".select-transaction-btn")
        .forEach(button => {

            button.addEventListener("click", async function () {

                const transactionId = this.dataset.id;

                if (!transactionId) {
                    console.error("Transaction ID missing");
                    return;
                }

                await selectTransaction(transactionId);
            });

        });
}

//this will populate the details in the CreateDelivery.cshtml
async function selectTransaction(transactionId) {

    selectedTransactionId = transactionId;
    selectedInventoryMap = {}; // reset previous selections

    await loadDeliveryItems(transactionId);

    document.getElementById("createDeliveryBtn").disabled = true;

    try {

        const response = await fetch(`/api/transaction/${transactionId}/details`);

        if (!response.ok) {
            throw new Error("Failed to fetch transaction details");
        }

        const data = await response.json();

        // Populate fields
        document.getElementById("summaryTransactionCode").innerText = data.transactionCode;
        document.getElementById("summaryCreatedAt").innerText = formatToPhilippineDateTime(data.createdAt);
        document.getElementById("summaryTransactionConfirmedDate").innerText = formatToPhilippineDateTime(data.transactionConfimedDate);
        document.getElementById("summaryStatus").innerText = data.status;

        document.getElementById("summaryCustomerName").innerText = data.customerName;
        document.getElementById("summaryCustomerContactNumber").innerText = data.customerNo;
        document.getElementById("summaryCustomerDelAddress").innerText = data.deliveryAddress;

        document.getElementById("summaryPaymentMethod").innerText = data.paymentMethod;
        document.getElementById("summaryPaymentStatus").innerText = data.paymentStatus;

        document.getElementById("summaryDeliveryCost").innerText = `₱${data.deliveryCost.toFixed(2)}`;
        document.getElementById("summaryGrandTotal").innerText = `₱${data.grandTotal.toFixed(2)}`;

        const modal = bootstrap.Modal.getInstance(
            document.getElementById("transactionModal")
        );

        const tbody = document.getElementById("summaryItemsTableBody");
        tbody.innerHTML = "";

        if (Array.isArray(data.items) && data.items.length > 0) {

            data.items.forEach(item => {

                const productName = `
            ${item.productManufacturer} 
            ${item.productSeries} 
            ${item.productModel}check
            (${item.productSku})
        `;

                const row = `
            <tr>
                <td>${productName}</td>
                <td class="text-center">${item.qty}</td>
                <td class="text-end">₱ ${Number(item.productPrice).toFixed(2)}</td>
                <td class="text-end">₱ ${Number(item.stdInstallationPrice).toFixed(2)}</td>
                <td class="text-end">₱  ${Number(item.additionalInstallationPrice).toFixed(2)}</td>
                <td class="text-end fw-bold">₱ ${Number(item.totalItemAmount).toFixed(2)}</td>
            </tr>
        `;

                tbody.insertAdjacentHTML("beforeend", row);
            });

        } else {

            tbody.innerHTML = `
        <tr>
            <td colspan="6" class="text-center text-muted">
                No items found
            </td>
        </tr>
    `;
        }

        modal.hide();

    } catch (error) {
        console.error(error);
    }
}


/// this will make date readable
function formatToPhilippineDateTime(isoDateString) {
    if (!isoDateString) return "";

    const date = new Date(isoDateString);

    return date.toLocaleString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Manila"
    });
}



////////// Section C Logic ///////////

async function loadDeliveryItems(transactionId) {

    const response = await fetch(`/api/delivery/transaction/${transactionId}/items`);
    const data = await response.json();

    const tbody = document.getElementById("deliveryItemsTableBody");
    tbody.innerHTML = "";

    data.items.forEach(item => {

        const insufficient = item.stockAvailable < item.orderedQty;

        const row = `
            <tr data-checkout-item-id="${item.checkoutItemId}"
                data-product-id="${item.productId}"
                data-ordered-qty="${item.orderedQty}">

                <td>
                    <strong>${item.productName}</strong><br>
                    <small class="text-muted">SKU: ${item.sku}</small>
                </td>

                <td class="text-center fw-bold">
                    ${item.orderedQty}
                </td>

                <td class="text-center">
                    <span class="badge ${insufficient ? 'bg-danger' : 'bg-success'}">
                        ${item.stockAvailable}
                    </span>
                </td>

                <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary select-inventory-btn">
                        Select Inventory
                    </button>

                    <div class="mt-1">
                        <span class="badge bg-secondary selected-count"
                              id="selection-count-${item.checkoutItemId}">
                            0 / ${item.orderedQty}
                        </span>
                    </div>
                </td>
            </tr>
            `;

        tbody.insertAdjacentHTML("beforeend", row);
    });

    attachInventoryButtons();
}

let currentCheckoutItemId = null;
let currentOrderedQty = 0;
let currentProductId = null;

function attachInventoryButtons() {

    document.querySelectorAll(".select-inventory-btn").forEach(btn => {

        btn.addEventListener("click", async function () {

            const row = this.closest("tr");

            currentCheckoutItemId = row.dataset.checkoutItemId;
            currentOrderedQty = parseInt(row.dataset.orderedQty);
            currentProductId = row.dataset.productId;

            await loadInventoryForProduct(currentProductId);

            const modal = new bootstrap.Modal(document.getElementById("inventoryModal"));
            modal.show();
        });
    });
}

async function loadInventoryForProduct(productId) {

    const response = await fetch(`/api/inventory/product/${productId}/available`);

    if (!response.ok) {
        throw new Error("Failed to load inventory.");
    }

    const data = await response.json();

    const tbody = document.getElementById("inventoryListBody");
    tbody.innerHTML = "";

    const alreadySelected = deliverySelections[activeCheckoutItemId] || [];

    data.forEach(item => {

        const isChecked = alreadySelected.includes(item.inventoryId);

        const row = `
        <tr>
            <td>
                <input type="checkbox"
                       value="${item.inventoryId}"
                       class="inventory-checkbox"
                       ${isChecked ? "checked" : ""} />
            </td>
            <td>${item.serialNumber}</td>
            <td><span class="badge bg-success">GOOD_STOCK</span></td>
        </tr>
        `;

        tbody.insertAdjacentHTML("beforeend", row);
    });

    attachInventorySelectionLimiter();
}

function attachModalValidation() {

    document.querySelectorAll(".inventory-checkbox").forEach(cb => {

        cb.addEventListener("change", function () {

            const selected = document.querySelectorAll(".inventory-checkbox:checked");

            if (selected.length > currentOrderedQty) {
                this.checked = false;
                alert(`You must select exactly ${currentOrderedQty} units.`);
            }
        });
    });
}

document.getElementById("inventoryModal")
    .addEventListener("hidden.bs.modal", function () {

        const selected = Array.from(
            document.querySelectorAll(".inventory-checkbox:checked")
        ).map(cb => parseInt(cb.value));

        selectedInventoryMap[currentCheckoutItemId] = selected;

        updateRowCount(currentCheckoutItemId, selected.length);
        validateAllProducts();
    });

function updateRowCount(checkoutItemId, count) {

    const row = document.querySelector(
        `tr[data-checkout-item-id="${checkoutItemId}"]`
    );

    row.querySelector(".selected-count").innerText =
        `${count} selected`;
}

function validateAllProducts() {

    let valid = true;

    document.querySelectorAll("#deliveryItemsTableBody tr")
        .forEach(row => {

            const id = row.dataset.checkoutItemId;
            const ordered = parseInt(row.dataset.orderedQty);
            const selected = selectedInventoryMap[id]?.length || 0;

            if (selected !== ordered) {
                valid = false;
            }
        });

    document.getElementById("createDeliveryBtn").disabled = !valid;
}


/// Delivery 
////// POST BODY /////////
document.getElementById("createDeliveryBtn")
    .addEventListener("click", async function () {

        try {

            if (!selectedTransactionId) {
                alert("Please select a transaction first.");
                return;
            }

            const courier = document.getElementById("deliveryCourier").value;
            const scheduledDate = document.getElementById("deliveryScheduledDate").value;
            const trackingNumber = document.getElementById("deliveryTrackingNumber").value;

            if (!courier) {
                alert("Please select courier.");
                return;
            }

            if (!scheduledDate) {
                alert("Please select scheduled date.");
                return;
            }

            if (Object.keys(deliverySelections).length === 0) {
                alert("Please select inventory for all items.");
                return;
            }

            // Build SelectedInventory array
            const selectedInventory = [];

            for (const checkoutItemId in deliverySelections) {

                const inventoryIds = deliverySelections[checkoutItemId];

                if (!inventoryIds || inventoryIds.length === 0) {
                    alert("Incomplete inventory selection.");
                    return;
                }

                selectedInventory.push({
                    checkoutItemId: parseInt(checkoutItemId),
                    inventoryIds: inventoryIds
                });
            }

            const payload = {
                transactionId: Number(selectedTransactionId),
                courier: courier,
                scheduledDate: scheduledDate,
                trackingNumber: trackingNumber || null,
                selectedInventory: selectedInventory
            };

            const response = await fetch("/api/delivery", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(error);
            }

            const result = await response.json();

            alert("Delivery Created Successfully!\nCode: " + result.deliveryCode);

            // Optional: redirect
            window.location.href = "/Admin/Transactions/ForShipping";

        } catch (error) {
            console.error(error);
            alert("Error: " + error.message);
        }

    });

///// How deliverySelections Gets Filled (From Inventory Modal)
function confirmInventorySelection() {

    const checkedBoxes = document.querySelectorAll(
        ".inventory-checkbox:checked"
    );

    if (checkedBoxes.length !== activeOrderedQty) {
        alert(`Please select exactly ${activeOrderedQty} unit(s).`);
        return;
    }

    const selectedIds = [];

    checkedBoxes.forEach(cb => {
        selectedIds.push(parseInt(cb.value));
    });

    deliverySelections[activeCheckoutItemId] = selectedIds;

    updateSelectionUI(activeCheckoutItemId);
    checkIfReadyToCreate();

    // 🔥 Proper way to close modal
    const modalElement = document.getElementById("inventoryModal");

    const modalInstance = bootstrap.Modal.getOrCreateInstance(modalElement);
    modalInstance.hide();

    // 🔥 Hard cleanup (prevents stuck overlay)
    setTimeout(() => {
        document.body.classList.remove("modal-open");
        document.querySelectorAll(".modal-backdrop")
            .forEach(el => el.remove());
    }, 200);
}


function updateSelectionUI(checkoutItemId) {

    const row = document.querySelector(
        `tr[data-checkout-item-id='${checkoutItemId}']`
    );

    if (!row) return;

    const orderedQty = parseInt(row.dataset.orderedQty);
    const selectedCount = deliverySelections[checkoutItemId]?.length || 0;

    const badge = document.getElementById(
        `selection-count-${checkoutItemId}`
    );

    badge.innerText = `${selectedCount} / ${orderedQty}`;

    badge.classList.remove("bg-secondary", "bg-success", "bg-danger");

    if (selectedCount === 0) {
        badge.classList.add("bg-secondary");
    }
    else if (selectedCount === orderedQty) {
        badge.classList.add("bg-success");
    }
    else {
        badge.classList.add("bg-danger");
    }
}

function checkIfReadyToCreate() {

    let ready = true;

    for (const item of checkoutItems) {

        const selected = deliverySelections[item.checkoutItemId];

        if (!selected || selected.length !== item.qty) {
            ready = false;
            break;
        }
    }

    document.getElementById("createDeliveryBtn").disabled = !ready;
}

function attachInventorySelectionLimiter() {

    const checkboxes = document.querySelectorAll(".inventory-checkbox");

    checkboxes.forEach(cb => {
        cb.addEventListener("change", function () {

            const checked = document.querySelectorAll(
                ".inventory-checkbox:checked"
            );

            if (checked.length > activeOrderedQty) {
                this.checked = false;
                alert(`You can only select ${activeOrderedQty} unit(s).`);
            }
        });
    });
}


/////ADD NOification ///////