let selectedOrderId = null;
let finalReason = "";

document.addEventListener("DOMContentLoaded", () => {

    const sortSelect = document.getElementById("sortSelect");

    // Existing logic
    if (sortSelect) {
        initTabs();
        initSort(sortSelect);

        const defaultTab = document.querySelector(".tab.active");
        if (defaultTab) {
            loadTab(defaultTab.dataset.tab, sortSelect.value);
        }
    }

    // Handle dropdown change (ONLY ONE LISTENER)
    const select = document.getElementById("cancelReasonSelect");
    const textarea = document.getElementById("cancelOtherReason");

    if (select && textarea) {
        select.addEventListener("change", function () {
            if (this.value === "Others") {
                textarea.classList.remove("hidden");
            } else {
                textarea.classList.add("hidden");
                textarea.value = "";
            }
        });
    }
});



function initTabs() {
    document.querySelectorAll(".tab").forEach(tab => {
        tab.addEventListener("click", () => {

            document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
            tab.classList.add("active");

            const sort = document.getElementById("sortSelect").value;
            loadTab(tab.dataset.tab, sort);
        });
    });
}

function initSort(sortSelect) {
    sortSelect.addEventListener("change", () => {
        const activeTab = document.querySelector(".tab.active");
        loadTab(activeTab.dataset.tab, sortSelect.value);
    });
}

function loadTab(tabKey, sort) {

    switch (tabKey) {
        case "ForConfirmation":
            loadForConfirmOrders(sort);
            break;

        case "Processing":
            loadProcessingOrders(sort);
            break;

        case "ToShip":
            loadToShipOrders(sort);
            break;

        case "InTransit":
            loadInTransitOrders(sort);
            break;

        case "Completed":
            loadDeliveredOrders(sort);
            break;

        case "Cancelled":
            loadCancelledOrders(sort);
            break;

        case "Rejected":
            loadRejectedOrders(sort);
            break;
    }
}

