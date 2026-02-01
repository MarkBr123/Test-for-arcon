let searchTimeout = null;
let currentSearch = "";

/* ---------- STATE ---------- */
let currentPage = 1;
const pageSize = 3;
let sortBy = "createDate";
let sortDir = "desc";
let totalCount = 0;
let currentProductId = null;

// for modals
let productDraft = {
    manufacturerId: 0,
    formFactorID: 0,

    productModel: "",
    productSeries: "",

    sku: "",
    partNumberA: "",
    partNumberB: null,

    originalSellingPrice: 0,

    discountType: "NONE",
    discountValue: 0,

    reorderLevel: 3,

    arUrl: null,

    manufacturerWarrantyYears: 0,
    outrightReplacementDays: 0,

    grossWeightA: 0,
    grossWeightB: 0,
    totalGrossWeight: 0,

    technologies: [],
    specifications: [],
    tags: []
};


/* ---------------- LOAD ---------------- */
function loadProducts(page = 1) {
    currentPage = page;

    fetch(`/admin/api/products?page=${currentPage}&pageSize=${pageSize}&sortBy=${sortBy}&sortDir=${sortDir}&search=${encodeURIComponent(currentSearch ?? "")}`)
        .then(r => r.json())
        .then(data => {
            totalCount = data.totalCount;
            renderTable(data.items);
            renderPagination();
        })
        .catch(err => console.error(err));
}




