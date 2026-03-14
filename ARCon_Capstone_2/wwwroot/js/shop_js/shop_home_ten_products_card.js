document.addEventListener("DOMContentLoaded", function () {

    fetch('/api/shop/home_product_cards')
        .then(res => res.json())
        .then(products => {

            const container = document.getElementById("productContainer");
            container.innerHTML = "";

            // Create modal once if it doesn't exist
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
                            <button class="btn-close" data-bs-dismiss="modal"></button>
                        </div>

                        <div class="modal-body" id="modalBody"></div>

                        <button class="btn btn-primary cart-btn"
onclick="addToCart({id: ${p.id}, name: '${p.productModel}', price: ${p.actualPrice}})">
    <i class="bi bi-cart-plus-fill cart-icon"></i>
</button>

                    </div>
                </div>
                `;

                document.body.appendChild(modal);
            }

            products.forEach(p => {

                let stockDisplay = "";
                let addToCartButton = "";

                if (p.availableStock === 0) {

                    stockDisplay = `<span class="badge bg-danger">OUT OF STOCK</span>`;

                    addToCartButton = `
                        <button class="btn btn-secondary" disabled>
                            Out of Stock
                        </button>
                    `;

                }
                else if (p.availableStock <= 3) {

                    stockDisplay = `
                        <span class="badge bg-warning text-dark">
                            Only ${p.availableStock} left
                        </span>
                    `;

                    addToCartButton = `
                        <button class="btn btn-primary cart-btn"
onclick="addToCart({id: ${p.id}, name: '${p.productModel}', price: ${p.actualPrice}})">
    <i class="bi bi-cart-plus-fill cart-icon"></i>
</button>
                    `;
                }
                else {

                    stockDisplay = `<span class="badge stock">IN STOCK</span>`;

                    addToCartButton = `
                        <button class="btn btn-primary cart-btn"
onclick="addToCart({id: ${p.id}, name: '${p.productModel}', price: ${p.actualPrice}})">
    <i class="bi bi-cart-plus-fill cart-icon"></i>
</button>
                    `;
                }

                const imageUrl = p.primaryImageUrl ?? '/images/no-image.png';

                container.innerHTML += `
                    <div class="card product-card text-dark">

                        <a href="/Shop/Product/Details/${p.id}">
                            ${stockDisplay}
                            <img src="${imageUrl}" alt="${p.productModel}">
                            <h3>${p.brandName} ${p.productSeries ?? ""} ${p.productModel}</h3>
                            <p>${p.horsePower ?? "-"} ${p.horsePower ? "HP" : ""}</p>
                            <h3><strong>₱${p.actualSellingPrice.toLocaleString()}</strong></h3>
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

                            ${addToCartButton}

                        </div>

                    </div>
                `;
            });

            const modalEl = new bootstrap.Modal(document.getElementById('itemModal'));

            container.querySelectorAll(".view-item-btn").forEach(btn => {

                btn.addEventListener("click", () => {

                    const id = btn.dataset.id;
                    const name = btn.dataset.name;
                    const brand = btn.dataset.brand;
                    const series = btn.dataset.series;
                    const price = btn.dataset.price;
                    const hp = btn.dataset.hp;
                    const image = btn.dataset.image;

                    document.getElementById("modalTitle").textContent =
                        `${brand} ${series} ${name}`;

                    document.getElementById("modalBody").innerHTML = `
                        <div class="view-more-content">

                            <img src="${image}" class="img-fluid mb-3">

                            <p>${hp} HP</p>

                            <h4>₱${Number(price).toLocaleString()}</h4>

                            <div class="buttons">
                                <button class="btn btn-primary">View in AR</button>
                            </div>

                        </div>
                    `;

                    document.getElementById("modalAddToCart").onclick =
                        () => addToCart(id, name, price);

                    document.getElementById("viewMoreBtn").href =
                        `/Shop/Product/Details/${id}`;

                    modalEl.show();

                });

            });

        });

});