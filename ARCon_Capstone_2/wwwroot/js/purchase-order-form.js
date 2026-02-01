let poDraft = {
    supplier_Id: null,
    paymentType: "CASH",
    arcon_Branch_Address: null,
    expected_Delivery: null,
    freight_Cost: 0,
    items: []
};


let selectedProductId = null;
let selectedProduct = null;
let poMode = null;
let isSummaryMode = false;


const requiredPoFields = [
    "supplierSelect",
    "paymentType",
    "branchSelect",
    "expectedDelivery"
];

const PO_MODE = {
    CREATE: "CREATE",
    EDIT: "EDIT",
    SUMMARY: "SUMMARY"
};



const supplierSelect = document.getElementById("supplierSelect");
const paymentType = document.getElementById("paymentType");
const branchSelect = document.getElementById("branchSelect");
const expectedDelivery = document.getElementById("expectedDelivery");
const freightCost = document.getElementById("freightCost");

//added 
const totalAmount = document.getElementById("totalAmount");
const poItemsBody = document.getElementById("poItemsBody");
const productSearchInput = document.getElementById("productSearchInput");
const productResults = document.getElementById("productResults");
const qtyInput = document.getElementById("qtyInput");
const priceInput = document.getElementById("priceInput");



//LOAD DROPDOWNS (API-DRIVEN)
function loadSuppliers() {
    return fetch("/api/suppliers/dropdown")
        .then(r => r.json())
        .then(data => {
            supplierSelect.innerHTML =
                `<option value="">Select supplier</option>` +
                data.map(sup =>
                    `<option value="${sup.id}">${sup.supplier_name}</option>`
                ).join("");
        });
}


function loadBranches() {
    return fetch("/api/branches/dropdown")
        .then(r => r.json())
        .then(data => {
            branchSelect.innerHTML =
                `<option value="">Select branch</option>` +
                data.map(br =>
                    `<option value="${br.id}">${br.branch_name}</option>`
                ).join("");
        });
}


// Add Item + Compute Total

function addSelectedProduct() {

    if (!selectedProduct) {
        alert("Please select a product first.");
        return;
    }

    const qty = Number(qtyInput.value);
    const price = Number(priceInput.value);

    if (!Number.isInteger(qty) || qty <= 0) {
        alert("Quantity must be a positive number.");
        return;
    }

    if (isNaN(price) || price < 0) {
        alert("Unit price must be 0 or greater.");
        return;
    }

    // 🚫 PREVENT DUPLICATES
    const exists = poDraft.items.some(
        i => i.product_Id === selectedProduct.id
    );

    if (exists) {
        alert("This product is already added to the Purchase Order.");
        return;
    }

    poDraft.items.push({
        product_Id: selectedProduct.id,
        sku: selectedProduct.sku,
        manufacturer: selectedProduct.manufacturer,
        product_model: selectedProduct.product_model,
        product_series: selectedProduct.product_series,
        part_number_a: selectedProduct.part_number_a,
        total_gross_weight: selectedProduct.total_gross_weight,
        form_factor: selectedProduct.form_factor,
        qty_Ordered: qty,
        unit_Price: price
    });

    renderItems();
    computeTotal();

    bootstrap.Modal.getInstance(
        document.getElementById("addArticleModal")
    ).hide();
}




function renderItems() {
    poItemsBody.innerHTML = poDraft.items.map((i, idx) => `
        <tr>
            <td>${i.sku}</td>
            <td>${i.manufacturer}</td>
            <td>${i.product_model}</td>
            <td>${i.product_series}</td>
            <td>${i.part_number_a}</td>
            <td>${i.total_gross_weight}</td>
            <td>${i.form_factor}</td>
            <td>${i.qty_Ordered}</td>
            <td>${i.unit_Price.toFixed(2)}</td>
            <td>${(i.qty_Ordered * i.unit_Price).toFixed(2)}</td>
            <td>
                <button class="btn btn-sm btn-danger"
                        onclick="removeItem(${idx})">
                    ✕
                </button>
            </td>
        </tr>
    `).join("");
}


