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

                        <button class="btn btn-sm btn-primary"
                                onclick="openViewDetails(${order.id})">

                            View Details

                        </button>

                        <button class="cancel-order-btn"
                                onclick="openCancelModal(${order.id})">

                            <i class="bi bi-x-circle"></i>

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
                    <button class="cancel-order-btn"
                                onclick="openCancelModal(${order.id})">

                            <i class="bi bi-x-circle"></i>

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

                <!-- OUTRIGHT WARRANTY -->

                ${order.isOutrightReplacementEligible
                            ? `
                        <button class="btn btn-sm btn-danger"
                                onclick="openWarrantyClaim(${order.id})">

                            Claim Warranty
                            (${order.remainingWarrantyDays}
                            Day${order.remainingWarrantyDays !== 1 ? "s" : ""} Left)

                        </button>
                    `
                            : `
                        <button class="btn btn-sm btn-secondary"
                                disabled>

                            Warranty Expired

                        </button>
                    `
                }

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

    const container =
        document.getElementById(
            "orderDetailsContent"
        );

    if (!order) {

        container.innerHTML = `
            <div class="text-muted">
                No data found.
            </div>
        `;

        return;
    }



    // =====================================
    // GROUP ITEMS BY PRODUCT
    // =====================================

    const grouped = {};

    (order.items || []).forEach(item => {

        const key =
            item.productSku || "unknown";

        if (!grouped[key]) {

            grouped[key] = {

                productBrand:
                    item.productBrand,

                productSeries:
                    item.productSeries,

                productModel:
                    item.productModel,

                productSku:
                    item.productSku,

                quantity:
                    item.quantity,

                productPrice:
                    item.productPrice,

                serials: []
            };
        }

        if (item.serialNumber) {

            grouped[key]
                .serials
                .push(item.serialNumber);
        }
    });



    // =====================================
    // BUILD ITEMS HTML
    // =====================================

    let itemsHtml = "";

    Object.values(grouped).forEach(item => {

        let serialsHtml =
            item.serials.length > 0

                ? `
                    <div class="serial-list">

                        <div class="serial-title">
                            Serial Numbers
                        </div>

                        ${item.serials
                    .map(sn => `
                                <div class="serial">
                                    • ${sn}
                                </div>
                            `).join("")}

                    </div>
                `

                : `
                    <div class="serial text-muted">
                        No serial assigned yet
                    </div>
                `;



        itemsHtml += `

    <div class="modern-product-card">

        <!-- TOP -->

        <div class="modern-product-header">

            <div>

                <div class="modern-product-title">

                    ${item.productBrand || ""}

                    ${item.productSeries || ""}

                    ${item.productModel || ""}

                </div>

                <div class="modern-product-sku">

                    SKU:
                    ${item.productSku || "N/A"}

                </div>

            </div>

            <div class="modern-product-price">

                ₱${formatPrice(
            item.productPrice ?? 0
        )}

            </div>

        </div>



        <!-- META -->

        <div class="modern-product-meta">

            <div class="meta-pill">

                <i class="bi bi-box-seam"></i>

                Qty:
                ${item.quantity ?? 0}

            </div>

            <div class="meta-pill">

                <i class="bi bi-upc-scan"></i>

                Serialized Item

            </div>

        </div>



        <!-- SERIALS -->

        <div class="modern-serial-container">

            <div class="modern-serial-title">

                <i class="bi bi-hdd-network me-2"></i>

                Serial Numbers

            </div>

            ${item.serials.length > 0

                ? item.serials.map(sn => `

                    <div class="modern-serial-item">

                        <i class="bi bi-dot"></i>

                        ${sn}

                    </div>

                `).join("")

                : `

                    <div class="text-muted small">

                        No serial assigned yet

                    </div>
                `
            }

        </div>

    </div>
`;
    });



    // =====================================
    // BUILD REPLACEMENT HTML
    // =====================================

    let replacementHtml = "";

    (order.replacementItems || [])
        .forEach(item => {

            replacementHtml += `

                    <div class="replacement-map-card">

                        <div class="replacement-map-grid">

                            <!-- DEFECTIVE -->

                            <div class="replacement-side defective-side">

                                <div class="replacement-label text-danger">

                                    <i class="bi bi-exclamation-triangle-fill me-2"></i>

                                    Defective Unit

                                </div>

                                <div class="product-name">

                                    ${item.defectiveProduct || "Unknown Product"}

                                </div>

                                <div class="product-sub">

                                    Serial:
                                    ${item.defectiveSerial || "N/A"}

                                </div>

                            </div>



                            <!-- ARROW -->

                            <div class="replacement-arrow">

                                <i class="bi bi-arrow-left-right"></i>

                            </div>



                            <!-- REPLACEMENT -->

                            <div class="replacement-side replacement-side-success">

                                <div class="replacement-label text-success">

                                    <i class="bi bi-check-circle-fill me-2"></i>

                                    Replacement Unit

                                </div>

                                <div class="product-name">

                                    ${item.replacementProduct || "Replacement Pending"}

                                </div>

                                <div class="product-sub">

                                    Serial:
                                    ${item.replacementSerial || "N/A"}

                                </div>

                                <div class="product-sub">

                                    Status:
                                    ${item.replacementStatus || "N/A"}

                                </div>

                            </div>

                        </div>

                    </div>
                `;
        });



    // =====================================
    // FINAL LAYOUT
    // =====================================

    container.innerHTML = `

        <div class="order-grid">

            <!-- LEFT -->
            <div class="order-section">

                <div class="order-section-title">
                    Basic Info
                </div>

                <div class="order-row">

                    <span class="label">
                        Transaction Code:
                    </span>

                    <span class="value">
                        ${order.transactionCode || "N/A"}
                    </span>

                </div>

                <div class="order-row">

                    <span class="label">
                        Status:
                    </span>

                    <span class="value">
                        ${order.status}
                    </span>

                </div>

                <div class="order-row">

                    <span class="label">
                        Order Date:
                    </span>

                    <span class="value">

                        ${order.createdAt

            ? formatDate(order.createdAt)

            : "N/A"
        }

                    </span>

                </div>

                <div class="order-row">

                    <span class="label">
                        Total:
                    </span>

                    <span class="value">

                        ₱${formatPrice(
            order.grandTotal ?? 0
        )}

                    </span>

                </div>

            </div>



            <!-- RIGHT -->
            <div class="order-section">

                <div class="order-section-title">
                    Delivery Info
                </div>

                <div class="order-row">

                    <span class="label">
                        Shipping Method:
                    </span>

                    <span class="value">
                        ${order.shippingMethod || "N/A"}
                    </span>

                </div>

                <div class="order-row">

                    <span class="label">
                        Payment Method:
                    </span>

                    <span class="value">
                        ${order.paymentMethod || "N/A"}
                    </span>

                </div>

                <div class="order-row">

                    <span class="label">
                        Payment Status:
                    </span>

                    <span class="value">
                        ${order.paymentStatus || "N/A"}
                    </span>

                </div>

                <div class="order-row">

                    <span class="label">
                        Delivered At:
                    </span>

                    <span class="value">

                        ${order.deliveredAt

            ? formatDate(
                order.deliveredAt
            )

            : "Not delivered yet"
        }

                    </span>

                </div>

            </div>

        </div>



        <!-- ITEMS -->

        <div class="order-section mt-3">

            <div class="order-section-title">
                Items
            </div>

            ${itemsHtml ||

        `<div class="text-muted">
                    No items available
                </div>`
        }

        </div>



        <!-- REPLACEMENT ITEMS -->

        <div class="order-section mt-3">

            <div class="order-section-title">
                Replacement Items
            </div>

            ${replacementHtml ||

        `<div class="text-muted">
                    No replacement items available
                </div>`
        }

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











//// At This Point We Process the OUTRIGHT REPLACEMENT ////

async function openWarrantyClaim(transactionId) {

    try {

        const response = await fetch(
            `/api/my-shop-orders/outright-replacement/eligible-items/${transactionId}`
        );

        if (!response.ok) {
            throw new Error("Failed to load warranty data.");
        }

        const data = await response.json();

        console.log("Warranty Data:", data);

        // ================= SAFE SETTER =================
        const setText = (id, value) => {

            const el = document.getElementById(id);

            if (el) {
                el.innerText = value ?? "-";
            }
        };

        // ================= TRANSACTION INFO =================

        setText(
            "warrantyTransactionCode",
            data.transactionCode
        );

        setText(
            "warrantyPlacedAt",
            data.transactionPlacedAt
                ? formatDate(data.transactionPlacedAt)
                : "-"
        );

        setText(
            "warrantyDeliveredAt",
            data.deliveredAt
                ? formatDate(data.deliveredAt)
                : "-"
        );

        setText(
            "warrantyCourier",
            data.courier
        );

        setText(
            "warrantyShippingMethod",
            data.shippingMethod
        );

        setText(
            "warrantyCustomerName",
            data.customerName
        );

        setText(
            "warrantyCustomerContact",
            data.customerContactNo
        );

        setText(
            "warrantyCustomerEmail",
            data.customerEmail
        );

        setText(
            "warrantyPaymentMethod",
            data.paymentMethod
        );

        setText(
            "warrantyPaymentStatus",
            data.paymentStatus
        );

        setText(
            "warrantyDeliveryAddress",
            data.deliveryAddress
        );

        setText(
            "warrantyGrandTotal",
            "₱ " + formatPrice(data.grandTotal ?? 0)
        );

        // ================= STORE ITEMS =================
        window.warrantyEligibleItems = data.items ?? [];

        // ================= RESET PRODUCT CONTAINER =================
        const container =
            document.getElementById("warrantyProductsContainer");

        if (container) {
            container.innerHTML = "";
        }

        // ================= RESET NOTES =================
        const notes =
            document.getElementById("warrantyCustomerNotes");

        if (notes) {
            notes.value = "";
        }

        // ================= RESET ATTACHMENTS =================
        const attachments =
            document.getElementById("warrantyAttachments");

        if (attachments) {
            attachments.value = "";
        }

        // ================= RESET PREVIEW =================
        const preview =
            document.getElementById("warrantyAttachmentPreview");

        if (preview) {
            preview.innerHTML = "";
        }

        // ================= ADD INITIAL PRODUCT ROW =================
        addDefectiveProductRow();

        // ================= OPEN MODAL =================
        document
            .getElementById("warrantyClaimModal")
            .classList.remove("hidden");

    }
    catch (err) {

        console.error("Warranty Modal Error:", err);

        alert("Failed to load warranty information.");
    }
}


// ================= ADD PRODUCT ROW =================
function addDefectiveProductRow() {

    const container =
        document.getElementById("warrantyProductsContainer");

    if (!container) return;

    const items =
        window.warrantyEligibleItems ?? [];

    // ================= GET SELECTED =================
    const selectedValues = Array.from(
        document.querySelectorAll(".warranty-product-select")
    )
        .map(s => s.value)
        .filter(v => v);

    // ================= OPTIONS =================
    let options = `
        <option value="">
            Select Delivered Product
        </option>
    `;

    items.forEach(item => {

        // Skip non-eligible
        if (!item.eligible)
            return;

        // Skip already claimed
        if (item.alreadyClaimed)
            return;

        // Prevent duplicates
        if (
            selectedValues.includes(
                item.deliveryItemId.toString()
            )
        )
            return;

        options += `
            <option
                value="${item.deliveryItemId}"

                data-delivery-item-id="${item.deliveryItemId}"
                data-inventory-id="${item.inventoryId}"
                data-product-id="${item.productId}"

                data-brand="${item.productBrand ?? ""}"
                data-series="${item.productSeries ?? ""}"
                data-model="${item.productModel ?? ""}"

                data-sku="${item.productSku ?? ""}"

                data-serial="${item.serialNumber ?? ""}"

                data-delivered-at="${item.deliveredAt ?? ""}"

                data-outright-days="${item.outrightReplacementDays ?? 0}"
                data-remaining-days="${item.remainingDays ?? 0}"

                data-product-price="${item.productPrice ?? 0}"

                data-standard-installation-price="${item.standardInstallationPrice ?? 0}"

                data-additional-installation-price="${item.additionalInstallationPrice ?? 0}"
            >

                ${item.productBrand ?? ""}
                ${item.productSeries ?? ""}
                ${item.productModel ?? ""}

                | SKU: ${item.productSku ?? "N/A"}

                | Serial: ${item.serialNumber ?? "N/A"}

            </option>
        `;
    });

    // ================= ROW =================
    const row = document.createElement("div");

    row.classList.add("warranty-product-row");

    row.innerHTML = `
        <div class="row">

            <!-- PRODUCT -->
            <div class="col-md-6 mb-3">

                <label class="form-label">
                    Delivered Product
                </label>

                <select class="form-select warranty-product-select">

                    ${options}

                </select>

            </div>

            <!-- SERIAL -->
            <div class="col-md-3 mb-3">

                <label class="form-label">
                    Serial Number
                </label>

                <input type="text"
                       class="form-control warranty-serial-input"
                       readonly />

            </div>

            <!-- REMAINING DAYS -->
            <div class="col-md-3 mb-3">

                <label class="form-label">
                    Remaining Days
                </label>

                <input type="text"
                       class="form-control warranty-days-input"
                       readonly />

            </div>

        </div>

        <!-- DETAILS -->
        <div class="row mb-3">

            <div class="col-md-4">

                <label class="form-label">
                    Product Price
                </label>

                <input type="text"
                       class="form-control warranty-product-price"
                       readonly />

            </div>

            <div class="col-md-4">

                <label class="form-label">
                    Standard Installation
                </label>

                <input type="text"
                       class="form-control warranty-std-installation"
                       readonly />

            </div>

            <div class="col-md-4">

                <label class="form-label">
                    Additional Installation
                </label>

                <input type="text"
                       class="form-control warranty-add-installation"
                       readonly />

            </div>

        </div>

        <!-- COMPLAINT -->
        <div class="mb-3">

            <label class="form-label">
                Issue / Complaint
            </label>

            <textarea class="form-control warranty-item-complaint"
                      rows="3"
                      maxlength="500"
                      placeholder="Describe the issue with this product..."></textarea>

        </div>

        <!-- HIDDEN VALUES -->
        <input type="hidden"
               class="warranty-delivery-item-id" />

        <input type="hidden"
               class="warranty-inventory-id" />

        <input type="hidden"
               class="warranty-product-id" />

        <!-- REMOVE -->
        <div class="text-end">

            <button type="button"
                    class="btn btn-sm btn-outline-danger"
                    onclick="removeDefectiveProductRow(this)">
                Remove Product
            </button>

        </div>
    `;

    // ================= ELEMENTS =================
    const select =
        row.querySelector(".warranty-product-select");

    const serialInput =
        row.querySelector(".warranty-serial-input");

    const daysInput =
        row.querySelector(".warranty-days-input");

    const productPriceInput =
        row.querySelector(".warranty-product-price");

    const stdInstallationInput =
        row.querySelector(".warranty-std-installation");

    const addInstallationInput =
        row.querySelector(".warranty-add-installation");

    // Hidden Inputs
    const deliveryItemIdInput =
        row.querySelector(".warranty-delivery-item-id");

    const inventoryIdInput =
        row.querySelector(".warranty-inventory-id");

    const productIdInput =
        row.querySelector(".warranty-product-id");

    // ================= UPDATE DETAILS =================
    const updateDetails = () => {

        const option =
            select.options[select.selectedIndex];

        // Empty selection
        if (!option || !option.value) {

            serialInput.value = "";

            daysInput.value = "";

            productPriceInput.value = "";

            stdInstallationInput.value = "";

            addInstallationInput.value = "";

            deliveryItemIdInput.value = "";

            inventoryIdInput.value = "";

            productIdInput.value = "";

            return;
        }

        // SERIAL
        serialInput.value =
            option.dataset.serial ?? "";

        // DAYS
        daysInput.value =
            `${option.dataset.remainingDays ?? 0} day(s) remaining`;

        // PRODUCT PRICE
        productPriceInput.value =
            "₱ " + formatPrice(
                option.dataset.productPrice ?? 0
            );

        // STD INSTALL
        stdInstallationInput.value =
            "₱ " + formatPrice(
                option.dataset.standardInstallationPrice ?? 0
            );

        // ADD INSTALL
        addInstallationInput.value =
            "₱ " + formatPrice(
                option.dataset.additionalInstallationPrice ?? 0
            );

        // ================= SAVE VALUES =================
        deliveryItemIdInput.value =
            option.dataset.deliveryItemId ?? "";

        inventoryIdInput.value =
            option.dataset.inventoryId ?? "";

        productIdInput.value =
            option.dataset.productId ?? "";
    };

    // ================= CHANGE EVENT =================
    select.addEventListener(
        "change",
        updateDetails
    );

    // ================= APPEND =================
    container.appendChild(row);

    // ================= AUTO SELECT FIRST =================
    if (select.options.length > 1) {

        select.selectedIndex = 1;

        updateDetails();
    }
}

// ================= REMOVE =================
function removeDefectiveProductRow(button) {

    const row =
        button.closest(".warranty-product-row");

    if (row) {
        row.remove();
    }
}

/// Add Products that is for warranty claim 
// ================= ADD PRODUCT ROW =================
function addDefectiveProductRow() {

    const container =
        document.getElementById("warrantyProductsContainer");

    if (!container) return;

    const items =
        window.warrantyEligibleItems ?? [];

    // ================= GET SELECTED =================
    const selectedValues = Array.from(
        document.querySelectorAll(".warranty-product-select")
    )
        .map(s => s.value)
        .filter(v => v);

    // ================= OPTIONS =================
    let options = `
        <option value="">
            Select Delivered Product
        </option>
    `;

    items.forEach(item => {

        // Skip already claimed
        if (item.alreadyClaimed)
            return;

        // Prevent duplicates
        if (
            selectedValues.includes(
                item.deliveryItemId.toString()
            )
        )
            return;

        options += `
            <option
                value="${item.deliveryItemId}"

                data-delivery-item-id="${item.deliveryItemId}"
                data-inventory-id="${item.inventoryId}"
                data-product-id="${item.productId}"

                data-brand="${item.productBrand ?? ""}"
                data-series="${item.productSeries ?? ""}"
                data-model="${item.productModel ?? ""}"

                data-sku="${item.productSku ?? ""}"

                data-serial="${item.serialNumber ?? ""}"

                data-delivered-at="${item.deliveredAt ?? ""}"

                data-outright-days="${item.outrightReplacementDays ?? 0}"
                data-remaining-days="${item.remainingDays ?? 0}"

                data-product-price="${item.productPrice ?? 0}"

                data-standard-installation-price="${item.standardInstallationPrice ?? 0}"

                data-additional-installation-price="${item.additionalInstallationPrice ?? 0}"
            >

                ${item.productBrand ?? ""}
                ${item.productSeries ?? ""}
                ${item.productModel ?? ""}

                | SKU: ${item.productSku ?? "N/A"}

                | Serial: ${item.serialNumber ?? "N/A"}

            </option>
        `;
    });

    // ================= ROW =================
    const row = document.createElement("div");

    row.classList.add("warranty-product-row");

    row.innerHTML = `
        <div class="row">

            <!-- PRODUCT -->
            <div class="col-md-6 mb-3">

                <label class="form-label">
                    Delivered Product
                </label>

                <select class="form-select warranty-product-select">

                    ${options}

                </select>

            </div>

            <!-- SERIAL -->
            <div class="col-md-3 mb-3">

                <label class="form-label">
                    Serial Number
                </label>

                <input type="text"
                       class="form-control warranty-serial-input"
                       readonly />

            </div>

            <!-- REMAINING DAYS -->
            <div class="col-md-3 mb-3">

                <label class="form-label">
                    Remaining Days
                </label>

                <input type="text"
                       class="form-control warranty-days-input"
                       readonly />

            </div>

        </div>

        <!-- DETAILS -->
        <div class="row mb-3">

            <div class="col-md-4">

                <label class="form-label">
                    Product Price
                </label>

                <input type="text"
                       class="form-control warranty-product-price"
                       readonly />

            </div>

            <div class="col-md-4">

                <label class="form-label">
                    Standard Installation
                </label>

                <input type="text"
                       class="form-control warranty-std-installation"
                       readonly />

            </div>

            <div class="col-md-4">

                <label class="form-label">
                    Additional Installation
                </label>

                <input type="text"
                       class="form-control warranty-add-installation"
                       readonly />

            </div>

        </div>

        <!-- COMPLAINT -->
        <div class="mb-3">

            <label class="form-label">
                Issue / Complaint
            </label>

            <textarea class="form-control warranty-item-complaint"
                      rows="3"
                      maxlength="500"
                      placeholder="Describe the issue with this product..."></textarea>

        </div>

        <!-- HIDDEN VALUES -->
        <input type="hidden"
               class="warranty-delivery-item-id" />

        <input type="hidden"
               class="warranty-inventory-id" />

        <input type="hidden"
               class="warranty-product-id" />

        <!-- REMOVE -->
        <div class="text-end">

            <button type="button"
                    class="btn btn-sm btn-outline-danger"
                    onclick="removeDefectiveProductRow(this)">
                Remove Product
            </button>

        </div>
    `;

    // ================= ELEMENTS =================
    const select =
        row.querySelector(".warranty-product-select");

    const serialInput =
        row.querySelector(".warranty-serial-input");

    const daysInput =
        row.querySelector(".warranty-days-input");

    const productPriceInput =
        row.querySelector(".warranty-product-price");

    const stdInstallationInput =
        row.querySelector(".warranty-std-installation");

    const addInstallationInput =
        row.querySelector(".warranty-add-installation");

    // Hidden Inputs
    const deliveryItemIdInput =
        row.querySelector(".warranty-delivery-item-id");

    const inventoryIdInput =
        row.querySelector(".warranty-inventory-id");

    const productIdInput =
        row.querySelector(".warranty-product-id");

    // ================= UPDATE DETAILS =================
    const updateDetails = () => {

        const option =
            select.options[select.selectedIndex];

        // Empty selection
        if (!option || !option.value) {

            serialInput.value = "";

            daysInput.value = "";

            productPriceInput.value = "";

            stdInstallationInput.value = "";

            addInstallationInput.value = "";

            deliveryItemIdInput.value = "";

            inventoryIdInput.value = "";

            productIdInput.value = "";

            toggleAddDefectiveButton();

            return;
        }

        // SERIAL
        serialInput.value =
            option.dataset.serial ?? "";

        // DAYS
        daysInput.value =
            `${option.dataset.remainingDays ?? 0} day(s) remaining`;

        // PRODUCT PRICE
        productPriceInput.value =
            "₱ " + formatPrice(
                option.dataset.productPrice ?? 0
            );

        // STD INSTALL
        stdInstallationInput.value =
            "₱ " + formatPrice(
                option.dataset.standardInstallationPrice ?? 0
            );

        // ADD INSTALL
        addInstallationInput.value =
            "₱ " + formatPrice(
                option.dataset.additionalInstallationPrice ?? 0
            );

        // SAVE VALUES
        deliveryItemIdInput.value =
            option.dataset.deliveryItemId ?? "";

        inventoryIdInput.value =
            option.dataset.inventoryId ?? "";

        productIdInput.value =
            option.dataset.productId ?? "";

        toggleAddDefectiveButton();
    };

    // ================= CHANGE EVENT =================
    select.addEventListener(
        "change",
        updateDetails
    );

    // ================= APPEND =================
    container.appendChild(row);

    // ================= AUTO SELECT FIRST =================
    if (select.options.length > 1) {

        select.selectedIndex = 1;

        updateDetails();
    }

    toggleAddDefectiveButton();
}

// ================= REMOVE =================
function removeDefectiveProductRow(button) {

    const row =
        button.closest(".warranty-product-row");

    if (row) {
        row.remove();
    }

    toggleAddDefectiveButton();
}


// ================= TOGGLE + BUTTON =================
function toggleAddDefectiveButton() {

    const button =
        document.getElementById("btnAddDefectiveProduct");

    if (!button) return;

    const items =
        window.warrantyEligibleItems ?? [];

    // Selected values
    const selectedValues = Array.from(
        document.querySelectorAll(".warranty-product-select")
    )
        .map(s => s.value)
        .filter(v => v);

    // Remaining selectable items
    const remaining = items.filter(item => {

        if (!item.eligible)
            return false;

        if (item.alreadyClaimed)
            return false;

        return !selectedValues.includes(
            item.deliveryItemId.toString()
        );
    });

    // Disable button if none remaining
    button.disabled = remaining.length === 0;

    // Optional visual state
    if (remaining.length === 0) {

        button.classList.add("disabled");

        button.innerText =
            "No More Eligible Products";
    }
    else {

        button.classList.remove("disabled");

        button.innerText =
            "+ Add Product Concern";
    }
}



///////////////          Image/Video Attachments                ////////////
// ================= WARRANTY FILE STORAGE =================
window.warrantyUploadedFiles = [];

// ================= WARRANTY FILES =================
const warrantyFilesInput =
    document.getElementById("warrantyFiles");

if (warrantyFilesInput) {

    warrantyFilesInput.addEventListener(
        "change",
        function () {

            const container =
                document.getElementById(
                    "warrantyPreviewContainer"
                );

            if (!container) return;

            // ================= APPEND FILES =================
            Array.from(this.files).forEach(file => {

                // Prevent duplicate same-name uploads
                const exists =
                    window.warrantyUploadedFiles.some(
                        f =>
                            f.name === file.name &&
                            f.size === file.size
                    );

                if (exists)
                    return;

                // Save globally
                window.warrantyUploadedFiles.push(file);

                // Preview wrapper
                const wrapper =
                    document.createElement("div");

                wrapper.classList.add(
                    "warranty-preview-item"
                );

                wrapper.style.width = "120px";

                wrapper.innerHTML = `
                    <div style="
                        border:1px solid #e5e7eb;
                        border-radius:14px;
                        overflow:hidden;
                        background:#fafafa;
                        position:relative;
                    ">

                        <!-- REMOVE -->
                        <button type="button"
                                style="
                                    position:absolute;
                                    top:6px;
                                    right:6px;
                                    z-index:5;
                                    border:none;
                                    background:rgba(0,0,0,.65);
                                    color:white;
                                    width:24px;
                                    height:24px;
                                    border-radius:50%;
                                    cursor:pointer;
                                ">
                            ✕
                        </button>

                        <!-- MEDIA -->
                        <div style="
                            height:100px;
                            display:flex;
                            align-items:center;
                            justify-content:center;
                            overflow:hidden;
                            background:white;
                        "
                        class="preview-media-container">
                        </div>

                        <!-- FILE NAME -->
                        <div style="
                            padding:8px;
                            font-size:.75rem;
                            text-align:center;
                            word-break:break-word;
                        ">
                            ${file.name}
                        </div>

                    </div>
                `;

                const mediaContainer =
                    wrapper.querySelector(
                        ".preview-media-container"
                    );

                // IMAGE
                if (file.type.startsWith("image/")) {

                    const img =
                        document.createElement("img");

                    img.src =
                        URL.createObjectURL(file);

                    img.style.width = "100%";

                    img.style.height = "100%";

                    img.style.objectFit = "cover";

                    mediaContainer.appendChild(img);
                }

                // VIDEO
                else if (
                    file.type.startsWith("video/")
                ) {

                    const video =
                        document.createElement("video");

                    video.src =
                        URL.createObjectURL(file);

                    video.controls = true;

                    video.style.width = "100%";

                    video.style.height = "100%";

                    video.style.objectFit = "cover";

                    mediaContainer.appendChild(video);
                }

                // REMOVE BUTTON
                const removeBtn =
                    wrapper.querySelector("button");

                removeBtn.addEventListener(
                    "click",
                    () => {

                        window.warrantyUploadedFiles =
                            window.warrantyUploadedFiles
                                .filter(f => f !== file);

                        wrapper.remove();
                    }
                );

                container.appendChild(wrapper);
            });

            // Reset input so same file can be re-added later
            this.value = "";
        }
    );
}


/// Close Modal ////
function closeWarrantyClaimModal() {

    const modal =
        document.getElementById("warrantyClaimModal");

    if (!modal) return;

    modal.classList.add("hidden");

    // OPTIONAL RESET
    const container =
        document.getElementById("warrantyProductsContainer");

    if (container) {
        container.innerHTML = "";
    }

    // CLEAR FILES
    window.warrantyUploadedFiles = [];

    // CLEAR PREVIEWS
    const preview =
        document.getElementById("warrantyPreviewContainer");

    if (preview) {
        preview.innerHTML = "";
    }

    // RESET NOTES
    const notes =
        document.getElementById("warrantyCustomerNotes");

    if (notes) {
        notes.value = "";
    }
}



///// POST WARRANTY ///////

async function submitWarrantyClaim() {

    // =========================
    // RESULT ELEMENT
    // =========================

    const resultBox =
        document.getElementById(
            "warrantySubmitResult"
        );

    if (resultBox) {

        resultBox.classList.remove(
            "success",
            "error"
        );

        resultBox.classList.add(
            "hidden"
        );

        resultBox.innerHTML = "";
    }

    try {

        // =========================
        // BUTTON LOADING
        // =========================

        const submitBtn =
            document.getElementById(
                "submitWarrantyBtn"
            );

        if (submitBtn) {

            submitBtn.disabled = true;

            submitBtn.innerHTML = `
                <span class="spinner-border spinner-border-sm me-2"></span>
                Submitting...
            `;
        }

        // =========================
        // GET ROWS
        // =========================

        const rows =
            document.querySelectorAll(
                ".warranty-product-row"
            );

        if (rows.length === 0) {

            throw new Error(
                "Please add at least one defective product."
            );
        }

        // =========================
        // FORM DATA
        // =========================

        const formData =
            new FormData();

        // =========================
        // CUSTOMER NOTES
        // =========================

        const customerNotes =
            document.getElementById(
                "warrantyCustomerNotes"
            )?.value?.trim();

        if (customerNotes) {

            formData.append(
                "customer_notes",
                customerNotes
            );
        }

        // =========================
        // ITEMS
        // =========================

        rows.forEach((row, index) => {

            const deliveryItemId =
                row.querySelector(
                    ".warranty-delivery-item-id"
                )?.value;

            const inventoryId =
                row.querySelector(
                    ".warranty-inventory-id"
                )?.value;

            const productId =
                row.querySelector(
                    ".warranty-product-id"
                )?.value;

            const complaint =
                row.querySelector(
                    ".warranty-item-complaint"
                )?.value
                    ?.trim();

            // =========================
            // VALIDATE
            // =========================

            if (
                !deliveryItemId ||
                !inventoryId ||
                !productId ||
                !complaint
            ) {
                throw new Error(
                    "Please complete all defective product details."
                );
            }

            // =========================
            // APPEND ITEMS[]
            // =========================

            formData.append(
                `items[${index}].delivery_item_id`,
                deliveryItemId
            );

            formData.append(
                `items[${index}].original_inventory_id`,
                inventoryId
            );

            formData.append(
                `items[${index}].product_id`,
                productId
            );

            formData.append(
                `items[${index}].issue_description`,
                complaint
            );
        });

        // =========================
        // ATTACHMENTS
        // =========================

        if (
            window.warrantyUploadedFiles &&
            window.warrantyUploadedFiles.length > 0
        ) {

            window.warrantyUploadedFiles
                .forEach(file => {

                    formData.append(
                        "attachments",
                        file
                    );
                });
        }

        // =========================
        // DEBUG
        // =========================

        for (let pair of formData.entries()) {

            console.log(
                pair[0],
                pair[1]
            );
        }

        // =========================
        // API REQUEST
        // =========================

        const response =
            await fetch(
                "/api/my-shop-warranty/outright-replacement/create",
                {
                    method: "POST",
                    body: formData
                }
            );

        // =========================
        // RESPONSE
        // =========================

        const result =
            await response.json();

        if (!response.ok) {

            throw new Error(
                result.message ||
                "Failed to submit warranty claim."
            );
        }

        // =========================
        // SUCCESS
        // =========================

        if (resultBox) {

            resultBox.classList.remove(
                "hidden",
                "error"
            );

            resultBox.classList.add(
                "success"
            );

            resultBox.innerHTML =
                result.message ||
                "Warranty claim submitted successfully.";
        }

        console.log(result);

        // =========================
        // AUTO CLOSE
        // =========================

        setTimeout(() => {

            closeWarrantyClaimModal();

        }, 5000);
    }
    catch (err) {

        console.error(
            "Warranty Submit Error:",
            err
        );

        // =========================
        // ERROR MESSAGE
        // =========================

        if (resultBox) {

            resultBox.classList.remove(
                "hidden",
                "success"
            );

            resultBox.classList.add(
                "error"
            );

            resultBox.innerHTML =
                err.message ||
                "Failed to submit warranty claim.";
        }
    }
    finally {

        // =========================
        // RESET BUTTON
        // =========================

        const submitBtn =
            document.getElementById(
                "submitWarrantyBtn"
            );

        if (submitBtn) {

            submitBtn.disabled = false;

            submitBtn.innerHTML =
                `Submit Warranty Claim`;
        }
    }
}