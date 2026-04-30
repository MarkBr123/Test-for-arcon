//Shop/Controllers/Shop_CartApiController.cs



document.addEventListener("DOMContentLoaded", () => {
    loadCartItems();
});

//Load Cart From API
async function loadCartItems() {
    try {
        const response = await fetch("/api/shop/cart");

        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = "/Shop/Home/Login";
                return;
            }
            throw new Error("Failed to load cart.");
        }

        const items = await response.json();
        renderCartItems(items);

    } catch (err) {
        console.error("Cart load error:", err);
    }
}

//Render Cart Items
function renderCartItems(items) {

    const container = document.getElementById("cartItemsContainer");
    container.innerHTML = "";

    if (!items || items.length === 0) {
        container.innerHTML =
            `<div class="empty-cart">Your cart is empty.</div>`;
        updateTotal(0);
        return;
    }



    items.forEach(item => {

        const productPrice = Number(item.productPrice) || 0;
        const stdPrice = Number(item.stdPrice) || 0;
        const addPrice = Number(item.addPrice) || 0;
        const subtotal = Number(item.subtotal) || 0;



        container.innerHTML += `
        <div class="cart-item-wrapper" data-id="${item.cartItemId}">

            <!-- Main Row -->
            <div class="order-items-row cart-item">

                <label>
                    <input type="checkbox"
                           class="cartItemCheckbox"
                           data-subtotal="${subtotal}" />
                </label>

                <span class="col brand">${item.brandName}</span>
                <span class="col series">${item.productSeries ?? ""}</span>
                <span class="col model">${item.productModel}</span>
                <span class="col sku">${item.sku}</span>

                <span class="col price">
                    ₱${formatPrice(productPrice)}
                </span>

                <span class="col quantity">
                    ${item.quantity}
                </span>

                <span class="col stdServiceFee">
                    ${stdPrice > 0 ? `₱${formatPrice(stdPrice)}` : "-"}
                </span>

                <span class="col AddServiceFee">
                    ${addPrice > 0 ? `₱${formatPrice(addPrice)}` : "-"}
                </span>

                <span class="col subtotal">
                    ₱${formatPrice(subtotal)}
                </span>
                <span class="col actions text-end">
                <button class="btn btn-sm btn-outline-danger deleteCartItemBtn"
                        data-id="${item.cartItemId}">
                    🗑
                </button>
</span>

            </div>

            <!-- Installation Description Row -->
            <div class="order-items-row installation-row">

                <span></span>

                <span class="installation-details" colspan="8">

                    <strong>Standard:</strong>
                    ${item.stdDescription ?? "None"}
                    ${stdPrice > 0 ? `(₱${formatPrice(stdPrice)})` : ""}

                    &nbsp;&nbsp;|&nbsp;&nbsp;

                    <strong>Additional:</strong>
                    ${item.addDescription ?? "None"}
                    ${addPrice > 0 ? `(₱${formatPrice(addPrice)})` : ""}

                </span>

            </div>

        </div>
    `;
    });


}

//Update Total
function updateTotal(total) {
    const totalEl = document.getElementById("cartPageTotal");
    totalEl.innerText = "₱" + formatPrice(total);
}

//Format Price
function formatPrice(value) {
    return Number(value).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

//DELETE FUNCTION
document.addEventListener("click", function (e) {

    if (e.target.closest(".deleteCartItemBtn")) {

        const btn = e.target.closest(".deleteCartItemBtn");
        const cartItemId = btn.dataset.id;

        if (!confirm("Remove this item from cart?"))
            return;

        deleteCartItem(cartItemId);
    }
});

async function deleteCartItem(cartItemId) {

    const response = await fetch(`/api/shop/cart/${cartItemId}`, {
        method: "DELETE"
    });

    if (response.ok) {
        loadCartItems(); // re-fetch cart
    }
}

//calculate grand total
function calculateCheckedTotal() {

    let total = 0;

    const checkboxes = document.querySelectorAll(".cartItemCheckbox:checked");

    checkboxes.forEach(cb => {
        total += Number(cb.dataset.subtotal) || 0;
    });

    updateTotal(total);
}

setTimeout(() => {
    document.querySelectorAll(".cartItemCheckbox").forEach(cb => {
        cb.addEventListener("change", calculateCheckedTotal);
    });
}, 0);

document.getElementById("selectAllCartItems")
    .addEventListener("change", function () {

        const isChecked = this.checked;

        document.querySelectorAll(".cartItemCheckbox")
            .forEach(cb => cb.checked = isChecked);

        calculateCheckedTotal();
    });


//this will proOnly the checked items should go to checkout. Not the entire cart

document.getElementById("checkoutBtn")
    .addEventListener("click", function (e) {

        e.preventDefault();

        const selectedIds = [];

        document.querySelectorAll(".cartItemCheckbox:checked")
            .forEach(cb => {
                selectedIds.push(
                    parseInt(
                        cb.closest(".cart-item-wrapper")
                            .dataset.id
                    )
                );
            });

        if (selectedIds.length === 0) {
            alert("Please select at least one item.");
            return;
        }

        // Send to backend
        fetch("/api/shop/checkout/checkout-selected", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "same-origin",
            body: JSON.stringify(selectedIds)
        })
            .then(res => {
                if (!res.ok) throw new Error("Failed");
                window.location.href = "/Shop/Cart/Checkout";
            });
    });