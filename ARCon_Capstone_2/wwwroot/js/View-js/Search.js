let allProducts = [];

document.addEventListener("DOMContentLoaded", () => {
    loadProducts();

    // Use event delegation for sidebar checkboxes
    const filtersContainer = document.querySelector(".filters");
    if (filtersContainer) {
        filtersContainer.addEventListener("change", e => {
            if (e.target.matches("input[type='checkbox']")) {
                applyFilters();
            }
        });
    }
});

/* LOAD PRODUCTS */
function loadProducts() {
    fetch("/api/shop/home_product_cards")
        .then(res => res.json())
        .then(data => {
            allProducts = data;

            // Apply URL query parameters first
            applyQueryFilters();
        })
        .catch(err => console.error("Error loading products:", err));
}

/* APPLY FILTERS FROM URL QUERY PARAMETERS */
function applyQueryFilters() {
    const urlParams = new URLSearchParams(window.location.search);

    const selectedBrands = urlParams.get("brands") ? [urlParams.get("brands").toLowerCase()] : [];
    const selectedHP = urlParams.get("hp") ? [parseFloat(urlParams.get("hp"))] : [];
    const selectedSeries = urlParams.get("series") ? [urlParams.get("series").toLowerCase()] : [];

    let filtered = [...allProducts];

    if (selectedBrands.length) {
        filtered = filtered.filter(p => selectedBrands.includes((p.brandName ?? "").toLowerCase()));
    }

    if (selectedHP.length) {
        filtered = filtered.filter(p => selectedHP.includes(Number(p.horsePower ?? 0)));
    }

    if (selectedSeries.length) {
        filtered = filtered.filter(p => selectedSeries.some(s => (p.productSeries ?? "").toLowerCase().includes(s)));
    }

    renderProducts(filtered);

    // Update checkboxes in the sidebar to match URL query
    updateSidebarCheckboxes(selectedBrands, selectedHP, selectedSeries);
}

/* UPDATE CHECKBOXES BASED ON URL (optional but useful) */
function updateSidebarCheckboxes(brands, hpValues, series) {
    document.querySelectorAll(".filters input[id$='-cb']").forEach(cb => {
        cb.checked = brands.includes(cb.parentElement.textContent.trim().toLowerCase());
    });

    document.querySelectorAll(".filters input[id$='-hp']").forEach(cb => {
        cb.checked = hpValues.includes(parseFloat(cb.value));
    });

    document.querySelectorAll(".filters input[id$='-productSeries']").forEach(cb => {
        cb.checked = series.includes(cb.value.toLowerCase());
    });
}

/* APPLY FILTERS FROM CHECKBOXES */
function applyFilters() {
    let filtered = [...allProducts];

    // BRAND FILTER
    const selectedBrands = Array.from(document.querySelectorAll(".filters input[id$='-cb']:checked"))
        .map(cb => cb.parentElement.textContent.trim().toLowerCase());
    if (selectedBrands.length) {
        filtered = filtered.filter(p => selectedBrands.includes((p.brandName ?? "").toLowerCase()));
    }

    // HP FILTER
    const selectedHP = Array.from(document.querySelectorAll(".filters input[id$='-hp']:checked"))
        .map(cb => parseFloat(cb.value));
    if (selectedHP.length) {
        filtered = filtered.filter(p => selectedHP.includes(Number(p.horsePower ?? 0)));
    }

    // PRODUCT SERIES FILTER
    const selectedSeries = Array.from(document.querySelectorAll(".filters input[id$='-productSeries']:checked"))
        .map(cb => cb.value.toLowerCase());
    if (selectedSeries.length) {
        filtered = filtered.filter(p => selectedSeries.some(s => (p.productSeries ?? "").toLowerCase().includes(s)));
    }

    // STOCK FILTER
    const inStockCheckbox = document.getElementById("in-stock");
    if (inStockCheckbox && inStockCheckbox.checked) {
        filtered = filtered.filter(p => p.availableStock > 0);
    }

    renderProducts(filtered);
}

/* RENDER PRODUCTS */
function renderProducts(products) {
    const grid = document.getElementById("productGrid");
    grid.innerHTML = "";

    if (!products.length) {
        grid.innerHTML = `<p class="no-results">No products found</p>`;
        document.querySelector(".results-header h3").innerText = "Showing 0 Results";
        return;
    }

    products.forEach(p => {
        const image = p.primaryImageUrl ?? "/images/no-image.png";
        let stockBadge = "";
        let button = "";

        if (p.availableStock === 0) {
            stockBadge = `<span class="badge bg-danger">OUT OF STOCK</span>`;
            button = `<button class="btn btn-secondary" disabled>Out of Stock</button>`;
        } else if (p.availableStock <= 3) {
            stockBadge = `<span class="badge bg-warning text-dark">Only ${p.availableStock} left</span>`;
            button = `<button class="btn btn-primary" onclick="addToCart(${p.id}, '${p.productModel}', ${p.actualSellingPrice})">Add to Cart</button>`;
        } else {
            stockBadge = `<span class="badge stock">IN STOCK</span>`;
            button = `<button class="btn btn-primary" onclick="addToCart(${p.id}, '${p.productModel}', ${p.actualSellingPrice})">Add to Cart</button>`;
        }

        grid.innerHTML += `
        <div class="card product-card text-dark">
            <a href="/Shop/Product/Details/${p.id}">
                ${stockBadge}
                <img src="${image}" alt="${p.productModel}">
                <h4>${p.brandName} ${p.productModel}</h4>
                <p class="description">${p.productSeries ?? "-"} | ${p.horsePower ?? "-"} HP</p>
                <p class="price">₱${p.actualSellingPrice.toLocaleString()}</p>
            </a>
            ${button}
        </div>`;
    });

    document.querySelector(".results-header h3").innerText = `Showing ${products.length} Results`;
}