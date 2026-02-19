document.addEventListener("DOMContentLoaded", function () {

    fetch('/api/shop/home_product_cards')
        .then(res => res.json())
        .then(products => {

            const container = document.getElementById("productContainer");
            container.innerHTML = "";

            products.forEach(p => {

                let stockDisplay = "";
                let addToCartButton = "";

                // Stock logic MUST be inside loop
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
                        <button class="btn btn-primary"
                            onclick="addToCart(${p.id}, '${p.productModel}', ${p.actualSellingPrice})">
                            Add to Cart
                        </button>
                    `;
                }
                else {

                    stockDisplay = `<span class="badge stock">IN STOCK</span>`;

                    addToCartButton = `
                        <button class="btn btn-primary"
                            onclick="addToCart(${p.id}, '${p.productModel}', ${p.actualSellingPrice})">
                            Add to Cart
                        </button>
                    `;
                }

                const imageUrl = p.primaryImageUrl ?? '/images/no-image.png';

                container.innerHTML += `
                    <div class="card product-card text-dark">

                        <a href="/Shop/Product/Details/${p.id}">
                            ${stockDisplay}
                            <img src="${imageUrl}" alt="${p.productModel}">
                            <h3>${p.brandName} ${p.productSeries} ${p.productModel}</h3>
                            <p>${p.horsePower ?? "-"} ${p.horsePower ? "HP" : ""}</p>
                            <h3><strong>₱${p.actualSellingPrice.toLocaleString()}</strong></h3>
                        </a>

                        ${addToCartButton}

                    </div>
                `;
            });

        });
});