/* ---------------- RENDER TABLE ---------------- */
function renderTable(items) {
    const tbody = document.querySelector("#productsTable tbody");
    tbody.innerHTML = "";

    if (!items || items.length === 0) {
        tbody.innerHTML = `
                <tr>
                    <td colspan="12" class="text-center text-muted">
                        No products found
                    </td>
                </tr>`;
        return;
    }

    items.forEach(p => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
                <td class="small text-center">${p.sku}</td>
                <td class="small text-center">${p.manufacturer}</td>
                <td class="small text-center">${p.product_model}</td>
                <td class="small text-center">${p.product_series ?? "-"}</td>
                <td class="small text-center">${p.formfactor ?? "-"}</td>

                <td class="small text-end">
                    ₱${Number(p.original_selling_price).toLocaleString()}
                </td>
                <td class="small text-end">
                    ₱${Number(p.actual_selling_price).toLocaleString()}
                </td>

                <td class="small text-center">
                    <span class="badge bg-${statusColor(p.status)}">
                        ${p.status}
                    </span>
                </td>

                <td class="small text-center">${p.discount_type ?? "-"}</td>
                <td class="small text-end">${p.discount_value ?? "-"}</td>

                <td class="small text-center">
                    ${new Date(p.created_at).toLocaleDateString()}
                </td>

                   ${p.ar_url
                ? `<a href="${normalizeUrl(p.ar_url)}"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="btn btn-sm btn-outline-info me-1">
                      AR
                     </a>`
                : `<button class="btn btn-sm btn-outline-secondary me-1" disabled>AR</button>`
            }
                        <button class="btn btn-sm btn-outline-secondary me-1"
                            onclick="viewDetails(event, ${p.id})">Details</button>
                    <button class="btn btn-sm btn-primary me-1"
                                    onclick="productUpdate_openModal(${p.id})">Edit</button>
                    <button class="btn btn-sm btn-danger"
                            onclick="archiveProduct(event, ${p.id})">
                            Archive
                    </button>       
                </td>
            `;


        tbody.appendChild(tr);
    });
}

//ar button open link

function openAr(event, url) {
    event.stopPropagation();

    if (!url || url.trim() === "") {
        alert("No AR link available for this product.");
        return;
    }

    window.open(url, "_blank", "noopener");
}

function normalizeUrl(url) {
    if (!url) return "";

    // already absolute
    if (url.startsWith("http://") || url.startsWith("https://")) {
        return url;
    }

    // force https
    return "https://" + url;
}


/* ---------------- SORT ---------------- */
function sort(column) {
    if (sortBy === column) {
        sortDir = sortDir === "asc" ? "desc" : "asc";
    } else {
        sortBy = column;
        sortDir = "asc";
    }
    currentPage = 1;
    loadProducts();
}

/* ---------------- PAGINATION ---------------- */
function renderPagination() {
    const totalPages = Math.ceil(totalCount / pageSize);
    const ul = document.getElementById("pagination");
    ul.innerHTML = "";

    if (totalPages <= 1) return;

    // ---------- PREVIOUS ----------
    const prevDisabled = currentPage === 1 ? "disabled" : "";
    ul.innerHTML += `
            <li class="page-item ${prevDisabled}">
                <a class="page-link" href="#" onclick="goToPage(${currentPage - 1})">
                    Previous
                </a>
            </li>
        `;

    // ---------- PAGE NUMBERS ----------
    for (let i = 1; i <= totalPages; i++) {
        ul.innerHTML += `
                <li class="page-item ${i === currentPage ? "active" : ""}">
                    <a class="page-link" href="#" onclick="goToPage(${i})">
                        ${i}
                    </a>
                </li>
            `;
    }

    // ---------- NEXT ----------
    const nextDisabled = currentPage === totalPages ? "disabled" : "";
    ul.innerHTML += `
            <li class="page-item ${nextDisabled}">
                <a class="page-link" href="#" onclick="goToPage(${currentPage + 1})">
                    Next
                </a>
            </li>
        `;
}


function goToPage(page) {

    // prevent invalid pages
    if (page < 1) return;

    const totalPages = Math.ceil(totalCount / pageSize);
    if (page > totalPages) return;

    loadProducts(page);
}


/* ---------------- HELPERS ---------------- */
function statusColor(status) {
    switch (status) {
        case "ACTIVE": return "success";
        case "DISCONTINUED": return "warning";
        case "ARCHIVED": return "secondary";
        default: return "dark";
    }
}

/* ---------------- ACTIONS ---------------- */
function arLink(e, id) {
    e.stopPropagation();
    console.log("AR link:", id);
}


// fill Summary Modal
function fillSummaryModal(d) {

    // BASIC PRODUCT INFO
    document.getElementById("dSku").textContent = d.sku ?? "-";
    document.getElementById("dProductModel").textContent = d.product_Model ?? "-";
    document.getElementById("dProductSeries").textContent = d.product_Series ?? "-";
    document.getElementById("dPartNumberA").textContent = d.part_Number_A ?? "-";
    document.getElementById("dPartNumberB").textContent = d.part_Number_B ?? "-";
    document.getElementById("dReorderLevel").textContent = d.reorder_level ?? "-";

    // RELATIONS
    document.getElementById("dFormFactor").textContent = d.form_factor ?? "-";
    document.getElementById("dManufacturer").textContent = d.manufacturer ?? "-";
    document.getElementById("dStatus").textContent = d.status ?? "-";
    document.getElementById("dReorderLevel").textContent = d.reorder_level ?? "-";

    // PRICING
    document.getElementById("dOriginalPrice").textContent =
        d.original_Selling_Price != null ? `₱${d.original_Selling_Price}` : "-";

    document.getElementById("dDiscountedPrice").textContent =
        d.discounted_Selling_Price != null ? `₱${d.discounted_Selling_Price}` : "-";

    document.getElementById("dDiscountType").textContent = d.discount_Type ?? "-";
    document.getElementById("dDiscountValue").textContent =
        d.discount_Value != null ? d.discount_Value : "-";

    document.getElementById("dActualPrice").textContent =
        d.actual_Selling_Price != null ? `₱${d.actual_Selling_Price}` : "-";

    // AR
    const arLink = document.getElementById("dArUrl");
    if (d.ar_url) {
        arLink.href = d.ar_url;
        arLink.textContent = "View AR";
        arLink.style.display = "inline";
    } else {
        arLink.textContent = "-";
        arLink.removeAttribute("href");
    }

    // WARRANTY / REPLACEMENT
    document.getElementById("dWarrantyYears").textContent =
        d.manufacturer_Warranty_Years != null ? `${d.manufacturer_Warranty_Years} year(s)` : "-";

    document.getElementById("dReplacementDays").textContent =
        d.outright_Replacement_Days != null ? `${d.outright_Replacement_Days} day(s)` : "-";

    // WEIGHT
    document.getElementById("dGrossWeightA").textContent =
        d.gross_Weight_A != null ? `${d.gross_Weight_A} kg` : "-";

    document.getElementById("dGrossWeightB").textContent =
        d.gross_Weight_B != null ? `${d.gross_Weight_B} kg` : "-";

    document.getElementById("dTotalGrossWeight").textContent =
        d.total_Gross_Weight != null ? `${d.total_Gross_Weight} kg` : "-";

    // AUDIT
    document.getElementById("dCreatedAt").textContent =
        d.created_At ? new Date(d.created_At).toLocaleString() : "-";

    document.getElementById("dUpdatedAt").textContent =
        d.updated_At ? new Date(d.updated_At).toLocaleString() : "-";

    // SPECIFICATIONS
    const specBody = document.getElementById("dSpecifications");
    specBody.innerHTML = "";

    (d.specifications || []).forEach(s => {
        specBody.innerHTML += `
                <tr>
                    <td>${s.key}</td>
                    <td>${s.value}</td>
                </tr>`;
    });

    // TAGS
    const tagDiv = document.getElementById("dTags");
    tagDiv.innerHTML = "";

    (d.tags || []).forEach(t => {
        tagDiv.innerHTML += `<span class="badge bg-secondary me-1">${t}</span>`;
    });

    // TECHNOLOGIES
    const techList = document.getElementById("dTechnologies");
    techList.innerHTML = "";

    (d.technologies || []).forEach(t => {
        techList.innerHTML += `
                <li class="list-group-item">
                    <strong>${t.name}</strong>
                    <div class="text-muted small">${t.description ?? ""}</div>
                </li>`;
    });
}


//  renderSpecifications
function renderSpecifications(specs) {
    const tbody = document.getElementById("specTableBody");
    tbody.innerHTML = "";

    if (!specs || specs.length === 0) {
        tbody.innerHTML = `
                <tr>
                    <td colspan="2" class="text-muted text-center">
                        No specifications available
                    </td>
                </tr>`;
        return;
    }

    specs.forEach(s => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
                <td>${s.key}</td>
                <td>${s.value}</td>
            `;
        tbody.appendChild(tr);
    });
}
// render technologies
function renderTechnologies(technologies) {
    const container = document.getElementById("technologyContainer");
    container.innerHTML = "";

    if (!technologies || technologies.length === 0) {
        container.innerHTML =
            `<span class="text-muted">No technologies</span>`;
        return;
    }

    technologies.forEach(t => {
        const div = document.createElement("div");
        div.className = "border rounded p-2 mb-2";

        div.innerHTML = `
                <strong>${t.name}</strong>
                <div class="text-muted small">
                    ${t.description ?? ""}
                </div>
            `;

        container.appendChild(div);
    });
}

