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

    // Create a single modal dynamically (only once)
    let modal = document.getElementById("itemModal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "itemModal";
        modal.className = "modal fade";
        modal.tabIndex = -1;
        modal.setAttribute("aria-hidden", "true");
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
                <div class="price-section">
                   <p class="old-price text-muted" style="text-decoration: line-through;">
                   ₱${formatPrice(p.originalSellingPrice)}
                   </p>

                   <h5 class="price fw-bold">
                   ₱${formatPrice(p.actualPrice)}
                   </h5>
                </div> 

                </a>

               <div class="product-btns">
                    <button class="btn btn-primary view-item-btn"
                        data-bs-toggle="modal"
                        data-bs-target="#itemModal"
                        data-id="${p.id}"
                        data-name="${p.productModel}"
                        data-price="${p.actualPrice}"
                        data-brand="${p.brandName}"
                        data-series="${p.productSeries ?? ''}"
                        data-hp="${p.horsePower ?? '-'}"
                        data-image="${p.primaryImageUrl ?? '/images/no-image.png'}"
                        data-original-price="${p.originalSellingPrice}">
                        View Item
                    </button>
                    
                </div>
            </div>
        `;

        container.innerHTML += card;
    });

    /*view_more modal*/
    const modalEl = new bootstrap.Modal(document.getElementById('itemModal'));
    container.querySelectorAll(".view-item-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.dataset.id;
            const name = btn.dataset.name;
            const price = btn.dataset.price;
            const brand = btn.dataset.brand;
            const series = btn.dataset.series;
            const hp = btn.dataset.hp;
            const image = btn.dataset.image;
            const originalPrice = btn.dataset.originalPrice;

            document.getElementById('modalTitle').textContent = `${brand} ${series} ${name}`;
            document.getElementById('modalBody').innerHTML = `
            <div class="view-more-content">
                <img src="${image}" alt="${name}" class="view-more-image img-fluid mb-3">

                <p class="view-more-hp">${hp} HP</p>

                <p class="view-more-price">
                    <span class="original-price">₱${formatPrice(originalPrice)}</span><br>
                    <strong class="discount-price">₱${formatPrice(price)}</strong>
                </p>

                
            </div>
        `;
            const modalAddBtn = document.getElementById('modalAddToCart');
            modalAddBtn.onclick = () => addToCart({ id, name, price });
            document.getElementById('viewMoreBtn').href = `/Shop/Product/Details/${id}`;


            modalEl.show();
        });
    });
}
//helpers
function formatPrice(price) {
    return Number(price).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}
