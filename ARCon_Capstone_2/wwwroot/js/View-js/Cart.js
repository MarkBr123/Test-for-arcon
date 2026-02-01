document.addEventListener("DOMContentLoaded", () => {
    renderCartPage();
});

function renderCartPage() {
    const cart = getCart();
    const card = document.getElementById("cartPageCard");
    const totalEl = document.getElementById("cartPageTotal");

    if (!card || !totalEl) return;

    // Remove existing rows except header
    card.querySelectorAll(".order-items-row:not(.header)").forEach(r => r.remove());

    let total = 0;

    if (cart.length === 0) {
        const emptyRow = document.createElement("div");
        emptyRow.className = "order-items-row";
        emptyRow.innerHTML = `
            <span class="col product">Your cart is empty.</span>
            <span class="col price"></span>
            <span class="col quantity"></span>
            <span class="col subtotal"></span>
        `;
        card.insertBefore(emptyRow, card.querySelector(".order-footer"));
        totalEl.textContent = "₱0";
        return;
    }

    cart.forEach(item => {
        const qty = item.quantity || 1;
        const subtotal = item.price * qty;
        total += subtotal;

        const row = document.createElement("div");
        row.className = "order-items-row";
        row.innerHTML = `
    <span class="col product">${item.name}</span>
    <span class="col price">₱${item.price.toLocaleString()}</span>
    <span class="col quantity">
        <button class="qty-btn minus" data-index="${cart.indexOf(item)}">−</button>
        <input type="number" min="1" value="${qty}" data-index="${cart.indexOf(item)}" class="qty-input" />
        <button class="qty-btn plus" data-index="${cart.indexOf(item)}">+</button>
    </span>
    <span class="col subtotal">₱${subtotal.toLocaleString()}</span>
`;


        card.insertBefore(row, card.querySelector(".order-footer"));
    });

    totalEl.textContent = `₱${total.toLocaleString()}`;
}
// Update cart quantity in localStorage
function updateCartItemQuantity(index, quantity) {
    const cart = getCart();
    cart[index].quantity = quantity;
    localStorage.setItem("cart", JSON.stringify(cart));
}

// Event delegation for buttons and inputs
document.addEventListener("click", (e) => {
    if (e.target.classList.contains("qty-btn")) {
        const index = parseInt(e.target.dataset.index);
        const input = document.querySelector(`.qty-input[data-index="${index}"]`);
        let qty = parseInt(input.value);

        if (e.target.classList.contains("plus")) qty++;
        if (e.target.classList.contains("minus") && qty > 1) qty--;

        input.value = qty;
        updateCartItemQuantity(index, qty);
        renderCartPage();
    }
});

document.addEventListener("input", (e) => {
    if (e.target.classList.contains("qty-input")) {
        const index = parseInt(e.target.dataset.index);
        let qty = parseInt(e.target.value);
        if (isNaN(qty) || qty < 1) qty = 1;
        updateCartItemQuantity(index, qty);
        renderCartPage();
    }
});