function computeTotal() {
    const itemsTotal = poDraft.items.reduce(
        (sum, i) => sum + (i.qty_Ordered * i.unit_Price), 0
    );

    poDraft.freight_Cost = Number(freightCost.value) || 0;

    totalAmount.value =
        (itemsTotal + poDraft.freight_Cost).toFixed(2);
}

//refreshes freight cost
freightCost.addEventListener("input", () => {
    computeTotal();
});

// OPEN ADD PO ARTICLE MODAL
window.openAddArticleModal = function () {
    const modalEl = document.getElementById("addArticleModal");

    if (!modalEl) {
        console.error("addArticleModal not found in DOM");
        return;
    }

    const modal = new bootstrap.Modal(modalEl);
    modal.show();
};



document.getElementById("productSearchInput")
    ?.addEventListener("input", function () {

        const search = this.value.trim();

        if (search.length < 2) {
            document.getElementById("productResults").innerHTML = "";
            return;
        }

        fetch(`/admin/api/products/po-search?search=${encodeURIComponent(search)}`)

            .then(r => r.json())
            .then(renderProductResults)
            .catch(err => console.error(err));
    });

// RENDER SEARCH RESULTS
function renderProductResults(products) {

    const container = document.getElementById("productResults");

    if (!products.length) {
        container.innerHTML =
            `<div class="text-muted">No products found</div>`;
        return;
    }

    container.innerHTML = products.map(p => `
        <button type="button"
                class="list-group-item list-group-item-action py-3 text-start"
                onclick='selectProduct(${JSON.stringify(p)})'>

            <div class="text-muted small mt-3">
                ${p.sku}
            </div>

            <div class="text-muted small mt-3">
                <span>${p.manufacturer}</span> •
                <span>${p.product_model}</span> •
                <span>${p.product_series ?? "—"}</span> •
                <span>${p.part_number_a ?? "—"}</span> •
                <span>${p.form_factor ?? "—"}</span>
            </div>

        </button>
    `).join("");
}




//HANDLE PRODUCT SELECTION
window.selectProduct = function (product) {
    selectedProduct = product;
    selectedProductId = product.id;

    document.getElementById("productSearchInput").value =
        `${product.sku} - ${product.product_model}`;

    document.getElementById("productResults").innerHTML = "";
};

window.removeItem = function (index) {
    if (isSummaryMode) {
        alert("You cannot remove items while viewing the summary.");
        return;
    }
    poDraft.items.splice(index, 1);
    renderItems();
    computeTotal();
};

// these will check if all inputs are valid
function isBlank(val) {
    return val === null ||
        val === undefined ||
        val.toString().trim() === "" ||
        val === "0";
}


function setInvalid(input, invalid) {
    if (!input) return;

    if (invalid) {
        input.classList.add("is-invalid");
    } else {
        input.classList.remove("is-invalid");
    }
}

function validatePoItems() {
    if (poDraft.items.length === 0) {
        alert("Please add at least one PO article.");
        return false;
    }
    return true;
}

function validatePoBeforeNext() {

    let hasError = false;

    requiredPoFields.forEach(id => {
        const input = document.getElementById(id);

        if (!input) {
            console.error(`Missing input: ${id}`);
            hasError = true;
            return;
        }

        let invalid = false;

        // ✅ SELECT
        if (input.tagName === "SELECT") {
            invalid = !input.value || input.value === "0";
        }

        // ✅ DATE (THIS IS WHERE YOUR CODE GOES)
        else if (input.type === "date") {
            const invalidDate = !input.value;
            setInvalid(input, invalidDate);
            if (invalidDate) hasError = true;
            return; // stop further checks for date
        }

        // ✅ TEXT / OTHERS
        else {
            invalid = isBlank(input.value);
        }

        setInvalid(input, invalid);
        if (invalid) hasError = true;
    });

    // ✅ Must have at least one item
    if (poDraft.items.length === 0) {
        alert("Please add at least one PO article.");
        hasError = true;
    }

    if (hasError) {
        alert("Please complete all required fields.");
        return false;
    }

    return true;
}


