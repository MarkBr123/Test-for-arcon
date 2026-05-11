let searchTimeout = null;
let currentSearch = "";


/* ---------- STATE ---------- */
let currentPage = 1;
const pageSize = 24;
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
    //totalGrossWeight: 0,

    technologies: [],
    specifications: [],
    tags: []
};


// for media modal
let primaryFile = null;
let galleryFiles = [];

/* ---------------- LOAD ---------------- */
function loadProducts(page = 1) {
    currentPage = page;

    fetch(`/admin/api/products?page=${currentPage}&pageSize=${pageSize}&sortBy=${sortBy}&sortDir=${sortDir}&search=${encodeURIComponent(currentSearch ?? "")}`)
        .then(async r => {

            console.log("Status:", r.status);

            if (!r.ok) {
                const text = await r.text();
                console.error("Server returned error:", text);
                throw new Error(text);
            }

            return r.json();
        })
        .then(data => {
            console.log("Data received:", data);
            totalCount = data.totalCount;
            renderTable(data.items);
            renderPagination();
        })
        .catch(err => console.error("Fetch failed:", err));
}





/* ---------------- RENDER TABLE ---------------- */
function renderTable(items) {
    const tbody = document.querySelector("#productsTable tbody");
    tbody.innerHTML = "";

    const tr = document.createElement("tr");
    //this will make click row > details per row
    tr.style.cursor = "pointer";
    tr.onclick = () => viewDetails(null, p.id);


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

    <!-- ACTION MENU -->
    <td class="small text-center" onclick="event.stopPropagation()">
        <div class="dropdown">
            <button class="btn btn-sm btn-outline-secondary"
                    data-bs-toggle="dropdown"
                    aria-expanded="false">
                ⋮
            </button>

            <ul class="dropdown-menu dropdown-menu-end">
                <li>
                    <button class="dropdown-item"
                            onclick="viewDetails(event, ${p.id})">
                        View Details
                    </button>
                </li>

                <li>
                    <button class="dropdown-item"
                            onclick="openEditProductModal(${p.id})">
                        Edit
                    </button>
                </li>
                
                <li>
                    <button class="dropdown-item"
                            onclick="openUploadMedia(${p.id})">
                        Media
                    </button>
                </li>

                <li>
                    ${p.ar_url
                ? `<a class="dropdown-item"
                                   href="${normalizeUrl(p.ar_url)}"
                                   target="_blank"
                                   rel="noopener noreferrer">
                                   Open AR
                               </a>`
                : `<button class="dropdown-item text-muted" disabled>
                                   AR not available
                               </button>`
            }
                </li>

                <li><hr class="dropdown-divider"></li>

                <li>
                    ${p.status === "Archived"
                ? `<button class="dropdown-item text-muted" disabled>
                                   Already Archived
                               </button>`
                : `<button class="dropdown-item text-danger"
                                   onclick="archiveProduct(event, ${p.id})">
                                   Archive
                               </button>`
            }
                </li>
            </ul>
        </div>
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
        d.actual_Selling_Price != null ? `₱ ${d.actual_Selling_Price}` : "-";

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
        `${d.gross_Weight_A ?? 0} kg`;

    document.getElementById("dGrossWeightB").textContent =
        `${d.gross_Weight_B ?? 0} kg`;


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

            if (!r.ok)
                throw new Error(
                    "Failed to load product summary"
                );

            return r.json();
        })

        .then(data => {


            // PRODUCT SUMMARY


            fillSummaryModal(data);


            // LOAD REVIEWS


            return fetch(
                `/admin/api/products/customer-transaction-ratings/product/${id}`
            );
        })

        .then(r => {

            if (!r.ok)
                throw new Error(
                    "Failed to load reviews"
                );

            return r.json();
        })

        .then(reviewData => {


            // RENDER REVIEWS


            renderReviews(reviewData);

            // OPEN MODAL


            const modalEl =
                document.getElementById(
                    "productSummaryModal"
                );

            const modal =
                new bootstrap.Modal(modalEl);

            modal.show();
        })

        .catch(err => {

            console.error(err);

            alert(
                "Unable to load product summary"
            );
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
            //location.reload(); // or refresh table
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

        productDraft.discountValue = 0;   // safer than null
    }
    else {

        discountValue.classList.remove("d-none");
    }
}