async function fetchAndRender(url, renderFn) {
    const container = document.getElementById("ordersList");

    try {
        container.innerHTML = getSkeletonLoader();

        const res = await fetch(url);
        const result = await res.json();

        container.innerHTML = "";

        if (!result.data || result.data.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted mt-4">
                    No orders found.
                </div>
            `;
            return;
        }

        renderFn(result.data);

    } catch (err) {
        console.error(err);
        container.innerHTML = `
            <div class="text-danger text-center mt-4">
                Failed to load orders.
            </div>
        `;
    }
}


//render "Pending_Confirmation" status
function renderForConfirmOrders(data) {
    const container = document.getElementById("ordersList");

    container.innerHTML = ""; // clear before render

    // Empty State
    if (!data || data.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted mt-4">
                No orders found.
            </div>
        `;
        return;
    }

    // Render Cards
    data.forEach(order => {
        const card = document.createElement("div");
        card.classList.add("order-card");

        // 🔥 build product list
        let itemsHtml = "";

        if (order.items && order.items.length > 0) {
            itemsHtml = order.items.map(item => `
                <div class="product-item">
                    <div class="product-name">
                        ${item.productManufacturer ?? ""} 
                        ${item.productSeries ?? ""} 
                        ${item.productModel ?? ""}
                    </div>
                    <div class="product-sub">
                        SKU: ${item.productSku ?? "N/A"}
                    </div>
                    <div class="product-sub">
                        Quantity: ${item.qty} × ₱${formatPrice(item.productPrice)}
                    </div>
                </div>
            `).join("");
        } else {
            itemsHtml = `<div class="text-muted">No items</div>`;
        }



        card.innerHTML = `

            <div class="order-section-header">
                <svg class="status-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                        d="M12 6v6l4 2M12 2a10 10 0 100 20 10 10 0 000-20z" />
                </svg>
                Waiting for Confirmation
            </div>
            <span class="label">
                We're reviewing your order right now. You'll receive a confirmation shortly.
                If you have questions, feel free to chat with our support team.
            </span>

                <div class="order-main">

                    <!-- LEFT -->
                    <div class="order-left">

   
                        <div class="order-section-title">Order Info</div>

                        <div class="order-row">
                            <span class="label">Transaction Code:</span>
                            <span class="value">${order.transactionCode}</span>
                        </div>

                        <div class="order-row">
                            <span class="label">Customer Name:</span>
                            <span class="value">${order.customerName}</span>
                        </div>

                        <div class="order-row">
                            <span class="label">Payment Method:</span>
                            <span class="value">${order.paymentMethod}</span>
                        </div>

                        <div class="order-row">
                            <span class="label">Shipping Method:</span>
                            <span class="value">${order.shippingMethod}</span>
                        </div>

                        <div class="order-row">
                            <span class="label">Order Placed:</span>
                            <span class="value">${formatDate(order.createdAt)}</span>
                        </div>
                    </div>

                    <!-- RIGHT -->
                    <div class="order-right">
                        <div class="order-section-title">Products</div>

                        <div class="product-list">
                            ${itemsHtml}
                        </div>
                    </div>

                </div>

                <!-- BOTTOM -->
                <div class="order-bottom">

                    <div class="order-price">
                        ₱ ${formatPrice(order.grandTotal)}
                    </div>

                    <div class="order-footer-new">

                <div class="order-footer-new">
                    <button class="btn btn-sm btn-primary" onclick="openViewDetails(${order.id})">
                        View Details
                    </button>
                </div>

                    <button onclick="openCancelModal(${order.id})">
                        Cancel Order
                    </button>
                    </div>

                </div>
                `;

        container.appendChild(card);
    });
}

//render Processing
function renderProcessingOrders(data) {
    const container = document.getElementById("ordersList");

    container.innerHTML = "";

    // Empty State
    if (!data || data.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted mt-4">
                No orders found.
            </div>
        `;
        return;
    }

    data.forEach(order => {
        const card = document.createElement("div");
        card.classList.add("order-card");

        // 🔥 build product list
        let itemsHtml = "";

        if (order.items && order.items.length > 0) {
            itemsHtml = order.items.map(item => `
                <div class="product-item">
                    <div class="product-name">
                        ${item.productManufacturer ?? ""} 
                        ${item.productSeries ?? ""} 
                        ${item.productModel ?? ""}
                    </div>
                    <div class="product-sub">
                        SKU: ${item.productSku ?? "N/A"}
                    </div>
                    <div class="product-sub">
                        Quantity: ${item.qty} × ₱${formatPrice(item.productPrice)}
                    </div>
                </div>
            `).join("");
        } else {
            itemsHtml = `<div class="text-muted">No items</div>`;
        }

        // 
        card.innerHTML = `

            <div class="order-section-header">
                <svg class="status-icon spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                        d="M4 4v5h.582M20 20v-5h-.581M5.423 9A7.001 7.001 0 0119 12a7.001 7.001 0 01-13.577 3" />
                </svg>
                Processing
            </div>

            <span class="label">
                We're working on your order right now. Sit tight—we'll keep you posted on the progress.
            </span>

            <div class="order-main">

                <!-- LEFT -->
                <div class="order-left">
                    <div class="order-section-title">Order Info</div>

                    <div class="order-row">
                        <span class="label">Transaction Code:</span>
                        <span class="value">${order.transactionCode}</span>
                    </div>

                    <div class="order-row">
                        <span class="label">Customer Name:</span>
                        <span class="value">${order.customerName}</span>
                    </div>

                    <div class="order-row">
                        <span class="label">Payment Method:</span>
                        <span class="value">${order.paymentMethod}</span>
                    </div>

                    <div class="order-row">
                        <span class="label">Shipping Method:</span>
                        <span class="value">${order.shippingMethod}</span>
                    </div>

                    <div class="order-row">
                        <span class="label">Order Placed:</span>
                        <span class="value">${formatDate(order.createdAt)}</span>
                    </div>

                    <div class="order-row">
                        <span class="label">Date Confirmed:</span>
                        <span class="value">${formatDate(order.dateConfirmed)}</span>
                    </div>
                </div>

                <!-- RIGHT -->
                <div class="order-right">
                    <div class="order-section-title">Products</div>

                    <div class="product-list">
                        ${itemsHtml}
                    </div>
                </div>

            </div>

            <!-- BOTTOM -->
            <div class="order-bottom">
                <div class="order-price">
                    ₱ ${formatPrice(order.grandTotal)}
                </div>

                <div class="order-footer-new">

                <div class="order-footer-new">
                    <button class="btn btn-sm btn-primary" onclick="openViewDetails(${order.id})">
                        View Details
                    </button>
                </div>
                    <button onclick="openCancelModal(${order.id})">
                        Cancel Order


                    </button>
                </div>
            </div>
        `;

        container.appendChild(card);
    });
}


//// To ship
function renderToShipOrders(response) {
    const container = document.getElementById("ordersList");

    container.innerHTML = "";

    const data = response.data;

    // Empty state
    if (!data || data.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted mt-4">
                No orders to ship.
            </div>
        `;
        return;
    }

    data.forEach(order => {
        const card = document.createElement("div");
        card.classList.add("order-card");

        // 🔹 Build product list
        let itemsHtml = "";

        if (order.items && order.items.length > 0) {
            itemsHtml = order.items.map(item => `
                <div class="product-item">
                    <div class="product-name">
                        ${item.productManufacturer ?? ""} 
                        ${item.productSeries ?? ""} 
                        ${item.productModel ?? ""}
                    </div>
                    <div class="product-sub">
                        SKU: ${item.productSku ?? "N/A"}
                    </div>
                    <div class="product-sub">
                        Quantity: ${item.qty} × ₱${formatPrice(item.productPrice)}
                    </div>
                </div>
            `).join("");
        } else {
            itemsHtml = `<div class="text-muted">No items</div>`;
        }

        // 🔹 Card UI
        card.innerHTML = `

        <div class="order-section-header">
            <svg class="status-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                    d="M3 7h13v10H3V7zm13 3h3l2 3v4h-5v-7zM7 20a2 2 0 100-4 2 2 0 000 4zm10 0a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
            To Ship
        </div>

        <span class="label">
            Your order has been prepared and is ready for shipment. You’ll receive an update once it’s dispatched.
        </span>

            <div class="order-main">

                <!-- LEFT -->
                <div class="order-left">
                    <div class="order-section-title">Shipping Info</div>

                    <div class="order-row">
                        <span class="label">Transaction Code:</span>
                        <span class="value">${order.transactionCode}</span>
                    </div>

                    <div class="order-row">
                        <span class="label">Courier:</span>
                        <span class="value">${order.courier ?? "Pending"}</span>
                    </div>

                    <div class="order-row">
                        <span class="label">Schedule:</span>
                        <span class="value">
                            ${order.scheduledDate ? formatDate(order.scheduledDate) : "Not Scheduled"}
                        </span>
                    </div>

                    <div class="order-row">
                        <span class="label">Shipping Method:</span>
                        <span class="value">${order.shippingMethod}</span>
                    </div>

                    <div class="order-row">
                        <span class="label">Delivery Address:</span>
                        <span class="value">${order.deliveryAddress}</span>
                    </div>
                </div>

                <!-- RIGHT -->
                <div class="order-right">
                    <div class="order-section-title">Products</div>

                    <div class="product-list">
                        ${itemsHtml}
                    </div>
                </div>

            </div>

            <!-- BOTTOM -->
            <div class="order-bottom">
                <div class="order-price">
                    ₱ ${formatPrice(order.grandTotal)}
                </div>

                <div class="order-footer-new">
                    <button class="btn btn-sm btn-primary" onclick="openViewDetails(${order.id})">
                        View Details
                    </button>
                </div>
            </div>
        `;

        container.appendChild(card);
    });
}


//In Transit Orders
function renderInTransitOrders(response) {
    const container = document.getElementById("ordersList");

    container.innerHTML = "";

    const data = response.data;

    // Empty state
    if (!data || data.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted mt-4">
                No orders to ship.
            </div>
        `;
        return;
    }

    data.forEach(order => {
        const card = document.createElement("div");
        card.classList.add("order-card");

        // 🔹 Build product list
        let itemsHtml = "";

        if (order.items && order.items.length > 0) {
            itemsHtml = order.items.map(item => `
                <div class="product-item">
                    <div class="product-name">
                        ${item.productManufacturer ?? ""} 
                        ${item.productSeries ?? ""} 
                        ${item.productModel ?? ""}
                    </div>
                    <div class="product-sub">
                        SKU: ${item.productSku ?? "N/A"}
                    </div>
                    <div class="product-sub">
                        Quantity: ${item.qty} × ₱${formatPrice(item.productPrice)}
                    </div>
                </div>
            `).join("");
        } else {
            itemsHtml = `<div class="text-muted">No items</div>`;
        }

        // 🔹 Card UI
        card.innerHTML = `

        <div class="order-section-header">
                <svg class="status-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                        d="M3 10h11M9 21a2 2 0 100-4 2 2 0 000 4zm9 0a2 2 0 100-4 2 2 0 000 4zm-9-7h6l3-5H6l3 5z" />
                </svg>
                In Transit
            </div>

            <span class="label">
                 Your order is currently in transit and heading to your location. When it arrives, please take a moment to check that everything is in good condition.
            </span>
            <div class="order-main">

                <!-- LEFT -->
                <div class="order-left">
                    <div class="order-section-title">Shipping Info</div>

                    <div class="order-row">
                        <span class="label">Transaction Code:</span>
                        <span class="value">${order.transactionCode}</span>
                    </div>

                    <div class="order-row">
                        <span class="label">Courier:</span>
                        <span class="value">${order.courier ?? "Pending"}</span>
                    </div>

                    <div class="order-row">
                        <span class="label">Schedule:</span>
                        <span class="value">
                            ${order.scheduledDate ? formatDate(order.scheduledDate) : "Not Scheduled"}
                        </span>
                    </div>

                    <div class="order-row">
                        <span class="label">Shipping Method:</span>
                        <span class="value">${order.shippingMethod}</span>
                    </div>

                    <div class="order-row">
                        <span class="label">Delivery Address:</span>
                        <span class="value">${order.deliveryAddress}</span>
                    </div>

                     <div class="order-row">
                        <span class="label">In Transit:</span>
                        <span class="value">${ formatDate(order.inTransitAt)}</span>
                    </div>
                </div>

                <!-- RIGHT -->
                <div class="order-right">
                    <div class="order-section-title">Products</div>

                    <div class="product-list">
                        ${itemsHtml}
                    </div>
                </div>

            </div>

            <!-- BOTTOM -->
            <div class="order-bottom">
                <div class="order-price">
                    ₱ ${formatPrice(order.grandTotal)}
                </div>


                <div class="order-footer-new">
                    <button class="btn btn-sm btn-primary" onclick="openViewDetails(${order.id})">
                        View Details
                    </button>
                </div>
            </div>
        `;

        container.appendChild(card);
    });
}



//successfully delivered
function renderDeliveredOrders(response) {
    const container = document.getElementById("ordersList");

    container.innerHTML = "";

    const data = response.data;

    if (!data || data.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted mt-4">
                No orders to ship.
            </div>
        `;
        return;
    }

    data.forEach(order => {
        const card = document.createElement("div");
        card.classList.add("order-card");

        let itemsHtml = "";

        if (order.items && order.items.length > 0) {
            itemsHtml = order.items.map(item => `
                <div class="product-item">
                    <div class="product-name">
                        ${item.productManufacturer ?? ""} 
                        ${item.productSeries ?? ""} 
                        ${item.productModel ?? ""}
                    </div>
                    <div class="product-sub">
                        SKU: ${item.productSku ?? "N/A"}
                    </div>
                    <div class="product-sub">
                        Quantity: ${item.qty} × ₱${formatPrice(item.productPrice)}
                    </div>
                </div>
            `).join("");
        } else {
            itemsHtml = `<div class="text-muted">No items</div>`;
        }

        card.innerHTML = `
        <div class="order-section-header">
            <svg class="status-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                    d="M5 13l4 4L19 7" />
            </svg>
            Completed
        </div>

        <span class="label">
            Your order has been delivered. Please check that everything is in good condition, and let us know if you need any assistance.
        </span>

        <div class="order-main">
            <div class="order-left">
                <div class="order-section-title">Shipping Info</div>

                <div class="order-row">
                    <span class="label">Transaction Code:</span>
                    <span class="value">${order.transactionCode}</span>
                </div>

                <div class="order-row">
                    <span class="label">Courier:</span>
                    <span class="value">${order.courier ?? "Pending"}</span>
                </div>

                <div class="order-row">
                    <span class="label">Schedule:</span>
                    <span class="value">
                        ${order.scheduledDate ? formatDate(order.scheduledDate) : "Not Scheduled"}
                    </span>
                </div>

                <div class="order-row">
                    <span class="label">Shipping Method:</span>
                    <span class="value">${order.shippingMethod}</span>
                </div>

                <div class="order-row">
                    <span class="label">Delivery Address:</span>
                    <span class="value">${order.deliveryAddress}</span>
                </div>

                <div class="order-row">
                    <span class="label">Delivered At:</span>
                    <span class="value">
                        ${order.deliveredAt ? formatDate(order.deliveredAt) : "N/A"}
                    </span>
                </div>
            </div>

            <div class="order-right">
                <div class="order-section-title">Products</div>
                <div class="product-list">
                    ${itemsHtml}
                </div>
            </div>
        </div>

        <div class="order-bottom">
            <div class="order-price">
                ₱ ${formatPrice(order.grandTotal)}
            </div>

            <div class="order-footer-new" style="display:flex; gap:10px;">

                ${order.isRated ? `
                    <button class="btn btn-sm btn-secondary" disabled>
                        Already Rated
                    </button>
                ` : `
                    <button class="btn btn-sm btn-primary" onclick="openSetRating(${order.id})">
                        Send Rating
                    </button>
                `}

                <button class="btn btn-sm btn-primary" onclick="openViewDetails(${order.id})">
                    View Details
                </button>

            </div>
        </div>
        `;

        container.appendChild(card);
    });
}



///Rejected Purchase by the Airconi
function renderRejectedOrders(data) {
    const container = document.getElementById("ordersList");

    container.innerHTML = ""; // clear before render

    // Empty State
    if (!data || data.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted mt-4">
                No orders found.
            </div>
        `;
        return;
    }

    // Render Cards
    data.forEach(order => {
        const card = document.createElement("div");
        card.classList.add("order-card");

        // 🔥 build product list
        let itemsHtml = "";

        if (order.items && order.items.length > 0) {
            itemsHtml = order.items.map(item => `
                <div class="product-item">
                    <div class="product-name">
                        ${item.productManufacturer ?? ""} 
                        ${item.productSeries ?? ""} 
                        ${item.productModel ?? ""}
                    </div>
                    <div class="product-sub">
                        SKU: ${item.productSku ?? "N/A"}
                    </div>
                    <div class="product-sub">
                        Quantity: ${item.qty} × ₱${formatPrice(item.productPrice)}
                    </div>
                </div>
            `).join("");
        } else {
            itemsHtml = `<div class="text-muted">No items</div>`;
        }



        card.innerHTML = `
        <div class="order-section-header">
                <svg class="status-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                        d="M6 18L18 6M6 6l12 12" />
                </svg>
                Not Approved
            </div>

            <span class="label">
                We’re sorry, but your order could not be approved. If you have questions or need assistance, feel free to contact our support team.
            </span>

                <div class="order-main">

                    <!-- LEFT -->
                    <div class="order-left">

   
                        <div class="order-section-title">Order Info</div>

                        <div class="order-row">
                            <span class="label">Transaction Code:</span>
                            <span class="value">${order.transactionCode}</span>
                        </div>

                        <div class="order-row">
                            <span class="label">Customer Name:</span>
                            <span class="value">${order.customerName}</span>
                        </div>

                        <div class="order-row">
                            <span class="label">Payment Method:</span>
                            <span class="value">${order.paymentMethod}</span>
                        </div>

                        <div class="order-row">
                            <span class="label">Shipping Method:</span>
                            <span class="value">${order.shippingMethod}</span>
                        </div>

                        <div class="order-row">
                            <span class="label">Order Placed:</span>
                            <span class="value">${formatDate(order.createdAt)}</span>
                        </div>

                         <div class="order-row">
                            <span class="label">Rejected At:</span>
                            <span class="value">${formatDate(order.rejectedAt)}</span>
                        </div>
                    </div>

                    <!-- RIGHT -->
                    <div class="order-right">
                        <div class="order-section-title">Products</div>

                        <div class="product-list">
                            ${itemsHtml}
                        </div>
                    </div>
                </div>

                <!-- BOTTOM -->
                <div class="order-bottom">

                    <div class="order-price">
                        ₱ ${formatPrice(order.grandTotal)}
                    </div>


                <div class="order-footer-new">
                    <button class="btn btn-sm btn-primary" onclick="openViewDetails(${order.id})">
                        View Details
                    </button>
                </div>

                </div>
                `;

        container.appendChild(card);
    });
}



//Cancelled Orders
function renderCancelledOrders(data) {
    const container = document.getElementById("ordersList");

    container.innerHTML = "";

    // Empty State
    if (!data || data.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted mt-4">
                No orders found.
            </div>
        `;
        return;
    }

    data.forEach(order => {
        const card = document.createElement("div");
        card.classList.add("order-card");

        // 🔥 PRODUCT LIST
        let itemsHtml = "";

        if (order.items && order.items.length > 0) {
            itemsHtml = order.items.map(item => `
                <div class="product-item">
                    <div class="product-name">
                        ${item.productManufacturer ?? ""} 
                        ${item.productSeries ?? ""} 
                        ${item.productModel ?? ""}
                    </div>
                    <div class="product-sub">
                        SKU: ${item.productSku ?? "N/A"}
                    </div>
                    <div class="product-sub">
                        Quantity: ${(item.qty ?? item.quantity ?? 0)} × ₱${formatPrice(item.productPrice ?? 0)}
                    </div>
                </div>
            `).join("");
        } else {
            itemsHtml = `<div class="text-muted">Items not available</div>`;
        }

        // 🔥 REFUND MESSAGE (optional)
        const refundMessage = order.status === "CANCELLED_FOR_REFUND"
            ? `<span class="label text-warning">Refund is currently being processed.</span>`
            : "";

        card.innerHTML = `
            <div class="order-section-header">
                <svg class="status-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                        d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancelled
            </div>

            <span class="label">
                This order has been cancelled. If you have any questions or need assistance, feel free to contact our support team.
            </span>

            ${refundMessage}

            <div class="order-main">

                <!-- LEFT -->
                <div class="order-left">

                    <div class="order-section-title">Order Info</div>

                    <div class="order-row">
                        <span class="label">Transaction Code:</span>
                        <span class="value">${order.transactionCode ?? "N/A"}</span>
                    </div>

                    <div class="order-row">
                        <span class="label">Customer Name:</span>
                        <span class="value">${order.customerName ?? "N/A"}</span>
                    </div>

                    <div class="order-row">
                        <span class="label">Payment Method:</span>
                        <span class="value">${order.paymentMethod ?? "N/A"}</span>
                    </div>

                    <div class="order-row">
                        <span class="label">Shipping Method:</span>
                        <span class="value">${order.shippingMethod ?? "N/A"}</span>
                    </div>

                    <div class="order-row">
                        <span class="label">Order Placed:</span>
                        <span class="value">
                            ${order.createdAt ? formatDate(order.createdAt) : "N/A"}
                        </span>
                    </div>

                    <div class="order-row">
                        <span class="label">Cancelled At:</span>
                        <span class="value">
                            ${order.cancelledAt ? formatDate(order.cancelledAt) : "N/A"}
                        </span>
                    </div>

                    <div class="order-row">
                        <span class="label">Cancellation Reason:</span>
                        <span class="value">
                            ${order.cancellationReason ?? "Not specified"}
                        </span>
                    </div>

                </div>

                <!-- RIGHT -->
                <div class="order-right">
                    <div class="order-section-title">Products</div>

                    <div class="product-list">
                        ${itemsHtml}
                    </div>
                </div>

            </div>

            <!-- BOTTOM -->
            <div class="order-bottom">

                <div class="order-price">
                    ₱ ${order.grandTotal ? formatPrice(order.grandTotal) : "0.00"}
                </div>

                <div class="order-footer-new">
                    <button class="btn btn-sm btn-primary" onclick="openViewDetails(${order.id})">
                        View Details
                    </button>
                </div>

            </div>
        `;

        container.appendChild(card);
    });
}



function formatPrice(amount) {
    return Number(amount).toLocaleString("en-PH", {
        minimumFractionDigits: 2
    });
}

function formatDate(date) {
    return new Date(date).toLocaleString();
}

function getSkeletonLoader(count = 3) {
    let html = "";

    for (let i = 0; i < count; i++) {
        html += `<div class="order-card skeleton"></div>`;
    }

    return html;
}


/// Fetches
async function loadForConfirmOrders(sort) {
    await fetchAndRender(`/api/my-shop-orders/my-purchases?status=PENDING_CONFIRMATION&sortBy=${sort}`, renderForConfirmOrders);
}

async function loadProcessingOrders(sort) {
    await fetchAndRender(`/api/my-shop-orders/my-purchases-processing?status=CONFIRMED&sortBy=${sort}`, renderProcessingOrders);  
}

async function loadToShipOrders(sort) {
    const res = await fetch(`/api/my-shop-orders/my-purchases-to-ship?status=BOOKED&sortBy=${sort}`);
    const data = await res.json();
    renderToShipOrders(data);
}

async function loadInTransitOrders(sort) {
    const res = await fetch(`/api/my-shop-orders/my-purchases-in-transit?status=IN_TRANSIT&sortBy=${sort}`);
    const data = await res.json();
    renderInTransitOrders(data);
}

async function loadDeliveredOrders(sort) {
    const res = await fetch(`/api/my-shop-orders/my-purchases-delivered?status=DELIVERED&sortBy=${sort}`);
    const data = await res.json();
    renderDeliveredOrders(data);
}

async function loadCancelledOrders(sort) {
    await fetchAndRender(`/api/my-shop-orders/my-purchases-cancelled-orders?sortBy=${sort}`, renderCancelledOrders);
}

async function loadRejectedOrders(sort) {
    await fetchAndRender(`/api/my-shop-orders/my-purchases-rejected?status=REJECTED&sortBy=${sort}`, renderRejectedOrders);
}



// Open modal
function openCancelModal(orderId) {
    selectedOrderId = orderId;

    const select = document.getElementById("cancelReasonSelect");
    const textarea = document.getElementById("cancelOtherReason");

    // Reset state
    select.value = "";
    textarea.value = "";
    textarea.classList.add("hidden");

    document.getElementById("cancelModal").classList.remove("hidden");
}

// Close modal
function closeCancelModal() {
    document.getElementById("cancelModal").classList.add("hidden");
}

// Handle dropdown change
document.getElementById("cancelReasonSelect").addEventListener("change", function () {
    const textarea = document.getElementById("cancelOtherReason");

    if (this.value === "Others") {
        textarea.classList.remove("hidden");
    } else {
        textarea.classList.add("hidden");
        textarea.value = ""; // ✅ clear when not needed
    }
});

// Step 1 → proceed
function proceedCancel() {
    const selectEl = document.getElementById("cancelReasonSelect");
    const textarea = document.getElementById("cancelOtherReason");

    const selected = (selectEl.value || "").trim();
    const other = (textarea.value || "").trim();

    console.log("Selected:", selected);
    console.log("Other:", other);

    if (selected === "") {
        alert("Please select a reason.");
        return;
    }

    let reason;

    // Only require textarea if "Others"
    if (selected === "Others") {
        if (other === "") {
            alert("Please type your reason.");
            return;
        }
        reason = other;
    } else {
        reason = selected;
    }

    finalReason = reason;

    console.log("FINAL REASON:", finalReason);

    // Move to confirmation modal
    closeCancelModal();
    document.getElementById("confirmModal").classList.remove("hidden");
}


// Close confirm
function closeConfirmModal() {
    document.getElementById("confirmModal").classList.add("hidden");
}
// Step 2 → confirm
async function confirmCancel() {
    try {
        console.log("Sending cancel request for:", selectedOrderId);
        console.log("Reason:", finalReason);

        const res = await fetch(`/api/my-shop-orders/${selectedOrderId}/cancel`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                cancellationReason: finalReason
            })
        });

        if (!res.ok) {
            const err = await res.text();
            console.error("API Error:", err);
            alert(err);
            return;
        }

        alert("Order cancelled successfully");

        closeConfirmModal();
        location.reload();

    } catch (error) {
        console.error("Fetch Error:", error);
        alert("Something went wrong.");
    }
}


