document.addEventListener("DOMContentLoaded", loadBestDeals);

async function loadBestDeals() {
    try {
        const response = await fetch("/api/shop/home_product_cards/best-deals");
        const products = await response.json();

        renderBestDeals(products);
    } catch (error) {
        console.error("Error loading best deals:", error);
    }
}


function renderBestDeals(products) {
    const container = document.getElementById("bestDealsContainer");
    container.innerHTML = "";

    if (!products || products.length === 0) {
        container.innerHTML = "<p>No best deals available.</p>";
        return;
    }

    products.forEach(p => {

        let discountBadge = "";

        if (p.discountType === "PERCENTAGE" && p.discountValue) {
            discountBadge = `${p.discountValue}% Less`;
        }
        else if (p.discountType === "AMOUNT" && p.discountValue) {
            discountBadge = `₱${formatPrice(p.discountValue)} Less`;
        }

        const stockBadge = p.inStock
            ? `<span class="badge stock">IN STOCK</span>`
            : `<span class="badge stock bg-danger">OUT OF STOCK</span>`;

        const card = `
            <div class="card product-card text-dark">

                <a href="/Shop/Product/Details/${p.id}">

                    ${discountBadge
                ? `<span class="badge discount">${discountBadge}</span>`
                : ""}

                    ${stockBadge}

                    <img src="${p.primaryImageUrl ?? '/images/no-image.png'}" 
                         alt="${p.productModel}">

                    <h3>${p.brandName} ${p.productSeries ?? ""} ${p.productModel}</h3>
                    <p>${p.horsePower ?? "-"} ${p.horsePower ? "HP" : ""}</p>
                    <p class="old-price text-muted" style="text-decoration: line-through;">
                        ₱${formatPrice(p.originalSellingPrice)}
                    </p>

                    <p class="price fw-bold">
                        ₱${formatPrice(p.actualPrice)}
                    </p>

                </a>

                <button class="btn btn-primary"
                        onclick="addToCart({
                            id: ${p.id}, 
                            name: '${p.productModel}', 
                            price: ${p.actualPrice}
                        })">
                    Add to Cart
                </button>

            </div>
        `;

        container.innerHTML += card;
    });
}

//helpers
function formatPrice(price) {
    return Number(price).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}