function goTech() {
    productDraft.manufacturerId = parseInt(manufacturerId.value);
    productDraft.formFactorID = formFactorId.value ? parseInt(formFactorId.value) : null;

    productDraft.productModel = productModel.value;
    //productDraft.sku = sku.value;
    productDraft.partNumberA = partNumberA.value;
    productDraft.partNumberB = partNumberB.value;
    productDraft.originalSellingPrice = parseFloat(price.value);
    productDraft.productSeries = productSeries.value;

    productDraft.manufacturerWarrantyYears =
        parseInt(manufacturerWarrantyYears.value) || 0;

    productDraft.outrightReplacementDays =
        parseInt(outrightReplacementDays.value) || 0;

    productDraft.grossWeightA =
        parseFloat(grossWeightA.value) ?? 0;

    const weightB = parseFloat(grossWeightB.value);
    productDraft.grossWeightB = isNaN(weightB) ? 0 : weightB;

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
    const list = document.getElementById("tagList");
    const empty = document.getElementById("tagEmpty");

    const tag = input.value.trim();
    if (!tag) return;

    // Prevent duplicates
    if (productDraft.tags.includes(tag))
        return;

    // Push into draft
    productDraft.tags.push(tag);

    if (empty) empty.remove();

    const li = document.createElement("li");
    li.className = "list-group-item d-flex align-items-center justify-content-between";

    li.innerHTML = `
        <span class="tag-pill">${tag}</span>
        <button type="button" class="btn btn-sm btn-outline-danger">×</button>
    `;

    li.querySelector("button")
        .addEventListener("click", function () {

            // Remove from draft
            productDraft.tags =
                productDraft.tags.filter(t => t !== tag);

            li.remove();

            if (productDraft.tags.length === 0) {
                list.innerHTML = `
                    <li id="tagEmpty"
                        class="list-group-item text-muted">
                        No tags added yet
                    </li>
                `;
            }
        });

    list.appendChild(li);

    input.value = "";
}

//this will remove the added tag on create products
function removeTag(button) {

    const li = button.closest("li");
    const tag = li.querySelector(".tag-pill").innerText;

    productDraft.tags =
        productDraft.tags.filter(t => t !== tag);

    li.remove();

    if (productDraft.tags.length === 0) {
        document.getElementById("tagList").innerHTML = `
            <li id="tagEmpty"
                class="list-group-item text-muted">
                No tags added yet
            </li>
        `;
    }
}



function back(prev, current) {
    bootstrap.Modal.getInstance(current).hide();
    new bootstrap.Modal(prev).show();
}
function saveProduct() {

    // 🔥 Validate Discount
    if (productDraft.discountType !== "NONE") {

        const value = parseFloat(discountValue.value);

        if (isNaN(value) || value <= 0) {
            alert("Discount value must be greater than 0.");
            return;
        }

        if (productDraft.discountType === "PERCENTAGE" && value > 100) {
            alert("Percentage cannot exceed 100%");
            return;
        }

        if (productDraft.discountType === "AMOUNT") {

            const originalPrice = parseFloat(productDraft.originalSellingPrice);

            if (value >= originalPrice) {
                alert("Discount amount cannot exceed or match original selling price.");
                return;
            }
        }

        productDraft.discountValue = value;
    }


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
            resetProductModal();
        })
        .catch(err => {
            alert("ERROR:\n\n" + err.message);
            console.error(err);
            resetProductModal();
        });

    productDraft.tags = [];
    document.getElementById("tagList").innerHTML = `
    <li id="tagEmpty"
        class="list-group-item text-muted">
        No tags added yet
    </li>
`;
}

