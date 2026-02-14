document.addEventListener("DOMContentLoaded", () => {
    loadCheckoutFromCart();

    // Shipping option change
    document.querySelectorAll(".shipping-option").forEach(radio => {
        radio.addEventListener("change", updateTotalWithShipping);
    });

    const placeOrderBtn = document.getElementById("placeOrderBtn");
    if (placeOrderBtn) placeOrderBtn.addEventListener("click", showOrderSummary);

    const confirmOrderBtn = document.getElementById("confirmOrderBtn");
    if (confirmOrderBtn) confirmOrderBtn.addEventListener("click", confirmOrder);
});

let currentSubtotal = 0;

function loadCheckoutFromCart() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const itemsContainer = document.getElementById("checkoutItems");
    const subtotalEl = document.getElementById("checkoutSubtotal");
    const totalEl = document.getElementById("checkoutTotal");

    if (!itemsContainer || !subtotalEl || !totalEl) return;

    if (cart.length === 0) {
        itemsContainer.innerHTML = "<p class='text-muted mt-3'>Your cart is empty.</p>";
        subtotalEl.textContent = "₱0";
        totalEl.textContent = "₱0";
        return;
    }

    currentSubtotal = 0;
    itemsContainer.innerHTML = "";

    cart.forEach(item => {
        const qty = item.quantity || 1;
        const itemTotal = item.price * qty;
        currentSubtotal += itemTotal;

        itemsContainer.innerHTML += `
            <div class="product-item d-flex justify-content-between">
                <div>
                    <strong>${item.name}</strong><br />
                    <small>₱${item.price.toLocaleString()} × ${qty}</small>
                </div>
                <div>₱${itemTotal.toLocaleString()}</div>
            </div>
        `;
    });

    subtotalEl.textContent = `₱${currentSubtotal.toLocaleString()}`;
    updateTotalWithShipping();
}

function updateTotalWithShipping() {
    const totalEl = document.getElementById("checkoutTotal");
    const selectedShipping = document.querySelector('input[name="shippingMethod"]:checked');
    const shippingFee = selectedShipping ? parseInt(selectedShipping.value) : 0;
    totalEl.textContent = `₱${(currentSubtotal + shippingFee).toLocaleString()}`;
}

function showOrderSummary() {
    const firstName = document.getElementById("firstName")?.value.trim();
    const lastName = document.getElementById("lastName")?.value.trim();
    const barangay = document.getElementById("barangay")?.value.trim();
    const city = document.getElementById("city")?.value;
    const street = document.getElementById("street")?.value;
    const deliveryDate = document.getElementById("deliveryDate")?.value;
    const deliveryTime = document.getElementById("deliveryTime")?.value;

    if (!firstName || !lastName || !barangay || !city || !street || !deliveryDate || !deliveryTime) {
        alert("Please complete all required shipping details.");
        return;
    }

    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const shippingFee = parseInt(document.querySelector('.shipping-option:checked')?.value || 0);

    let subtotal = 0;
    let itemsHtml = "";
    cart.forEach(item => {
        const qty = item.quantity || 1;
        const itemTotal = item.price * qty;
        subtotal += itemTotal;

        itemsHtml += `
            <div class="d-flex justify-content-between">
                <span>${item.name} (x${qty})</span>
                <span>₱${itemTotal.toLocaleString()}</span>
            </div>
        `;
    });

    const total = subtotal + shippingFee;

    document.getElementById("summaryShipping").innerHTML = `
        ${firstName} ${lastName}<br>
        ${street} Barangay ${barangay} ${city} City, Philippines
    `;
    document.getElementById("summaryItems").innerHTML = itemsHtml;
    document.getElementById("summaryTotal").textContent = `₱${total.toLocaleString()}`;
    document.getElementById("summaryDate_Time").innerHTML = `
        Preferred delivery date: ${deliveryDate} <br>
        Preferred delivery time: ${deliveryTime}
    `;

    new bootstrap.Modal(document.getElementById("orderSummaryModal")).show();
}

function confirmOrder() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    if (cart.length === 0) return;

    // Save order
    const orders = JSON.parse(localStorage.getItem("orders")) || [];
    const newOrder = { id: Date.now(), date: new Date().toLocaleDateString(), items: cart };
    orders.push(newOrder);
    localStorage.setItem("orders", JSON.stringify(orders));

    // Push notification
    pushOrderNotification(newOrder);

    // Clear cart
    localStorage.removeItem("cart");
    updateCartCount();

    // Close modal
    const modalInstance = bootstrap.Modal.getInstance(document.getElementById("orderSummaryModal"));
    if (modalInstance) modalInstance.hide();

    // Show toast
    showOrderToast(newOrder);

    // Redirect after toast shows
    setTimeout(() => location.href = "/Home/Index", 2000);
}

function showOrderToast(order) {
    let toastContainer = document.getElementById("toastContainer");
    if (!toastContainer) {
        toastContainer = document.createElement("div");
        toastContainer.id = "toastContainer";
        toastContainer.style.position = "fixed";
        toastContainer.style.top = "20px";
        toastContainer.style.right = "20px";
        toastContainer.style.zIndex = "1060"; // above modals
        document.body.appendChild(toastContainer);
    }

    const toastEl = document.createElement("div");
    toastEl.className = "toast align-items-center text-bg-success border-0";
    toastEl.role = "alert";
    toastEl.ariaLive = "assertive";
    toastEl.ariaAtomic = "true";

    toastEl.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                Order #${order.id} placed successfully!
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;

    toastContainer.appendChild(toastEl);
    const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
    toast.show();
    toastEl.addEventListener("hidden.bs.toast", () => toastEl.remove());
}

function pushOrderNotification(order) {
    const notifications = JSON.parse(localStorage.getItem("notifications")) || [];
    const newNotif = {
        id: Date.now(),
        title: `Order #${order.id}`,
        date: new Date().toLocaleString(),
        message: order.items.map(i => `${i.name} x${i.quantity}`).join(", "),
        url: "/Ecommerce/Cart/CartIndex#Ordered",
        read: false
    };
    notifications.push(newNotif);
    localStorage.setItem("notifications", JSON.stringify(notifications));

    if (typeof loadNotifications === "function") loadNotifications();
}
