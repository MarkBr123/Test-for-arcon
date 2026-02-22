document.addEventListener("DOMContentLoaded", () => {
    loadProduct();
    loadInstallationOptions();
    initializeCartButtons();

});

let currentProduct = null;
let maxStock = 0;



/* ===============================
   LOAD PRODUCT SUMMARY
================================= */
async function loadProduct() {
    try {
        const res = await fetch(`/admin/api/products/details/${productId}`);
        if (!res.ok) throw new Error("Product not found");

        const p = await res.json();
        currentProduct = p;
        console.log("Current product:", currentProduct);
        renderBasicInfo(p);
        renderImages(p.images, p.arUrl);
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

    document.getElementById("productSku").innerText =
        `SKU Code: ${p.sku}`;

    document.getElementById("productName").innerText =
        `${p.brandName} ${p.productSeries ?? ""} ${p.productModel}`;

    document.getElementById("modelName").innerText =
        `${p.productModel}`;

    document.getElementById("productSubtext").innerText =
        `${p.formFactor ?? ""}`;

    const originalPriceEl = document.getElementById("originalPrice");
    const priceEl = document.getElementById("productPrice");

    const type = p.discountType?.trim().toUpperCase();
    const original = Number(p.originalSellingPrice);
    const actual = Number(p.actualSellingPrice);
    const discountValue = Number(p.discountValue);

    originalPriceEl.innerHTML = "";
    priceEl.innerHTML = `₱${formatPrice(actual)}`;

    if (type && discountValue > 0) {

        let discountText = "";

        if (type === "PERCENTAGE") {
            discountText = `${discountValue}% Less`;
        }
        else if (type === "AMOUNT") {
            discountText = `₱${formatPrice(discountValue)} Less`;
        }

        originalPriceEl.innerHTML =
            `<span class="strike-price">₱${formatPrice(original)}</span>
             <span class="discount-text"> (${discountText})</span>`;
    }

    // Stock
    // Stock
    const stockEl = document.getElementById("stockStatus");

    if (p.inStock) {
        stockEl.innerHTML =
            `<span style="color:green;">In Stock (${p.availableStock})</span>`;

        maxStock = p.availableStock; // ✅ define stock properly
    } else {
        stockEl.innerHTML =
            `<span style="color:red;">Out of Stock</span>`;

        maxStock = 0;
    }
}



/* ===============================
   IMAGES + THUMBNAILS
================================= */
function renderImages(images, arUrl) {
    const mainImage = document.getElementById("mainImage");
    const container = document.getElementById("thumbnailContainer");

    container.innerHTML = "";

    // Create AR button block
    const buttonWrapper = document.createElement("div");
    buttonWrapper.classList.add("buttons");

    const arButton = document.createElement("button");
    arButton.classList.add("ar");
    arButton.innerText = "View in AR";

    // If AR URL exists → enable redirect
    if (arUrl && arUrl.trim() !== "") {
        arButton.addEventListener("click", () => {
            window.open(arUrl, "_blank");
        });
    } else {
        arButton.disabled = true;
        arButton.style.opacity = "0.5";
        arButton.style.cursor = "not-allowed";
    }


    buttonWrapper.appendChild(arButton);

    // If no images → still show button
    if (!images || images.length === 0) {
        container.appendChild(buttonWrapper);
        return;
    }

    // Set main image
    mainImage.src = images[0];

    // Create thumbnails
    images.forEach(img => {
        const thumb = document.createElement("img");
        thumb.src = img;
        thumb.classList.add("thumbnail-img");

        thumb.addEventListener("click", () => {
            mainImage.src = img;
        });

        container.appendChild(thumb);
    });

    // Add AR button at bottom
    container.appendChild(buttonWrapper);
}


/* ===============================
   SPECIFICATIONS
================================= */
function renderSpecifications(specs) {
    const container = document.getElementById("specificationsContainer");
    container.innerHTML = "";

    if (!specs || specs.length === 0) return;

    specs.forEach(s => {
        container.innerHTML += `
            <div class="spec-item">
                <strong>${s.key}</strong>
                <p>${s.value}</p>
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

    if (!tags || tags.length === 0) return;

    tags.forEach(tag => {
        const badge = document.createElement("span");
        badge.classList.add("tag-badge");
        badge.innerText = tag;

        container.appendChild(badge);
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

//Initialize Cart Logic
function initializeCartButtons() {

    const quantityInput = document.getElementById("quantity");
    const addBtn = document.getElementById("addToCart");
    const buyBtn = document.getElementById("buyNow");

    quantityInput.addEventListener("input", handleQuantityInput);
    addBtn.addEventListener("click", handleAddToCart);
    buyBtn.addEventListener("click", handleBuyNow);
}
//Stock Validation
function validateStock(qty) {

    if (isNaN(qty) || qty < 1) {
        alert("Invalid quantity.");
        return false;
    }

    if (qty > maxStock) {
        alert(`Quantity exceeds available stock (${maxStock})`);
        return false;
    }

    if (maxStock <= 0) {
        alert("Product is out of stock.");
        return false;
    }

    return true;
}
//Handle Quantity Input
function handleQuantityInput(e) {
    let qty = parseInt(e.target.value);

    if (qty > maxStock) e.target.value = maxStock;
    if (qty < 1 || isNaN(qty)) e.target.value = 1;
}

//Add to Cart Handler
async function handleAddToCart() {

    const quantityInput = document.getElementById("quantity");
    const qty = parseInt(quantityInput.value);

    if (!validateStock(qty)) return;
    if (!currentProduct) return;

    const payload = {
        productId: currentProduct.productId,
        quantity: qty,
        stdInstallationServiceOptionId: getSelectValue("installationSelect"),
        additionalInstallationServiceOptionId: getSelectValue("additionalSelect")
    };

    await postCart(payload);
}

//Buy Now Handler
async function handleBuyNow() {

    const quantityInput = document.getElementById("quantity");
    const qty = parseInt(quantityInput.value);

    if (!validateStock(qty)) return;
    if (!currentProduct) return;

    const payload = {
        productId: currentProduct.productId,
        quantity: qty,
        stdInstallationServiceOptionId: getSelectValue("installationSelect"),
        additionalInstallationServiceOptionId: getSelectValue("additionalSelect")
    };

    await postCart(payload);

    window.location.href = "/Shop/Cart/MyCart";
}

//Helper Function with Post
function getSelectValue(id) {
    const value = document.getElementById(id).value;
    return value ? parseInt(value) : null;
}

async function postCart(payload) {

    try {
        const response = await fetch("/api/shop/cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert("Item added to cart!");
        }
        else if (response.status === 401) {
            window.location.href = "/Shop/Home/Login";
        }
        else {
            const error = await response.text();
            alert(error);
        }
    }
    catch (err) {
        console.error("Add to cart failed", err);
    }
}