// This resets modal
function resetProductModal() {

    // Reset JS object
    productDraft = {
        manufacturerId: 0,
        formFactorID: 0,
        productModel: "",
        productSeries: "",
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
        technologies: [],
        specifications: [],
        tags: []
    };

    // Reset form inputs
    document.getElementById("step1Modal").reset();
    document.getElementById("techModal").reset();
    document.getElementById("specModal").reset();
    document.getElementById("tagModal").reset();

    // Reset dynamic sections
    document.getElementById("tagList").innerHTML = `
        <li id="tagEmpty"
            class="list-group-item text-muted">
            No tags added yet
        </li>
    `;
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


////// Dom Content loader
document.addEventListener("DOMContentLoaded", () => {
    loadProducts();
});




// Upload Media

let existingMedia = [];
let removedMediaIds = [];
let hasExistingMedia = false;

document.getElementById("primaryInput")
    .addEventListener("change", function (e) {

        const file = e.target.files[0];
        if (!file) return;

        primaryFile = file;

        const reader = new FileReader();
        reader.onload = function (event) {

            const img = document.getElementById("primaryPreview");
            img.src = event.target.result;
            img.classList.remove("d-none");

            document.getElementById("primaryPlaceholder")
                .classList.add("d-none");
        };

        reader.readAsDataURL(file);
    });


document.getElementById("multipleInput")
    .addEventListener("change", function (e) {

        const files = Array.from(e.target.files);

        files.forEach(file => {
            galleryFiles.push(file);
        });

        renderGallery();

        // reset input so same file can be re-selected
        e.target.value = "";
    });


function renderGallery() {

    const grid = document.getElementById("galleryGrid");

    if (!grid) return;

    grid.innerHTML = "";


    // UPLOAD BOX


    const uploadCol = document.createElement("div");

    uploadCol.className = "col-3";

    uploadCol.id = "galleryUploadBox";

    uploadCol.innerHTML = `
        <div class="border rounded d-flex justify-content-center align-items-center"
             style="height:150px; cursor:pointer;"
             onclick="document.getElementById('multipleInput').click()">

            + Add

        </div>
    `;

    grid.appendChild(uploadCol);

 
    // EXISTING MEDIA


    existingMedia.forEach((media, index) => {

        const col = document.createElement("div");

        col.className = "col-3";

        col.innerHTML = `
            <div class="position-relative">

                <img src="${media.url}"
                     class="img-fluid rounded"
                     style="height:150px;
                            object-fit:cover;
                            width:100%;">

                <button type="button"
                        class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1">

                    ×

                </button>

            </div>
        `;

        col.querySelector("button")
            .addEventListener("click", function () {

                removedMediaIds.push(media.mediaId);

                existingMedia.splice(index, 1);

                renderGallery();
            });

        grid.appendChild(col);
    });


    // NEW FILES
 

    galleryFiles.forEach((file, index) => {

        const reader = new FileReader();

        reader.onload = function (event) {

            const col = document.createElement("div");

            col.className = "col-3";

            col.innerHTML = `
                <div class="position-relative">

                    <img src="${event.target.result}"
                         class="img-fluid rounded"
                         style="height:150px;
                                object-fit:cover;
                                width:100%;">

                    <button type="button"
                            class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1">

                        ×

                    </button>

                </div>
            `;

            col.querySelector("button")
                .addEventListener("click", function () {

                    galleryFiles.splice(index, 1);

                    renderGallery();
                });

            grid.appendChild(col);
        };

        reader.readAsDataURL(file);
    });
}


function removeImage(index) {
    galleryFiles.splice(index, 1);
    renderGallery();
};

async function saveImages() {

    const formData = new FormData();

    const productId =
        document.getElementById("currentProductId").value;


    // NEW FILES


    if (primaryFile)
        formData.append("NewFiles", primaryFile);

    galleryFiles.forEach(file => {

        formData.append("NewFiles", file);
    });


    // EXISTING MEDIA IDS


    existingMedia.forEach(media => {

        formData.append(
            "ExistingMediaIds",
            media.mediaId
        );
    });

    // PRIMARY IMAGE


    if (primaryFile) {

        formData.append("files", primaryFile);

        formData.append("PrimaryIndex", 0);
    }

    galleryFiles.forEach(file => {

        formData.append("files", file);
    });

    try {

        // =====================================
        // POST OR PUT
        // =====================================

        const endpoint = hasExistingMedia
            ? `/admin/api/products/${productId}/images`
            : `/admin/api/products/${productId}/images`;

        const method = hasExistingMedia
            ? "PUT"
            : "POST";

        const response = await fetch(endpoint, {
            method,
            body: formData
        });

        if (!response.ok) {

            const text = await response.text();

            throw new Error(text);
        }

        alert("Images saved successfully.");

        location.reload();

    }
    catch (err) {

        console.error(err);

        alert("Failed to save images.");
    }
}


async function openUploadMedia(productId) {

    primaryFile = null;
    galleryFiles = [];

    existingMedia = [];
    removedMediaIds = [];

    const primaryPreview =
        document.getElementById("primaryPreview");

    const primaryPlaceholder =
        document.getElementById("primaryPlaceholder");

    const primaryInput =
        document.getElementById("primaryInput");

    primaryPreview.src = "";
    primaryPreview.classList.add("d-none");

    primaryPlaceholder.classList.remove("d-none");

    primaryInput.value = "";

    document.getElementById("multipleInput").value = "";

    document.getElementById("currentProductId").value =
        productId;

    try {


        // GET EXISTING IMAGES

        const response = await fetch(
            `/admin/api/products/${productId}/images`
        );

        if (response.ok) {

            existingMedia = await response.json();

            hasExistingMedia =
                existingMedia.length > 0;

            // SET PRIMARY PREVIEW


            const primary =
                existingMedia.find(x => x.isPrimary);

            if (primary) {

                primaryPreview.src = primary.url;

                primaryPreview.classList.remove("d-none");

                primaryPlaceholder.classList.add("d-none");
            }
        }

        renderGallery();

        const modal = new bootstrap.Modal(
            document.getElementById("mediaModal")
        );

        modal.show();

    } catch (err) {

        console.error(err);
        alert("Failed to load media.");
    }
}

window.openUploadMedia = openUploadMedia;




//helpers for upload image
/* ---------------- PRIMARY PREVIEW ---------------- */
document.getElementById("primaryInput")
    .addEventListener("change", function (e) {

        const file = e.target.files[0];
        if (!file) return;

        primaryFile = file;

        const reader = new FileReader();

        reader.onload = function (event) {

            const img = document.getElementById("primaryPreview");
            img.src = event.target.result;
            img.classList.remove("d-none");

            document.getElementById("primaryPlaceholder")
                .classList.add("d-none");
        };

        reader.readAsDataURL(file);
    });




/* ---------------- REMOVE IMAGE ---------------- */
function removeGalleryImage(index) {
    galleryFiles.splice(index, 1);
    renderGallery();
}


//clean the image
document.getElementById("mediaModal")
    .addEventListener("hidden.bs.modal", function () {

        // Reset stored files
        primaryFile = null;
        galleryFiles = [];

        // Reset primary preview
        const primaryPreview = document.getElementById("primaryPreview");
        const primaryPlaceholder = document.getElementById("primaryPlaceholder");

        primaryPreview.src = "";
        primaryPreview.classList.add("d-none");
        primaryPlaceholder.classList.remove("d-none");

        // Reset file inputs
        document.getElementById("primaryInput").value = "";
        document.getElementById("multipleInput").value = "";

        // Reset gallery grid
        renderGallery();
    });

document.addEventListener("DOMContentLoaded", function () {
    renderGallery();
});


/////////////////////////////////////////////////////////////////////Edit Product Details /////////////////////////////////////////////////////////////////////////////////////


async function openEditProductModal(productId) {

    try {

        const response = await fetch(
            `/admin/api/products/summary/${productId}`
        );

        if (!response.ok) {
            throw new Error("Failed to load product.");
        }

        const product = await response.json();

        populateEditModal(product);

        const modal = new bootstrap.Modal(
            document.getElementById("editProductModal")
        );

        modal.show();

        // store current editing id
        document.getElementById("saveProductChangesBtn")
            .dataset.productId = productId;

    }
    catch (err) {
        console.error(err);
        alert("Failed to load product.");
    }
}

function populateEditModal(product) {


    // READONLY


    document.getElementById("editSku").value =
        product.sku ?? "";

    document.getElementById("editManufacturer").value =
        product.manufacturer ?? "";

    document.getElementById("editFormFactor").value =
        product.form_factor ?? "";

    document.getElementById("editProductModel").value =
        product.product_Model ?? "";

    document.getElementById("editProductSeries").value =
        product.product_Series ?? "";

    document.getElementById("editPartNumberA").value =
        product.part_Number_A ?? "";

    document.getElementById("editPartNumberB").value =
        product.part_Number_B ?? "";

    document.getElementById("editReorderLevel").value =
        product.reorder_level ?? 0;

    document.getElementById("editStatus").value =
        product.status ?? "";

    document.getElementById("editActualSellingPrice").value =
        product.actual_Selling_Price ?? 0;

    document.getElementById("editDiscountedSellingPrice").value =
        product.discounted_Selling_Price ?? 0;

    document.getElementById("editTotalGrossWeight").value =
        product.total_Gross_Weight ?? 0;

    // EDITABLE


    document.getElementById("editOriginalSellingPrice").value =
        product.original_Selling_Price ?? 0;

    document.getElementById("editDiscountType").value =
        product.discount_Type ?? "NONE";

    document.getElementById("editDiscountValue").value =
        product.discount_Value ?? 0;

    document.getElementById("editArUrl").value =
        product.ar_url ?? "";

    document.getElementById("editWarrantyYears").value =
        product.manufacturer_Warranty_Years ?? 0;

    document.getElementById("editReplacementDays").value =
        product.outright_Replacement_Days ?? 0;

    document.getElementById("editGrossWeightA").value =
        product.gross_Weight_A ?? 0;

    document.getElementById("editGrossWeightB").value =
        product.gross_Weight_B ?? 0;


    // RELATIONS


    renderSpecifications(product.specifications);
    renderTechnologies(product.technologies);
    renderTags(product.tags);
}

function renderSpecifications(specifications) {

    const container = document.getElementById(
        "specificationsContainer"
    );

    container.innerHTML = "";

    specifications.forEach(spec => {

        container.innerHTML += `
            <div class="border rounded p-3 mb-2 spec-row">

                <div class="row g-2">

                    <div class="col-md-5">
                        <input type="text"
                               class="form-control spec-key"
                               value="${spec.key}"
                               readonly>
                    </div>

                    <div class="col-md-5">
                        <input type="text"
                               class="form-control spec-value"
                               value="${spec.value}">
                    </div>
                </div>

            </div>
        `;
    });
}

function renderTechnologies(technologies) {

    const container = document.getElementById(
        "technologiesContainer"
    );

    container.innerHTML = "";

    technologies.forEach(tech => {

        container.innerHTML += `
            <div class="border rounded p-3 mb-2 tech-row">

                <div class="mb-2">
                    <input type="text"
                           class="form-control tech-name"
                           value="${tech.name}">
                </div>

                <div class="mb-2">
                    <textarea class="form-control tech-description"
                              rows="2">${tech.description ?? ""}</textarea>
                </div>

                <button class="btn btn-danger btn-sm remove-tech-btn">
                    Remove
                </button>

            </div>
        `;
    });
}

function renderTags(tags) {

    const input = document.getElementById(
        "editTagsInput"
    );

    input.value = tags.join(", ");
}

document.getElementById("saveProductChangesBtn")
    .addEventListener("click", async () => {

        try {

            const productId =
                document.getElementById("saveProductChangesBtn")
                    .dataset.productId;

            // =====================================
            // SPECIFICATIONS
            // =====================================

            const specifications = [];

            document.querySelectorAll(".spec-row")
                .forEach(row => {

                    const key =
                        row.querySelector(".spec-key").value;

                    const value =
                        row.querySelector(".spec-value").value;

                    specifications.push({
                        key,
                        value
                    });
                });

            // TECHNOLOGIES


            const technologies = [];

            document.querySelectorAll(".tech-row")
                .forEach(row => {

                    technologies.push({
                        technologyName:
                            row.querySelector(".tech-name").value,

                        technologyDesc:
                            row.querySelector(".tech-description").value
                    });
                });


            // TAGS


            const tags = document.getElementById(
                "editTagsInput"
            )
                .value
                .split(",")
                .map(x => x.trim())
                .filter(x => x.length > 0);

            // DTO


            const dto = {

                productModel:
                    document.getElementById("editProductModel").value,

                productSeries:
                    document.getElementById("editProductSeries").value,

                partNumberA:
                    document.getElementById("editPartNumberA").value,

                partNumberB:
                    document.getElementById("editPartNumberB").value,

                originalSellingPrice:
                    parseFloat(document.getElementById(
                        "editOriginalSellingPrice").value),

                discountValue:
                    parseFloat(document.getElementById(
                        "editDiscountValue").value),

                discountType:
                    document.getElementById(
                        "editDiscountType").value,

                arUrl:
                    document.getElementById(
                        "editArUrl").value,

                manufacturerWarrantyYears:
                    parseInt(document.getElementById(
                        "editWarrantyYears").value),

                outrightReplacementDays:
                    parseInt(document.getElementById(
                        "editReplacementDays").value),

                grossWeightA:
                    parseFloat(document.getElementById(
                        "editGrossWeightA").value),

                grossWeightB:
                    parseFloat(document.getElementById(
                        "editGrossWeightB").value),

                specifications,
                technologies,
                tags
            };


            // API CALL


            const response = await fetch(
                `/admin/api/products/${productId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(dto)
                });

            if (!response.ok) {

                const error = await response.text();
                throw new Error(error);
            }

            alert("Product updated successfully.");

            location.reload();

        }
        catch (err) {

            console.error(err);
            alert(err.message);
        }
    });


// ADD TECHNOLOGY


document.getElementById("addTechnologyBtn")
    .addEventListener("click", () => {

        const container = document.getElementById(
            "technologiesContainer"
        );

        container.insertAdjacentHTML(
            "beforeend",
            `
            <div class="border rounded p-3 mb-2 tech-row">

                <!-- NAME -->
                <div class="mb-2">

                    <label class="form-label">
                        Technology Name
                    </label>

                    <input type="text"
                           class="form-control tech-name"
                           placeholder="Example: EcoTech, Anti-Dust...">

                </div>

                <!-- DESCRIPTION -->
                <div class="mb-2">

                    <label class="form-label">
                        Description
                    </label>

                    <textarea class="form-control tech-description"
                              rows="2"
                              placeholder="Technology description..."></textarea>

                </div>

                <!-- REMOVE -->
                <div class="text-end">

                    <button type="button"
                            class="btn btn-danger btn-sm remove-tech-btn">

                        Remove

                    </button>

                </div>

            </div>
            `
        );
    });


// REMOVE TECHNOLOGY

document.addEventListener("click", (e) => {

    if (e.target.classList.contains("remove-tech-btn")) {

        e.target
            .closest(".tech-row")
            .remove();
    }
});

// Ratings

function renderReviews(data) {

    const container =
        document.getElementById("dReviews");

    // =========================================
    // EMPTY
    // =========================================

    if (!data ||
        !data.ratings ||
        data.ratings.length === 0) {

        container.innerHTML = `
            <div class="text-muted">
                No reviews yet.
            </div>
        `;

        return;
    }

    // =========================================
    // HEADER SUMMARY
    // =========================================

    let html = `
        <div class="review-summary-box mb-4">

            <div class="d-flex align-items-center gap-3">

                <div class="review-average-rating">
                    ${data.averageRating}
                </div>

                <div>

                    <div class="fw-bold">
                        ${generateStars(data.averageRating)}
                    </div>

                    <div class="text-muted small">
                        ${data.totalReviews} review(s)
                    </div>

                </div>

            </div>

        </div>
    `;

    // =========================================
    // REVIEWS
    // =========================================

    data.ratings.forEach(review => {

        html += `
            <div class="review-card">

                <div class="d-flex justify-content-between align-items-start mb-2">

                    <div>

                        <div class="fw-semibold">
                            ${review.customerName}
                        </div>

                        <div class="small text-muted">
                            ${formatReviewDate(review.createdAt)}
                        </div>

                    </div>

                    <div class="review-stars">
                        ${generateStars(review.rating)}
                    </div>

                </div>

                ${review.comment
                ? `
                        <div class="review-comment">
                            ${review.comment}
                        </div>
                    `
                : ""
            }

            </div>
        `;
    });

    container.innerHTML = html;
}

function generateStars(rating) {

    const rounded = Math.round(rating);

    let stars = "";

    for (let i = 1; i <= 5; i++) {

        stars += i <= rounded
            ? "⭐"
            : "☆";
    }

    return stars;
}

function formatReviewDate(dateString) {

    return new Date(dateString)
        .toLocaleDateString("en-PH", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });
}

async function loadProductReviews(productId) {

    try {

        const reviewsResponse = await fetch(
            `/admin/api/products/customer-transaction-ratings/product/${productId}`
        );

        if (!reviewsResponse.ok)
            throw new Error("Failed to load reviews.");

        const reviewsData =
            await reviewsResponse.json();

        renderReviews(reviewsData);

    }
    catch (err) {

        console.error(err);

        document.getElementById("dReviews").innerHTML = `
            <div class="text-danger">
                Failed to load reviews.
            </div>
        `;
    }
}