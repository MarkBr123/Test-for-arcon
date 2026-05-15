////////////////////////    Select Address Functions   ////////////////////////////

let loadedAddresses = [];
let currentSubtotal = 0;
let currentTotalUnits = 0;
let currentTotalWeight = 0;
let currentShippingFee = 0;


document.getElementById("selectAddressBtn")
    .addEventListener("click", async function () {

        const modalElement = document.getElementById("addressModal");
        const modal = new bootstrap.Modal(modalElement);

        modal.show(); // SHOW FIRST

        try {
            await loadAddresses();
        } catch (err) {
            console.error("Address load failed:", err);
        }
    });

async function loadAddresses() {
    try {
        const response = await fetch("/api/shop/addresses", {
            credentials: "same-origin"
        });

        const addresses = await response.json();

        loadedAddresses = addresses; // 🔥 store globally

        const container = document.getElementById("addressListContainer");
        container.innerHTML = "";

        addresses.forEach(addr => {

            container.innerHTML += `
        <div class="card mb-2 p-3">

            <strong>${addr.house_unit ?? ""}</strong><br/>

            ${addr.street_name ?? ""}<br/>

            ${addr.barangay ?? ""}, 
            ${addr.municipality ?? ""}, 
            ${addr.province ?? ""}<br/>

            ${addr.region ?? ""}<br/>

            ZIP: ${addr.zip_code ?? ""}<br/>

            ${addr.landmark ? `<small>Landmark: ${addr.landmark}</small><br/>` : ""}

            ${addr.is_default ?
                    `<span class="badge bg-success">Default</span><br/>`
                    : ""}

            <button class="btn btn-sm btn-primary mt-2 selectAddressItemBtn"
                    data-id="${addr.id}">
                Use This Address
            </button>

        </div>
    `;
        });

    } catch (err) {
        console.error("Address load failed:", err);
    }
}

document.addEventListener("click", function (e) {

    if (e.target.classList.contains("selectAddressItemBtn")) {

        const addressId = parseInt(e.target.dataset.id);

        // find selected address from stored list
        const selected = loadedAddresses.find(a => a.id === addressId);

        if (!selected) return;

        // Store hidden value
        document.getElementById("selectedAddressId").value = addressId;

        // Show full formatted address
        document.getElementById("selectedAddressContainer").innerHTML = `
                <div class="selected-address-box">

                    <strong>${selected.house_unit ?? ""}</strong><br/>

                    ${selected.street_name ?? ""}<br/>

                    ${selected.barangay ?? ""}, 
                    ${selected.municipality ?? ""}, 
                    ${selected.province ?? ""}<br/>

                    ${selected.region ?? ""}<br/>

                    ZIP: ${selected.zip_code ?? ""}<br/>

                    ${selected.landmark ? `<small>Landmark: ${selected.landmark}</small><br/>` : ""}

                    ${selected.is_default ?
                            `<span class="badge bg-success mt-1">Default Address</span>`
                            : ""}
                </div>
            `;

        bootstrap.Modal.getInstance(
            document.getElementById("addressModal")
        ).hide();

        // 🔥 NOW call shipping quote
        getShippingQuote();
    }
});

//load checkout items
async function loadCheckoutItems() {

    try {
        const response = await fetch("/api/shop/checkout/checkout-items", {
            credentials: "same-origin"
        });

        if (!response.ok) {
            document.getElementById("checkoutItemsContainer")
                .innerHTML = `<p class="text-danger">Failed to load items.</p>`;
            return;
        }

        const items = await response.json();

        const container = document.getElementById("checkoutItemsContainer");
        container.innerHTML = "";

        if (!items.length) {
            container.innerHTML = `<p class="text-muted">No selected items.</p>`;
            return;
        }

        currentSubtotal = 0;
        currentTotalUnits = 0;

        items.forEach(item => {

            currentSubtotal += item.subtotal;
            currentTotalUnits += item.quantity;
            currentTotalWeight += item.totalWeight;


            container.innerHTML += `
                <div class="border-bottom py-2">

                    <strong>
                        ${[
                                item.productBrand,
                                item.productSeries,
                                item.productModel,
                            ].filter(Boolean).join(" ")}
                    </strong><br/>

                    <small>
                        SKU: ${item.productSku}</br>
                        Unit Price: ₱${(item.unitPrice ?? 0).toFixed(2)}<br/>
                        Standard Service: ₱${(item.stdServicePrice ?? 0).toFixed(2)}<br/>
                        Additional Service: ₱${(item.addServicePrice ?? 0).toFixed(2)}<br/>
                        Quantity: ${item.quantity ?? 0}
                    </small>

                    <div class="text-end mt-1">
                        <strong>
                            ₱${(item.subtotal ?? 0).toFixed(2)}
                        </strong>
                    </div>

                </div>
            `;
        });

    } catch (err) {
        console.error("Checkout items load failed:", err);
    }
    updateCheckoutTotals();
}

const MOCK_SHIPPING_FEE = 0.00;

function updateCheckoutTotals() {

    const total = currentSubtotal + MOCK_SHIPPING_FEE;

    document.getElementById("checkoutSubtotal")
        .innerText = `₱${currentSubtotal.toFixed(2)}`;

    document.getElementById("checkoutTotal") // grand total
        .innerText = `₱${total.toFixed(2)}`;

    document.getElementById("totalUnits")
        .innerText = currentTotalUnits;

    document.getElementById("shippingFee")
        .innerText = `₱ ${MOCK_SHIPPING_FEE.toFixed(2)}`;

    document.getElementById("totalWeight")
        .innerText = `${currentTotalWeight.toFixed(2)} kg`;
}


