document.addEventListener("DOMContentLoaded", () => {
    loadProduct();
    loadInstallationOptions();
});

let currentProduct = null;

/* ===============================
   LOAD PRODUCT SUMMARY
================================= */
async function loadProduct() {
    try {
        const res = await fetch(`/admin/api/products/details/${productId}`);
        if (!res.ok) throw new Error("Product not found");

        const p = await res.json();
        currentProduct = p;

        renderBasicInfo(p);
        renderImages(p.images);
        renderSpecifications(p.specifications);
        renderTags(p.tags);
        renderTechnologies(p.technologies);
        syncModal(p);

    } catch (err) {
        console.error(err);
    }
}

/* ===============================
   BASIC INFO
================================= */
function renderBasicInfo(p) {

    document.getElementById("productName").innerText =
        `${p.brandName} ${p.productSeries ?? ""} ${p.productModel}`;

    document.getElementById("modelName").innerText =
        `${p.productModel}`;

    document.getElementById("productSubtext").innerText =
        `${p.formFactor ?? ""}`;

    document.getElementById("productPrice").innerText =
        `₱${formatPrice(p.actualSellingPrice)}`;

    // Discount badge
    const badge = document.getElementById("discountBadge");
    badge.innerText = "";

    if (p.discountType === "PERCENTAGE" && p.discountValue) {
        badge.innerText = `${p.discountValue}% Less`;
    }
    else if (p.discountType === "AMOUNT" && p.discountValue) {
        badge.innerText = `₱${formatPrice(p.discountValue)} Less`;
    }

    // Stock
    const stock = document.getElementById("stockStatus");
    if (p.inStock) {
        stock.innerHTML = `<span style="color:green;">In Stock (${p.availableStock})</span>`;
    } else {
        stock.innerHTML = `<span style="color:red;">Out of Stock</span>`;
    }
}

/* ===============================
   IMAGES + THUMBNAILS
================================= */
function renderImages(images) {
    const mainImage = document.getElementById("mainImage");
    const container = document.getElementById("thumbnailContainer");

    container.innerHTML = `
        <div class="buttons">
            <button class="ar" id="viewAR">View in AR</button>
        </div>
    `;

    if (!images || images.length === 0) return;

    mainImage.src = images[0];

    images.forEach(img => {
        const thumb = document.createElement("img");
        thumb.src = img;
        thumb.classList.add("thumbnail-img");

        thumb.addEventListener("click", () => {
            mainImage.src = img;
        });

        container.prepend(thumb);
    });
}

/* ===============================
   SPECIFICATIONS
================================= */
function renderSpecifications(specs) {
    const container = document.getElementById("specificationsContainer");
    container.innerHTML = "";

    if (!specs) return;

    specs.forEach(s => {
        container.innerHTML += `
            <div>
                <strong>${s.key}:</strong> ${s.value}
            </div>
        `;
    });
}

/* ===============================
   TAGS
================================= */
function renderTags(tags) {
    const container = document.getElementById("tagsContainer");
    container.innerHTML = "";

    if (!tags) return;

    tags.forEach(t => {
        container.innerHTML += `
            <span class="tag-badge">${t}</span>
        `;
    });
}

/* ===============================
   TECHNOLOGIES
================================= */
function renderTechnologies(techs) {
    const container = document.getElementById("technologiesContainer");
    container.innerHTML = "";

    if (!techs) return;

    techs.forEach(t => {
        container.innerHTML += `
            <div class="tech-item">
                <strong>${t.name}</strong>
                <p>${t.description ?? ""}</p>
            </div>
        `;
    });
}

/* ===============================
   INSTALLATION OPTIONS
================================= */
async function loadInstallationOptions() {
    try {
        // Standard
        const stdRes = await fetch("/api/shop/product/service_options/standard");
        const std = await stdRes.json();

        const stdSelect = document.getElementById("installationSelect");
        const modalStd = document.getElementById("modalInstallationSelect");

        stdSelect.innerHTML = "";
        modalStd.innerHTML = "";

        std.forEach(o => {
            const text = `${o.description} ${o.price > 0 ? `(₱${formatPrice(o.price)})` : "(FREE)"}`;

            stdSelect.innerHTML += `<option value="${o.id}">${text}</option>`;
            modalStd.innerHTML += `<option value="${o.id}">${text}</option>`;
        });

        // Additional
        const addRes = await fetch("/api/shop/product/service_options/additional");
        const add = await addRes.json();

        const addSelect = document.getElementById("additionalSelect");
        const modalAdd = document.getElementById("modalAdditionalSelect");

        addSelect.innerHTML = "";
        modalAdd.innerHTML = "";

        add.forEach(o => {
            const text = `${o.description} ${o.price > 0 ? `(₱${formatPrice(o.price)})` : ""}`;

            addSelect.innerHTML += `<option value="${o.id}">${text}</option>`;
            modalAdd.innerHTML += `<option value="${o.id}">${text}</option>`;
        });

    } catch (err) {
        console.error("Installation load failed", err);
    }
}

/* ===============================
   SYNC MODAL
================================= */
function syncModal(p) {
    document.getElementById("modalProductName").innerText =
        `${p.brandName} ${p.productModel}`;

    document.getElementById("modalProductPrice")
}

function formatPrice(value) {
    if (value === null || value === undefined)
        return "0.00";

    return Number(value).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}