////// Summary Modal

async function openViewDetails(transactionId) {
    try {
        const res = await fetch(`/api/my-shop-orders/${transactionId}/view-summary`);

        if (!res.ok) {
            alert("Failed to load details");
            return;
        }

        const data = await res.json();

        renderOrderDetails(data);

        document.getElementById("viewDetailsModal").classList.remove("hidden");

    } catch (err) {
        console.error(err);
    }
}

function closeViewDetailsModal() {
    document.getElementById("viewDetailsModal").classList.add("hidden");
}

function renderOrderDetails(order) {
    const container = document.getElementById("orderDetailsContent");

    if (!order) {
        container.innerHTML = `<div class="text-muted">No data found.</div>`;
        return;
    }

    // 🔥 GROUP ITEMS BY PRODUCT
    const grouped = {};

    (order.items || []).forEach(item => {
        const key = item.productSku || "unknown";

        if (!grouped[key]) {
            grouped[key] = {
                productBrand: item.productBrand,
                productSeries: item.productSeries,
                productModel: item.productModel,
                productSku: item.productSku,
                quantity: item.quantity,
                productPrice: item.productPrice,
                serials: []
            };
        }

        if (item.serialNumber) {
            grouped[key].serials.push(item.serialNumber);
        }
    });

    // 🔥 BUILD ITEMS HTML
    let itemsHtml = "";

    Object.values(grouped).forEach(item => {
        let serialsHtml = item.serials.length > 0
            ? `
                <div class="serial-list">
                    <div class="serial-title">Serial Numbers</div>
                    ${item.serials.map(sn => `<div class="serial">• ${sn}</div>`).join("")}
                </div>
              `
            : `<div class="serial text-muted">No serial assigned yet</div>`;

        itemsHtml += `
            <div class="product-card">
                <div class="product-name">
                    ${item.productBrand || ""} 
                    ${item.productSeries || ""} 
                    ${item.productModel || ""}
                </div>

                <div class="product-sub">SKU: ${item.productSku || "N/A"}</div>
                <div class="product-sub">Quantity: ${item.quantity ?? 0}</div>
                <div class="product-sub">Price: ₱${formatPrice(item.productPrice ?? 0)}</div>

                ${serialsHtml}
            </div>
        `;
    });

    // 🔥 FINAL LAYOUT
    container.innerHTML = `
        <div class="order-grid">

            <!-- LEFT: BASIC INFO -->
            <div class="order-section">
                <div class="order-section-title">Basic Info</div>

                <div class="order-row">
                    <span class="label">Transaction Code:</span>
                    <span class="value">${order.transactionCode || "N/A"}</span>
                </div>

                <div class="order-row">
                    <span class="label">Status:</span>
                    <span class="value">${order.status}</span>
                </div>

                <div class="order-row">
                    <span class="label">Order Date:</span>
                    <span class="value">
                        ${order.createdAt ? formatDate(order.createdAt) : "N/A"}
                    </span>
                </div>

                <div class="order-row">
                    <span class="label">Total:</span>
                    <span class="value">
                        ₱${formatPrice(order.grandTotal ?? 0)}
                    </span>
                </div>
            </div>

            <!-- RIGHT: DELIVERY INFO -->
            <div class="order-section">
                <div class="order-section-title">Delivery Info</div>

                <div class="order-row">
                    <span class="label">Shipping Method:</span>
                    <span class="value">${order.shippingMethod || "N/A"}</span>
                </div>

                <div class="order-row">
                    <span class="label">Payment Method:</span>
                    <span class="value">${order.paymentMethod || "N/A"}</span>
                </div>

                <div class="order-row">
                    <span class="label">Payment Status:</span>
                    <span class="value">${order.paymentStatus || "N/A"}</span>
                </div>

                <div class="order-row">
                    <span class="label">Delivered At:</span>
                    <span class="value">
                        ${order.deliveredAt ? formatDate(order.deliveredAt) : "Not delivered yet"}
                    </span>
                </div>
            </div>

        </div>

        <!-- FULL WIDTH ITEMS -->
        <div class="order-section mt-3">
            <div class="order-section-title">Items</div>
            ${itemsHtml || `<div class="text-muted">No items available</div>`}
        </div>
    `;
}