//render tags
function renderTags(tags) {
    const container = document.getElementById("tagBadgeContainer");
    container.innerHTML = "";

    if (!tags || tags.length === 0) {
        container.innerHTML =
            `<span class="text-muted">No tags</span>`;
        return;
    }

    tags.forEach(tag => {
        const span = document.createElement("span");
        span.className = "badge bg-secondary me-1 mb-1";
        span.textContent = tag;
        container.appendChild(span);
    });
}


function viewDetails(event, id) {
    event.stopPropagation();

    fetch(`/admin/api/products/summary/${id}`)
        .then(r => {
            if (!r.ok) throw new Error("Failed to load product summary");
            return r.json();
        })
        .then(data => {
            fillSummaryModal(data);

            const modalEl = document.getElementById("productSummaryModal");
            const modal = new bootstrap.Modal(modalEl);
            modal.show();
        })
        .catch(err => {
            console.error(err);
            alert("Unable to load product summary");
        });
}

function editProduct(e, id) {
    e.stopPropagation();
}
function archiveProduct(e, id) {
    e.stopPropagation();

    if (!confirm("Archive this product?")) return;

    fetch(`/admin/api/products/${id}`, {
        method: "DELETE"
    })
        .then(res => {
            if (!res.ok) throw new Error("Failed");
            return res.json();
        })
        .then(data => {
            console.log("Archived:", data);
            location.reload(); // or refresh table
        })
        .catch(err => {
            console.error(err);
            alert("Archive failed");
        });
}



/* ---------------- INIT ---------------- */
document.addEventListener("DOMContentLoaded", loadProducts);

// modals
function onDiscountChange() {
    productDraft.discountType = discountType.value;

    if (discountType.value === "NONE") {
        discountValue.classList.add("d-none");
        discountValue.value = "";
        productDraft.discountValue = null;
    } else {
        discountValue.classList.remove("d-none");
    }
}