window.goToPoReview = function () {

    if (!validatePoBeforeNext()) {
        return;
    }

    // ✅ ALL VALID — OPEN REVIEW MODAL
    openPoReviewModal();
};

requiredPoFields.forEach(id => {
    const input = document.getElementById(id);
    if (!input) return;

    input.addEventListener("input", () => {
        setInvalid(input, false);
    });
});


let isSavingPO = false;


async function createPurchaseOrder() {

    const payload = {
        supplier_id: Number(supplierSelect.value),
        payment_type: paymentType.value,
        arcon_branch_address: Number(branchSelect.value),
        expected_delivery: expectedDelivery.value,
        freight_cost: Number(freightCost.value) || 0,
        items: poDraft.items.map(i => ({
            product_Id: i.product_Id,
            qty_Ordered: i.qty_Ordered,
            unit_Price: i.unit_Price
        }))
    };

    const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error(await res.text());

    const data = await res.json();

    // 🔥 THIS IS CRITICAL
    poDraft.id = data.id;
    poDraft.po_number = data.po_number;
    poDraft.status = data.status;

    console.log("CREATED PO ID:", poDraft.id);
}



////////////////////////////////////////////////// end add po ///////////////////////////////////////////////////


//updated
document.addEventListener("DOMContentLoaded", () => {

    const poIdInput = document.getElementById("poId");
    const poModeInput = document.getElementById("poMode");

    // 🔑 ID decides initial mode
    if (!poIdInput || !poIdInput.value) {
        poMode = PO_MODE.CREATE;
    } else {
        poMode = poModeInput?.value === PO_MODE.SUMMARY
            ? PO_MODE.SUMMARY
            : PO_MODE.EDIT;
    }

    console.log("INITIAL MODE:", poMode);

    syncButtonsWithMode();

    // 👇 KEEP EVERYTHING ELSE YOU ALREADY HAVE BELOW
    Promise.all([
        loadSuppliers(),
        loadBranches()
    ]).then(() => {

        if (poMode === PO_MODE.EDIT || poMode === PO_MODE.SUMMARY) {
            loadPurchaseOrder(poIdInput.value);
        }

        if (poMode === PO_MODE.SUMMARY) {
            isSummaryMode = true;
            setFormReadOnly();
            document.getElementById("pageTitle").textContent =
                "Purchase Order Summary";
        }
    });

    freightCost.addEventListener("input", computeTotal);
    wireProductSearch();
});





/* ===============================
   LOAD PO (EDIT / SUMMARY)
================================ */

function loadPurchaseOrder(id) {
    fetch(`/api/purchase-orders/${id}/summary`)
        .then(r => {
            if (!r.ok) throw new Error("Failed to load purchase order");
            return r.json();
        })
        .then(po => {

            poDraft.id = po.id;

            supplierSelect.value = po.supplier_id;
            paymentType.value = po.payment_type;
            branchSelect.value = po.arcon_branch_address;
            expectedDelivery.value = po.expected_delivery;
            freightCost.value = po.freight_cost;

            // 🔥 NORMALIZE ITEMS HERE
            poDraft.items = po.items.map(i => ({
                product_Id: i.product_id,
                sku: i.sku,
                manufacturer: i.manufacturer,
                product_model: i.product_model,
                product_series: i.product_series,
                part_number_a: i.part_number_a,
                total_gross_weight: i.total_gross_weight,
                form_factor: i.form_factor,
                qty_Ordered: i.qty_ordered,
                unit_Price: i.unit_price
            }));


            renderItems();
            computeTotal();

            // ✅ SET TITLE FOR SUMMARY / EDIT
            const titleText = document.getElementById("pageTitleText");
            const poNumberEl = document.getElementById("poNumberBadge");

            if (titleText && poNumberEl) {
                if (poMode === "SUMMARY") {
                    titleText.textContent = "Purchase Order Summary";
                } else if (poMode === "EDIT") {
                    titleText.textContent = "Edit Purchase Order";
                }

                poNumberEl.textContent = `(${po.po_number})`;
            }


        })
        .catch(err => alert(err.message));
}


