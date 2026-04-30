document.addEventListener("DOMContentLoaded", () => {

    // =========================
    // 🔹 Get URL params
    // =========================
    const params = new URLSearchParams(window.location.search);
    const paymentTransactionId = params.get("paymentTransactionId");

    if (!paymentTransactionId) {
        alert("Invalid payment session.");
        window.location.href = "/shop/cart";
        return;
    }

    // =========================
    // 🔹 Initialize PayMongo
    // =========================
    const paymongo = Paymongo("pk_test_Yg5DNu2XYgqhsoVBJL8nmXjY");

    const payBtn = document.getElementById("payBtn");
    const statusMsg = document.getElementById("statusMsg");

    // =========================
    // 🔹 Handle Payment
    // =========================
    payBtn.addEventListener("click", async () => {

        payBtn.disabled = true;
        payBtn.innerText = "Processing...";
        statusMsg.innerHTML = "⏳ Processing payment...";

        try {

            // =========================
            // 🔹 Get Inputs
            // =========================
            const cardNumber = document.getElementById("cardNumber").value;
            const expMonth = document.getElementById("expMonth").value;
            const expYear = document.getElementById("expYear").value;
            const cvc = document.getElementById("cvc").value;

            // 🔴 BASIC VALIDATION
            if (!cardNumber || !expMonth || !expYear || !cvc) {
                statusMsg.innerHTML = `<span class="text-danger">Please fill all card details.</span>`;
                payBtn.disabled = false;
                payBtn.innerText = "Pay Now";
                return;
            }

            // =========================
            // 🔹 Create Payment Method
            // =========================
            const result = await paymongo.createPaymentMethod({
                type: "card",
                details: {
                    card_number: cardNumber.replace(/\s/g, ""),
                    exp_month: parseInt(expMonth),
                    exp_year: parseInt(expYear),
                    cvc: cvc
                }
            });

            console.log("🔍 FULL RESULT:", result);

            // 🔴 ERROR CHECK
            if (!result || result.errors) {

                const errorMsg =
                    result?.errors?.[0]?.detail ||
                    "Payment failed.";

                statusMsg.innerHTML = `<span class="text-danger">${errorMsg}</span>`;

                payBtn.disabled = false;
                payBtn.innerText = "Pay Now";

                return;
            }

            // ✅ SUCCESS (THIS IS THE FIX)
            const paymentMethodId = result.id;

            console.log("✅ PaymentMethod ID:", paymentMethodId);

            // =========================
            // 🔹 Call Backend (Attach)
            // =========================
            const response = await fetch("/api/online-payments-orders/attach-payment", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "same-origin",
                body: JSON.stringify({
                    paymentTransactionId: parseInt(paymentTransactionId),
                    paymentMethodId: paymentMethodId
                })
            });

            const apiResult = await response.json();

            if (apiResult.success) {
                statusMsg.innerHTML = `
                    <span class="text-success">
                        ✅ Payment is being processed...
                    </span>
                `;

                // ⏳ wait for webhook confirmation
                setTimeout(() => {
                    window.location.href = "/shop/cart/payment-success";
                }, 2500);

            } else {
                statusMsg.innerHTML = `<span class="text-danger">${apiResult.message}</span>`;
                payBtn.disabled = false;
                payBtn.innerText = "Pay Now";
            }

        } catch (err) {
            console.error("❌ JS ERROR:", err);

            statusMsg.innerHTML = `
                <span class="text-danger">Something went wrong.</span>
            `;

            payBtn.disabled = false;
            payBtn.innerText = "Pay Now";
        }

    });

});