function goTech() {
    productDraft.manufacturerId = parseInt(manufacturerId.value);
    productDraft.formFactorId = formFactorId.value ? parseInt(formFactorId.value) : null;

    productDraft.productModel = productModel.value;
    //productDraft.sku = sku.value;
    productDraft.partNumberA = partA.value;
    productDraft.originalSellingPrice = parseFloat(price.value);
    productDraft.productSeries = productSeries.value;

    productDraft.manufacturerWarrantyYears =
        parseInt(manufacturerWarrantyYears.value) || 0;

    productDraft.outrightReplacementDays =
        parseInt(outrightReplacementDays.value) || 0;

    productDraft.grossWeightA =
        parseFloat(grossWeightA.value) || 0;

    productDraft.grossWeightB =
        parseFloat(grossWeightB.value) || 0;

    //productDraft.totalGrossWeight =
    //   parseFloat(totalGrossWeight.value) || 0;

    productDraft.arUrl = arUrl.value || null;
    productDraft.partNumberB = partNumberB.value || null;


    if (productDraft.discountType !== "NONE") {
        productDraft.discountValue = parseFloat(discountValue.value);
        if (!productDraft.discountValue || productDraft.discountValue <= 0) {
            alert("Invalid discount value");
            return;
        }
    }

    //if (!productDraft.manufacturerId || !productDraft.productModel || !productDraft.sku) {
    //    step1Error.classList.remove("d-none");
    //    return;
    //}

    bootstrap.Modal.getInstance(step1Modal).hide();
    new bootstrap.Modal(techModal).show();
}

function addTechnology() {
    if (!techName.value) return;

    productDraft.technologies.push({
        technologyName: techName.value,
        technologyDesc: techDesc.value
    });

    techList.innerHTML += `<li class="list-group-item">${techName.value}</li>`;
    techName.value = techDesc.value = "";
}

function goSpec() {
    bootstrap.Modal.getInstance(techModal).hide();
    new bootstrap.Modal(specModal).show();
}

function addSpecRow() {
    specTable.innerHTML += `
                <tr>
                    <td><input class="form-control key" placeholder="e.g. Cooling Capacity" /></td>
                    <td><input class="form-control value" placeholder="e.g. 1.5 HP" /></td>
                    <td><button class="btn btn-danger btn-sm" onclick="this.closest('tr').remove()">X</button></td>
                </tr>`;
}

function goTags() {

    // ✅ STEP 4: COLLECT SPECIFICATIONS HERE
    productDraft.specifications = [];

    document.querySelectorAll(".spec-input").forEach(input => {
        const value = input.value.trim();
        const keyId = parseInt(input.dataset.keyId);

        if (value !== "") {
            productDraft.specifications.push({
                keyId: keyId,
                value: value
            });
        }
    });

    // OPTIONAL: basic validation
    if (productDraft.specifications.length === 0) {
        alert("Please enter at least one specification.");
        return;
    }

    // move to next modal
    bootstrap.Modal.getInstance(specModal).hide();
    new bootstrap.Modal(tagModal).show();
}


function addTag() {
    const input = document.getElementById("tagInput");
    const value = input.value.trim();
    if (!value) return;

    // remove empty state
    const empty = document.getElementById("tagEmpty");
    if (empty) empty.remove();

    const li = document.createElement("li");
    li.className = "list-group-item d-flex align-items-center justify-content-between";

    const span = document.createElement("span");
    span.className = "tag-pill";
    span.textContent = value;
    span.title = value; // 👈 hover shows full text

    const btn = document.createElement("button");
    btn.className = "btn btn-sm btn-outline-danger ms-2";
    btn.innerHTML = "&times;";
    btn.onclick = () => li.remove();

    li.appendChild(span);
    li.appendChild(btn);

    document.getElementById("tagList").appendChild(li);
    input.value = "";
}

function back(prev, current) {
    bootstrap.Modal.getInstance(current).hide();
    new bootstrap.Modal(prev).show();
}
function saveProduct() {
    fetch('/admin/api/products/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productDraft)
    })
        .then(async r => {
            const text = await r.text();   // 🔥 capture server message

            if (!r.ok) {
                throw new Error(text);     // 🔥 keep it
            }

            return text;
        })
        .then(() => {
            alert("Product saved successfully!");
            location.reload();
        })
        .catch(err => {
            alert("ERROR:\n\n" + err.message);
            console.error(err);
        });
}


