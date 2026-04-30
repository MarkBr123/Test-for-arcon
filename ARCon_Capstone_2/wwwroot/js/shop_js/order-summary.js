document.addEventListener("DOMContentLoaded", () => {

    const paymentIntentId = new URLSearchParams(window.location.search).get("pi");

    const statusEl = document.getElementById("paymentStatus");
    const orderEl = document.getElementById("orderDetails");

    // COD
    if (!paymentIntentId) {
        statusEl.innerText = "✅ Order placed successfully!";
        statusEl.classList.add("text-success");
        return;
    }

    setInterval(async () => {

        const res = await fetch(`/api/shop/checkout/payment-status/${paymentIntentId}`);
        const data = await res.json();

        const status = data.payment.status;

        // 🔥 STATUS
        if (status === "PAID") {
            statusEl.innerText = "✅ Payment Successful!";
            statusEl.classList.remove("text-warning");
            statusEl.classList.add("text-success");
        }

        if (status === "FAILED") {
            statusEl.innerText = "❌ Payment Failed!";
            statusEl.classList.remove("text-warning");
            statusEl.classList.add("text-danger");
        }

        // 🔥 ORDER DETAILS (no checks)
        orderEl.innerHTML = `
            <div class="order-summary">

                <div class="product-item">
                    <span>Transaction Code</span>
                    <span>${data.order.transactionCode}</span>
                </div>

                <div class="product-item">
                    <span>Status</span>
                    <span>${data.order.status}</span>
                </div>

                <div class="product-item">
                    <span>Payment Method</span>
                    <span>${data.order.paymentMethod}</span>
                </div>

                <div class="product-item">
                    <span>Shipping Method</span>
                    <span>${data.order.shippingMethod}</span>
                </div>

                <hr />

                <div class="product-item total">
                    <span>Total</span>
                    <span>₱${data.order.total}</span>
                </div>

            </div>
        `;

    }, 2000);

});