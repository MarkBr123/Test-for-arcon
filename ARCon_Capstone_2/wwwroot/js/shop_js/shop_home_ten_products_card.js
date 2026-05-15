document.addEventListener("DOMContentLoaded", function () {

    const container = document.getElementById("productContainer");

    fetch('/api/shop/home_product_cards')
        .then(res => res.json())
        .then(products => {

            container.innerHTML = "";

            // Create modal once
            let modal = document.getElementById("itemModal");

            if (!modal) {
                modal = document.createElement("div");
                modal.id = "itemModal";
                modal.className = "modal fade";
                modal.tabIndex = -1;

                modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="modalTitle"></h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body" id="modalBody"></div>
                    <div class="modal-footer">
                        <a id="viewMoreBtn" class="btn btn-primary" href="#">View more</a>
                        <button id="modalAddToCart" class="btn btn-primary"></button>
                    </div>
                </div>
            </div>
        `;

                document.body.appendChild(modal);
            }

            // Render products
            products.forEach(p => {

                let stockDisplay = "";
                let addToCartButton = "";

                if (p.availableStock === 0) {
                    stockDisplay = `<span class="badge bg-danger">OUT OF STOCK</span>`;
                    addToCartButton = `<button class="btn btn-secondary" disabled>Out of Stock</button>`;
                }
                else if (p.availableStock <= 3) {
                    stockDisplay = `<span class="badge bg-warning text-dark">Only ${p.availableStock} left</span>`;
                    addToCartButton = createCartBtn(p);
                }
                else {
                    stockDisplay = `<span class="badge stock">IN STOCK</span>`;
                    addToCartButton = createCartBtn(p);
                }

                const imageUrl = p.primaryImageUrl ?? '/images/no-image.png';

                container.innerHTML += `
                <div class="card product-card text-dark">

                    <a href="/Shop/Product/Details/${p.id}">
                        ${stockDisplay}
                        <img src="${imageUrl}">
                        <h3>${p.brandName} ${p.productSeries ?? ""} ${p.productModel}</h3>
                        <p>${p.horsePower ?? "-"} ${p.horsePower ? "HP" : ""}</p>
                        <p><strong>₱${p.actualSellingPrice.toLocaleString()}</strong></p>
                    </a>

                    <div class="product-btns">

                        <button class="btn btn-primary view-item-btn"
                            data-id="${p.id}"
                            data-name="${p.productModel}"
                            data-brand="${p.brandName}"
                            data-series="${p.productSeries ?? ''}"
                            data-price="${p.actualSellingPrice}"
                            data-hp="${p.horsePower ?? '-'}"
                            data-image="${imageUrl}">
                            View Item
                        </button>


                    </div>

                </div>
                `;
            });

            const modalEl = new bootstrap.Modal(document.getElementById('itemModal'));

            // View item click
            container.querySelectorAll(".view-item-btn").forEach(btn => {

                btn.addEventListener("click", () => {

                    const { id, name, brand, series, price, hp, image } = btn.dataset;

                    document.getElementById("modalTitle").textContent =
                        `${brand} ${series} ${name}`;

                    document.getElementById("modalBody").innerHTML = `
                        <div class="view-more-content">
                            <img src="${image}" class="img-fluid mb-3">
                            <p>${hp} HP</p>
                            <h4>₱${Number(price).toLocaleString()}</h4>
                        </div>
                    `;

                    // FIXED: bind correct data (no p here)
                    document.getElementById("modalAddToCart").onclick = () => {
                        addToCart({
                            id,
                            name,
                            price: Number(price)
                        });
                    };

                    modalEl.show();
                });
            });

        });

    // ✅ Event delegation for cart buttons
    container.addEventListener("click", function (e) {

        const btn = e.target.closest(".cart-btn");
        if (!btn) return;

        addToCart({
            id: btn.dataset.id,
            name: btn.dataset.name,
            price: Number(btn.dataset.price)
        });
    });

});

// Create cart button (clean helper)
function createCartBtn(p) {
    return `
        <button class="btn btn-primary cart-btn"
            id="cartTen"
            data-id="${p.id}"
            data-name="${p.productModel}"
            data-price="${p.actualSellingPrice}">
            <i class="bi bi-cart-plus-fill cart-icon"></i>
        </button>
    `;
}

// Sample addToCart
function addToCart(item) {
    console.log("Added to cart:", item);

    // TODO: connect to backend or localStorage
}