/* 
 
//////////////////////////// update function /////////////////////////////
/* ---------- MODE TOGGLE ---------- */
/////////////////////////////
// GLOBAL STATE
/////////////////////////////


/////////////////////////////
// OPEN MODAL + LOAD DATA
/////////////////////////////

function productUpdate_openModal(productId) {
    productUpdate_currentId = productId;

    fetch(`/admin/api/products/${productId}`)
        .then(r => {
            if (!r.ok) throw new Error("Failed to load product");
            return r.json();
        })
        .then(p => {

            // ---- VIEW FIELDS ----
            productUpdate_setText("dPartNumberA", p.part_number_a);
            productUpdate_setText("dPartNumberB", p.part_number_b);
            productUpdate_setText("dStatus", p.status);

            productUpdate_setText("dOriginalPrice", `₱${p.original_selling_price}`);
            productUpdate_setText("dDiscountType", p.discount_type);
            productUpdate_setText("dDiscountValue", p.discount_value ?? "-");
            productUpdate_setText("dDiscountedSellingPrice", `₱${p.discounted_selling_price}`);

            productUpdate_setText("dIsDiscounted", p.isdiscounted ? "Yes" : "No");
            productUpdate_setText("dHasInstallationService", p.has_installation_service ? "Yes" : "No");

            productUpdate_setText("dArUrl", p.ar_url ?? "-");
            productUpdate_setText("dWarrantyYears", p.manufacturer_warranty_years ?? "-");
            productUpdate_setText("dReplacementDays", p.outright_replacement_days ?? "-");

            productUpdate_setText("dGrossWeightA", p.gross_weight_a ?? "0");
            productUpdate_setText("dGrossWeightB", p.gross_weight_b ?? "0");
            productUpdate_setText("dTotalGrossWeight", `${p.total_gross_weight} kg`);
            productUpdate_setText("dReorderLevel", p.reorderLevel ?? "3");

            productUpdate_cancelEdit();

            new bootstrap.Modal(
                document.getElementById("updateModal")
            ).show();
        })
        .catch(err => alert(err.message));
}

//////////////////////////////////////
// MODE TOGGLE
//////////////////////////////////////

function productUpdate_enableEdit() {
    document.querySelectorAll(".view-only")
        .forEach(e => e.classList.add("d-none"));

    document.querySelectorAll(".edit-only")
        .forEach(e => e.classList.remove("d-none"));

    productUpdate_syncEditFields();
}

function productUpdate_cancelEdit() {
    document.querySelectorAll(".edit-only")
        .forEach(e => e.classList.add("d-none"));

    document.querySelectorAll(".view-only")
        .forEach(e => e.classList.remove("d-none"));
}

//////////////////////////////////////
// SYNC VIEW → INPUT
//////////////////////////////////////

function productUpdate_syncEditFields() {
    productUpdate_set("ePartNumberA", productUpdate_text("dPartNumberA"));
    productUpdate_set("ePartNumberB", productUpdate_text("dPartNumberB"));
    productUpdate_set("eStatus", productUpdate_text("dStatus"));

    productUpdate_set("eOriginalPrice",
        productUpdate_clean(productUpdate_text("dOriginalPrice")));

    productUpdate_set("eDiscountType", productUpdate_text("dDiscountType"));
    productUpdate_set("eDiscountValue",
        productUpdate_clean(productUpdate_text("dDiscountValue")));

    productUpdate_set("eArUrl", productUpdate_text("dArUrl"));
    productUpdate_set("eWarrantyYears", productUpdate_text("dWarrantyYears"));
    productUpdate_set("eReplacementDays", productUpdate_text("dReplacementDays"));

    productUpdate_set("eGrossWeightA", productUpdate_text("dGrossWeightA"));
    productUpdate_set("eGrossWeightB", productUpdate_text("dGrossWeightB"));
    productUpdate_set("eReorderLevel", productUpdate_text("dReorderLevel"));

    productUpdate_el("eIsDiscounted").checked =
        productUpdate_text("dIsDiscounted").toLowerCase() === "yes";

    productUpdate_el("eHasInstallationService").checked =
        productUpdate_text("dHasInstallationService").toLowerCase() === "yes";
}