// TEMPORARY SHIPPING FEE



async function getShippingQuote() {

    try {
        // 🚫 Skip API call completely
        // const response = await fetch("/api/shop/checkout/get-shipping-quote", {
        //     method: "POST",
        //     credentials: "same-origin"
        // });

        // ✅ Assume fixed shipping fee
        currentShippingFee = MOCK_SHIPPING_FEE;

        document.getElementById("shippingFee")
            .innerText = `₱${currentShippingFee.toFixed(2)}`;

        updateCheckoutTotals();

        console.log("Shipping mocked successfully: ₱800.00");

    } catch (err) {
        console.error("Shipping error:", err);
    }
    updateCheckoutTotals();
}



document.addEventListener("DOMContentLoaded", async () => {
    await loadCheckoutItems();
});



//////////////// FINAL POST JS (Place Order) //////////////////

document.getElementById("placeOrderBtn")
    .addEventListener("click", async function () {

        const btn = this;
        btn.disabled = true;

        try {

            // 🔹 Get Selected Shipping
            const shippingMethod =
                document.querySelector('input[name="shippingMethod"]:checked')?.value;

            // 🔹 Get Selected Payment
            const paymentMethod =
                document.querySelector('input[name="paymentMethod"]:checked')?.value;

            // 🔹 Get Delivery Address
            const deliveryAddressId =
                document.getElementById("selectedAddressId").value;

            // 🔹 Basic Validation
            if (!shippingMethod) {
                alert("Please select a shipping method.");
                btn.disabled = false;
                return;
            }

            if (!paymentMethod) {
                alert("Please select a payment method.");
                btn.disabled = false;
                return;
            }

            if (shippingMethod !== "STORE_PICKUP" && !deliveryAddressId) {
                alert("Please select a delivery address.");
                btn.disabled = false;
                return;
            }

            // =========================
            // 🔥 ONLINE PAYMENT FLOW
            // =========================
            let paymentMethodId = null;

            if (paymentMethod === "ONLINE_PAYMENT") {

                const cardNumber = document.getElementById("cardNumber").value;
                const expMonth = document.getElementById("expMonth").value;
                const expYear = document.getElementById("expYear").value;
                const cvc = document.getElementById("cvc").value;

                if (!cardNumber || !expMonth || !expYear || !cvc) {
                    alert("Please complete card details.");
                    btn.disabled = false;
                    return;
                }

                const paymongo = Paymongo("pk_test_Yg5DNu2XYgqhsoVBJL8nmXjY");

                const resultPM = await paymongo.createPaymentMethod({
                    type: "card",
                    details: {
                        card_number: cardNumber.replace(/\s/g, ""),
                        exp_month: parseInt(expMonth),
                        exp_year: parseInt(expYear),
                        cvc: cvc
                    }
                });

                console.log("PM RESULT:", resultPM);

                // 🔴 Handle error
                if (!resultPM || resultPM.errors) {
                    alert(resultPM?.errors?.[0]?.detail || "Payment failed.");
                    btn.disabled = false;
                    return;
                }
                paymentMethodId = resultPM.id;
            }
            const response = await fetch("/api/shop/checkout/create-checkout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "same-origin",
                body: JSON.stringify({
                    paymentMethod: paymentMethod,
                    shippingMethod: shippingMethod,
                    deliveryAddressId: deliveryAddressId
                        ? parseInt(deliveryAddressId)
                        : null,
                    paymentMethodId: paymentMethodId
                })
            });

            const text = await response.text();
            console.log("RAW RESPONSE:", text);

            let result;

            try {
                result = JSON.parse(text);
            } catch (e) {
                console.error("Response is not JSON:", text);
                alert("Server error occurred.");
                btn.disabled = false;
                return;
            }

            if (!response.ok) {
                console.log("ERROR RESPONSE:", result);

                alert(result.message || result.error || "Payment failed.");
                btn.disabled = false;
                return;
            }

            // =========================
            // SUCCESS
            // =========================
            if (paymentMethod === "ONLINE_PAYMENT") {

                alert("Order placed successfully! Process to Details >");
                window.location.href = "/shop/cart/ordersummary/" + result.checkoutId;

            } else {

                alert("Order placed successfully! Process to Details >");
                window.location.href = "/shop/cart/ordersummary/" + result.checkoutId;
            }

        } catch (err) {
            console.error("Checkout error:", err);
            alert("Something went wrong.");
            btn.disabled = false;
        }
    });



/// Toggle Online Payment Entries
//  Toggle Online Payment UI
document.querySelectorAll(".payment-option").forEach(radio => {
    radio.addEventListener("change", togglePaymentUI);
});

function togglePaymentUI() {

    const selected = document.querySelector('input[name="paymentMethod"]:checked')?.value;

    const section = document.getElementById("onlinePaymentSection");

    const inputs = [
        document.getElementById("cardNumber"),
        document.getElementById("expMonth"),
        document.getElementById("expYear"),
        document.getElementById("cvc")
    ];

    if (selected === "ONLINE_PAYMENT") {

        section.style.display = "block";

        inputs.forEach(i => i.disabled = false);

    } else {

        section.style.display = "none";

        inputs.forEach(i => {
            i.disabled = true;
            i.value = "";
        });
    }
}