function wireProductSearch() {

    let timeout = null;

    productSearchInput.addEventListener("input", () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            searchProducts(productSearchInput.value.trim());
        }, 300);
    });
}

function searchProducts(search) {

    fetch(`/admin/api/products/po-search?search=${encodeURIComponent(search)}`)
        .then(r => r.json())
        .then(renderProductResults);
}

function setFormReadOnly() {

    document
        .querySelectorAll("input, select, textarea")
        .forEach(el => el.disabled = true);

    document.getElementById("addPoArticleBtn")?.classList.add("d-none");
    document.getElementById("nextBtn")?.classList.add("d-none");

    document
        .querySelectorAll(".btn-danger")
        .forEach(btn => btn.classList.add("d-none"));
}

async function updatePurchaseOrder() {

    if (!poDraft.id) {
        alert("Purchase Order ID is missing.");
        return;
    }

    const payload = {
        supplier_id: Number(supplierSelect.value),
        payment_type: paymentType.value,
        arcon_branch_address: Number(branchSelect.value),
        expected_delivery: expectedDelivery.value,
        freight_cost: Number(freightCost.value) || 0,

        items: poDraft.items.map(i => ({
            product_Id: i.product_Id,
            qty_Ordered: i.qty_Ordered,
            unit_Price: i.unit_Price
        }))
    };

    const res = await fetch(`/api/purchase-orders/${poDraft.id}/edit`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
    }

    return;   // IMPORTANT — return nothing

}

// create button handler
function createPoClick() {
    submitCreatePurchaseOrder();
}
//this will submit the new purchase order
async function submitCreatePurchaseOrder() {

    if (poMode !== PO_MODE.CREATE) {
        console.warn("Create blocked. Mode:", poMode);
        return;
    }

    if (!validatePoBeforeNext()) return;

    try {
        await createPurchaseOrder();

        // ✅ SHOW MESSAGE
        alert(`Purchase Order ${poDraft.po_number} created successfully!`);

        // ✅ REDIRECT TO INDEX PAGE
        window.location.href = "/Admin/PurchaseOrders";

        // 🚨 STOP EXECUTION COMPLETELY
        return;

    } catch (err) {
        alert(err.message);
    }
}




//update button handler
function updatePoClick() {
    submitUpdatePurchaseOrder();
}

//this will update thepurchase order
async function submitUpdatePurchaseOrder() {

    if (poMode !== PO_MODE.EDIT) {
        console.warn("Update blocked. Mode:", poMode);
        return;
    }

    if (!validatePoBeforeNext()) return;

    try {
        await updatePurchaseOrder();

        alert("Purchase Order updated successfully!");

        window.location.href = "/Admin/PurchaseOrders";
        return;

    } catch (err) {
        alert(err.message);
    }
}





//STEP 5: Add explicit EDIT transition
function enterEditMode() {

    if (poMode !== PO_MODE.SUMMARY) return;

    poMode = PO_MODE.EDIT;
    isSummaryMode = false;

    document.getElementById("createBtn").classList.add("d-none");
    document.getElementById("updateBtn").classList.remove("d-none");

    renderItems();
}



function syncButtonsWithMode() {

    const createBtn = document.getElementById("createBtn");
    const updateBtn = document.getElementById("updateBtn");

    if (!createBtn || !updateBtn) return;

    if (poMode === PO_MODE.CREATE) {
        createBtn.classList.remove("d-none");
        updateBtn.classList.add("d-none");
    }
    else if (poMode === PO_MODE.EDIT) {
        createBtn.classList.add("d-none");
        updateBtn.classList.remove("d-none");
    }
    else {
        // SUMMARY
        createBtn.classList.add("d-none");
        updateBtn.classList.add("d-none");
    }
}