//////////////////////////////////////
// SAVE (PUT)
//////////////////////////////////////

function productUpdate_save() {

    const payload = {
        part_Number_A: productUpdate_val("ePartNumberA"),
        part_Number_B: productUpdate_val("ePartNumberB"),
        status: productUpdate_val("eStatus"),
        original_Selling_Price: productUpdate_num("eOriginalPrice"),
        discount_Type: productUpdate_val("eDiscountType"),
        discount_Value: productUpdate_num("eDiscountValue"),
        isDiscounted: productUpdate_chk("eIsDiscounted"),
        has_installation_service: productUpdate_chk("eHasInstallationService"),
        ar_url: productUpdate_val("eArUrl"),
        manufacturer_Warranty_Years: productUpdate_num("eWarrantyYears"),
        outright_Replacement_Days: productUpdate_num("eReplacementDays"),
        gross_Weight_A: productUpdate_num("eGrossWeightA"),
        gross_Weight_B: productUpdate_num("eGrossWeightB"),
        reorderLevel: productUpdate_num("eReorderLevel")
    };

    fetch(`/admin/api/products/${productUpdate_currentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
        .then(r => {
            if (!r.ok) throw new Error("Update failed");
        })
        .then(() => location.reload())
        .catch(err => alert(err.message));
}

//////////////////////////////////////
// HELPERS (NAMESPACED)
//////////////////////////////////////

function productUpdate_el(id) {
    return document.getElementById(id);
}

function productUpdate_text(id) {
    return productUpdate_el(id)?.textContent?.trim() ?? "";
}

function productUpdate_val(id) {
    return productUpdate_el(id)?.value ?? "";
}

function productUpdate_num(id) {
    const v = parseFloat(productUpdate_val(id));
    return isNaN(v) ? null : v;
}

function productUpdate_chk(id) {
    return productUpdate_el(id)?.checked ?? false;
}

function productUpdate_set(id, value) {
    const el = productUpdate_el(id);
    if (el) el.value = value ?? "";
}

function productUpdate_setText(id, value) {
    const el = productUpdate_el(id);
    if (el) el.textContent = value ?? "-";
}

function productUpdate_clean(value) {
    return value && value !== "-" ? value.replace(/[₱,]/g, "") : "";
}

// To get spec for updateAPI
document
    .querySelector('[data-bs-target="#tab-specs"]')
    .addEventListener("shown.bs.tab", () => {
        productUpdate_loadSpecs();
    });


// Register ONCE, after DOM is ready
document.addEventListener("DOMContentLoaded", () => {

    const specsTabBtn =
        document.querySelector('[data-bs-target="#tab-specs"]');

    if (!specsTabBtn) {
        console.warn("Specs tab button not found");
        return;
    }

    specsTabBtn.addEventListener("shown.bs.tab", () => {

        if (!productUpdate_currentId) {
            console.warn("No product ID yet, skipping specs load");
            return;
        }

        productUpdate_loadSpecs();
    });

});


function productUpdate_saveSpecs() {
    const payload = [...document.querySelectorAll("#specTableBody input")]
        .map(i => ({
            specId: parseInt(i.dataset.specId),
            value: i.value
        }));

    fetch(`/admin/api/products/${productUpdate_currentId}/specs`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
        .then(r => {
            if (!r.ok) throw new Error("Failed to save specs");
            alert("Specifications updated");
        })
        .catch(err => alert(err.message));
}


function applyProductSearch() {
    currentSearch = document
        .getElementById("productsSearchInput")
        .value
        .trim();

    loadProducts(1);
}



document.addEventListener("DOMContentLoaded", () => {

    const searchInput = document.getElementById("productsSearchInput");
    if (!searchInput) return;

    searchInput.addEventListener("input", () => {

        clearTimeout(searchTimeout);

        searchTimeout = setTimeout(() => {
            currentSearch = searchInput.value.trim();
            loadProducts(1);
        }, 400);
    });
});


document.addEventListener("DOMContentLoaded", () => {
    const specsTabBtn =
        document.querySelector('[data-bs-target="#tab-specs"]');

    if (specsTabBtn) {
        specsTabBtn.addEventListener("shown.bs.tab", () => {
            productUpdate_loadSpecs();
        });
    }
});

////// Dom Content loader
document.addEventListener("DOMContentLoaded", () => {
    loadProducts();
});