////////////////             Rating Modal             //////////////

let currentTransactionId = null;

async function openSetRating(transactionId) {
    currentTransactionId = transactionId;

    const res = await fetch(`/api/my-shop-orders/${transactionId}/view-summary`);
    const order = await res.json();

    console.log("RATING DATA:", order);

    // 🔥 SAFE ACCESS
    const items = order.items || order.data?.items || [];

    renderRatingItems(items);

    document.getElementById("ratingModal").classList.remove("hidden");
}

//RENDER ITEMS WITH STARS
function renderRatingItems(items) {
    const container = document.getElementById("ratingContent");

    if (!items || items.length === 0) {
        container.innerHTML = `<div class="text-muted">No items found.</div>`;
        return;
    }

    container.innerHTML = items.map(item => `
        <div class="rating-item">

            <!-- PRODUCT INFO -->
            <div class="product-name">
                ${[item.productBrand, item.productSeries, item.productModel]
            .filter(Boolean)
            .join(" ")}
            </div>

            <div class="product-sub">
                SKU: ${item.productSku ?? "N/A"} • Qty: ${item.quantity}
            </div>

            <!-- STARS -->
            <div class="stars" data-product="${item.productId}">
                ${[1, 2, 3, 4, 5].map(i => `
                    <span class="star" data-value="${i}">★</span>
                `).join("")}
            </div>

            <!-- COMMENT -->
            <textarea class="rating-comment"
                data-product="${item.productId}"
                maxlength="200"
                placeholder="Share your experience (optional)..."></textarea>

        </div>
    `).join("");

    bindStars();
}



//
function bindStars() {
    document.querySelectorAll(".stars").forEach(group => {
        const stars = group.querySelectorAll(".star");

        stars.forEach(star => {
            star.addEventListener("click", () => {
                const value = parseInt(star.dataset.value);

                group.dataset.selected = value;

                stars.forEach(s => {
                    s.classList.toggle("active", s.dataset.value <= value);
                });
            });
        });
    });
}

///Submit ratings
async function submitRatings() {
    const items = document.querySelectorAll(".rating-item");

    for (let item of items) {
        const stars = item.querySelector(".stars");
        const productId = stars.dataset.product;
        const rating = stars.dataset.selected;
        const comment = item.querySelector(".rating-comment").value;

        if (!rating) {
            alert("Please rate all items.");
            return;
        }

        const res = await fetch("/api/my-shop-ratings/customer-transaction-ratings", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                transactionId: currentTransactionId,
                productId: parseInt(productId),
                rating: parseInt(rating),
                comment: comment
            })
        });

        if (!res.ok) {
            const err = await res.text();
            alert(err);
            return;
        }
    }

    alert("Ratings submitted!");

    closeRatingModal();
    location.reload();
}

//Close Rating
function closeRatingModal() {
    document.getElementById("ratingModal").classList.add("hidden");
}