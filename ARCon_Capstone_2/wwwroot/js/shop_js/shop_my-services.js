//apgination

const tabState = {
    Pending: { page: 1 },
    Processing: { page: 1 },
    Scheduled: { page: 1 },
    Completed: { page: 1 },
    PartiallyCompleted: { page: 1 },
    Failed: { page: 1 },
    Cancelled: { page: 1 }
};

let currentTab = "Pending";
let pageSize = 10;

async function loadServices() {
    const sort = document.getElementById("sortSelect").value;
    const page = tabState[currentTab].page;

    const endpoint = `/api/my-shop-services/my-${tabApiMap[currentTab]}-services`;

    console.log("TAB:", currentTab);
    console.log("API:", endpoint);

    const res = await fetch(`${endpoint}?page=${page}&pageSize=${pageSize}&sortBy=${sort}`);
    const result = await res.json();

    // ✅ correct renderer per tab
    renderMap[currentTab](result.data);

    renderPagination(result.totalCount);
}

const tabApiMap = {
    Pending: "pending",
    Processing: "processing",
    Scheduled: "scheduled",
    Completed: "completed",
    PartiallyCompleted: "partially-completed",
    Failed: "failed",
    Cancelled: "cancelled"
};

const renderMap = {
    Pending: renderPendingServices,
    Processing: renderProcessingServices,
    Scheduled: renderScheduledServices,
    Completed: renderCompletedServices,
    PartiallyCompleted: renderPartiallyCompletedServices,
    Failed: renderFailedServices,
    Cancelled: renderCancelledServices
};

function renderPagination(totalCount) {
    const container = document.getElementById("pagination");
    container.innerHTML = "";

    const currentPage = tabState[currentTab].page;
    const totalPages = Math.ceil(totalCount / pageSize);

    if (totalPages === 0) return;

    let html = "";

    // PREV
    html += `
        <button 
            class="page-btn nav ${currentPage === 1 ? "disabled" : ""}"
            ${currentPage === 1 ? "disabled" : ""}
            onclick="changePage(${currentPage - 1})">
            ‹
        </button>
    `;

    // PAGES
    for (let i = 1; i <= totalPages; i++) {
        html += `
            <button 
                class="page-btn ${i === currentPage ? "active" : ""}"
                onclick="changePage(${i})">
                ${i}
            </button>
        `;
    }

    // NEXT
    html += `
        <button 
            class="page-btn nav ${currentPage === totalPages ? "disabled" : ""}"
            ${currentPage === totalPages ? "disabled" : ""}
            onclick="changePage(${currentPage + 1})">
            ›
        </button>
    `;

    container.innerHTML = html;
}

function changePage(page) {
    tabState[currentTab].page = page;
    loadServices();
}

document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {

        document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");

        currentTab = tab.dataset.tab;

        loadServices();
    });
});

document.getElementById("sortSelect").addEventListener("change", () => {
    tabState[currentTab].page = 1;
    loadServices();
});


//// end pagination

document.addEventListener("DOMContentLoaded", () => {
    const tabs = document.querySelectorAll(".tab");
    const contents = document.querySelectorAll(".tab-content");
    const sortSelect = document.getElementById("sortSelect");
    

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            const target = tab.dataset.tab;

            tabs.forEach(t => t.classList.remove("active"));
            contents.forEach(c => c.classList.remove("active"));

            tab.classList.add("active");

            const activeContent = document.getElementById(target);
            if (activeContent) {
                activeContent.classList.add("active");
            }

            // ✅ use current selected sort
            const currentSort = sortSelect.value;

            loadTab(target, currentSort);
        });
    });

    // ✅ SORT CHANGE HANDLER (IMPORTANT)
    sortSelect.addEventListener("change", () => {
        const selectedSort = sortSelect.value;

        const activeTab = document.querySelector(".tab.active");
        const tabKey = activeTab?.dataset.tab;

        console.log("SORT:", selectedSort, "TAB:", tabKey);

        if (tabKey) {
            loadTab(tabKey, selectedSort);
        }
    });

    // ✅ initial load
    //loadServices();
    loadTab("Pending", sortSelect.value);

});

function loadTransactions(status) {
    console.log("Loading:", status);

    // Example:
    // fetch(`/api/transactions?status=${status}`)
    //     .then(res => res.json())
    //     .then(data => renderTransactions(data));
}



/// Helpers
function formatPrice(value) {
    return Number(value || 0).toLocaleString();
}

function renderStars(rating) {
    let stars = "";

    for (let i = 1; i <= 5; i++) {
        stars += i <= rating ? "⭐" : "☆";
    }

    return stars;
}

function formatDate(date) {
    if (!date) return "N/A";

    const d = new Date(date);

    // ❌ invalid date check
    if (isNaN(d.getTime())) return "TBD";

    return d.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}

function formatPaymongoStatus(status) {
    const map = {
        "paid": "✅ Paid",
        "pending": "⏳ Pending",
        "failed": "❌ Failed"
    };
    return map[status?.toLowerCase()] || status;
}

function getPaymongoBadgeClass(status) {
    switch (status?.toLowerCase()) {
        case "paid": return "bg-success text-white";
        case "pending": return "bg-warning text-dark";
        case "failed": return "bg-danger text-white";
        default: return "bg-secondary text-white";
    }
}

function formatTime(time) {
    if (!time) return "TBD";

    try {
        // remove milliseconds → "16:40:10"
        const clean = time.split(".")[0];

        const parts = clean.split(":");
        if (parts.length < 2) return "TBD";

        let hour = parseInt(parts[0], 10);
        const minute = parts[1];

        if (isNaN(hour)) return "TBD";

        const ampm = hour >= 12 ? "PM" : "AM";
        hour = hour % 12 || 12;

        return `${hour}:${minute} ${ampm}`;
    } catch {
        return "TBD";
    }
}

function formatTimeFromDb(time) {
    if (!time || typeof time !== "string") return "TBD";

    // Expected: "HH:mm:ss.ffffff"
    const match = time.match(/^(\d{2}):(\d{2})/);

    if (!match) return "TBD";

    let hour = parseInt(match[1], 10);
    const minute = match[2];

    if (isNaN(hour)) return "TBD";

    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;

    return `${hour}:${minute} ${ampm}`;
}


function getSkeletonLoader() {
    return `
        <div class="skeleton-card">Loading services...</div>
    `;
}

function formatTransactionStatus(status) {
    const map = {
        "FOR_TECH_ASSIGNMENT": "👷 Waiting for Technician Assignment",
        "ASSIGNED": "🧑‍🔧 Technician Assigned",
        "IN_PROGRESS": "🔧 Service In Progress",
        "COMPLETED": "✅ Completed",
        "FAILED": "❌ Failed"
    };

    return map[status] || status || "N/A";
}

function formatBookingStatus(status) {
    const map = {
        "PENDING": "⏳ Pending",
        "PROCESSING": "🔧 Processing",
        "SCHEDULED": "📅 Scheduled",
        "IN_PROGRESS": "🚧 In Progress",
        "COMPLETED": "✅ Completed",
        "FAILED": "❌ Failed",
        "CANCELLED": "🚫 Cancelled"
    };

    return map[status] || status || "N/A";
}



function loadTab(tabKey, sort) {
    switch (tabKey) {

        case "Pending":
            loadPendingServices(sort);
            break;

        case "Processing":
            loadProcessingServices(sort);
            break;

        case "Scheduled":
            loadScheduledServices(sort);
            break;

        case "Completed":
            loadCompletedServices(sort);
            break;

        case "PartiallyCompleted":
            loadPartiallyCompletedServices(sort);
            break;

        case "Failed":
            loadFailedServices(sort);
            break;

        case "Cancelled":
            loadCancelledServices(sort);
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



// 🟡 For Confirmation
async function loadPendingServices(sort) {
    console.log("CALLING PENDING API"); // 👈 add this
    await fetchAndRender(`/api/my-shop-services/my-pending-services?sortBy=${sort}`, renderPendingServices);
}

// 🔵 Processing
async function loadProcessingServices(sort) {
    await fetchAndRender(`/api/my-shop-services/my-processing-services?sortBy=${sort}`, renderProcessingServices);
}

// 🟣 Scheduled
async function loadScheduledServices(sort) {
    await fetchAndRender(`/api/my-shop-services/my-scheduled-services?sortBy=${sort}`, renderScheduledServices);
}

// 🟢 Completed
async function loadCompletedServices(sort) {
    await fetchAndRender(`/api/my-shop-services/my-completed-services?sortBy=${sort}`, renderCompletedServices);
}

// 🟠 Partial
async function loadPartiallyCompletedServices(sort) {
    await fetchAndRender(`/api/my-shop-services/my-partially-completed-services?sortBy=${sort}`, renderPartiallyCompletedServices);
}

// 🔴 Failed
async function loadFailedServices(sort = "latest") {
    try {
        const res = await fetch(
            `/api/my-shop-services/my-failed-services?sortBy=${sort}`
        );

        const result = await res.json();

        // ✅ no merging needed anymore
        const data = result.data || [];

        renderFailedServices(data);

    } catch (err) {
        console.error("Failed loading failed services:", err);
    }
}
// ⚫ Cancelled
async function loadCancelledServices(sort) {
    await fetchAndRender(`/api/my-shop-services/my-cancelled-services?sortBy=${sort}`, renderCancelledServices);
}


function renderPendingServices(data) {
    const container = document.getElementById("ordersList");
    container.innerHTML = "";

    if (!data || data.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted mt-4">
                No services found.
            </div>
        `;
        return;
    }

    data.forEach(service => {

        let itemsHtml = "";

        if (service.items && service.items.length > 0) {
            itemsHtml = service.items.map(item => `
                <div class="product-item">
                    <div class="product-name">
                        ${item.serviceName ?? "Service"}
                    </div>
                    <div class="product-sub">
                        Type: ${item.airconType ?? "N/A"}
                    </div>
                    <div class="product-sub">
                        Units: ${item.unitCount} × ₱${formatPrice(item.price)}
                    </div>
                </div>
            `).join("");
        } else {
            itemsHtml = `<div class="text-muted">No services</div>`;
        }

        // PayMongo status
        const paymongoStatus = service.payment?.paymongoStatus;

        const paymongoBadge = paymongoStatus
            ? `<span class="badge ${getPaymongoBadgeClass(paymongoStatus)}" style="margin-left:6px;">
                    ${formatPaymongoStatus(paymongoStatus)}
               </span>`
            : "";

        const card = document.createElement("div");

        // ✅ APPLY THEME HERE
        card.classList.add("order-card", "status-pending");

        card.innerHTML = `
            <div class="order-section-header">
                ⚙️ Pending Service
            </div>

            <span class="label">
                Your service request is pending review. Please wait while we confirm and schedule your booking.
            </span>

            <div class="order-main">

                <!-- LEFT -->
                <div class="order-left">
                    <div class="order-section-title">Client's Service Request Info</div>

                    <div class="order-row">
                        <span class="label">Reference Code:</span>
                        <span class="value">${service.referenceCode}</span>
                    </div>

                    <div class="order-row">
                        <span class="label">Scheduled Date:</span>
                        <span class="value">${formatDate(service.scheduledDate)}</span>
                    </div>

                    <div class="order-row">
                        <span class="label">Preferred Time:</span>
                        <span class="value">${service.preferredTime ?? "N/A"}</span>
                    </div>

                    <div class="order-row">
                        <span class="label">Booking Created At:</span>
                        <span class="value">${formatDate(service.createdAt)}</span>
                    </div>

                    <div class="order-row">
                        <span class="label">Payment:</span>
                        <span class="value">
                            ${service.payment?.method ?? "N/A"}
                            ${paymongoBadge}
                        </span>
                    </div>

                    <div class="order-row">
                        <span class="label">Status:</span>
                        <span class="value">${service.status}</span>
                    </div>
                </div>

                <!-- RIGHT -->
                <div class="order-right">
                    <div class="order-section-title">Services</div>
                    <div class="product-list">
                        ${itemsHtml}
                    </div>
                </div>

            </div>

            <!-- BOTTOM -->
            <div class="order-bottom">

                <div class="order-price">
                    ₱ ${formatPrice(service.totalAmount)}
                </div>

                <div class="order-footer-new">
                    <button class="btn btn-sm btn-primary" onclick="openServiceDetails(${service.id})">
                        View Details
                    </button>

                    <button class="btn btn-sm btn-outline-danger" onclick="openCancelServiceModal(${service.id})">
                        Cancel
                    </button>
                </div>

            </div>
        `;

        container.appendChild(card);
    });
}


function renderProcessingServices(data) {
    const container = document.getElementById("ordersList");
    container.innerHTML = "";

    if (!data || data.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted mt-4">
                No processing services found.
            </div>
        `;
        return;
    }

    data.forEach(service => {

        let itemsHtml = "";

        if (service.items && service.items.length > 0) {
            itemsHtml = service.items.map(item => `
                <div class="product-item">
                    <div class="product-name">
                        ${item.serviceName ?? "Service"}
                    </div>
                    <div class="product-sub">
                        Type: ${item.airconType ?? "N/A"}
                    </div>
                    <div class="product-sub">
                        Units: ${item.unitCount} × ₱${formatPrice(item.price)}
                    </div>
                </div>
            `).join("");
        } else {
            itemsHtml = `<div class="text-muted">No services</div>`;
        }

        const card = document.createElement("div");

        // ✅ APPLY THEME (Processing = still blue but slightly softer)
        card.classList.add("order-card", "status-processing");

        card.innerHTML = `
            <div class="order-section-header">
                🔧 Processing Service
            </div>

            <span class="label">
                Your booking has been confirmed and is now being prepared. We're currently arranging a technician and will update you once everything is scheduled.
            </span>

            <div class="order-main">

                <!-- LEFT -->
                <div class="order-left">
                    <div class="order-section-title">Client's Service Request Info</div>

                    <div class="order-row">
                        <span class="label">Reference Code:</span>
                        <span class="value">${service.bookingRefCode}</span>
                    </div>

                    <div class="order-row">
                        <span class="label">Requested Date:</span>
                        <span class="value">${formatDate(service.scheduledDate)}</span>
                    </div>

                    <div class="order-row">
                        <span class="label">Preferred Time:</span>
                        <span class="value">${service.preferredTime ?? "N/A"}</span>
                    </div>

                    <div class="order-row">
                        <span class="label">Booking Created At:</span>
                        <span class="value">${formatDate(service.createdAt)}</span>
                    </div>

                    <div class="order-row">
                        <span class="label">Address:</span>
                        <span class="value">${service.address ?? "N/A"}</span>
                    </div>

                    <div class="order-row">
                        <span class="label">Status:</span>
                        <span class="value">${formatBookingStatus(service.status)}</span>
                    </div>
                </div>

                <!-- RIGHT -->
                <div class="order-right">
                    <div class="order-section-title">Services</div>
                    <div class="product-list">
                        ${itemsHtml}
                    </div>
                </div>

            </div>

            <!-- BOTTOM -->
            <div class="order-bottom">

                <div class="order-price">
                    ₱ ${formatPrice(service.totalAmount)}
                </div>

                <div class="order-footer-new">
                    <button class="btn btn-sm btn-primary" onclick="openServiceDetails(${service.bookingId})">
                        View Details
                    </button>
                </div>

            </div>
        `;

        container.appendChild(card);
    });
}


function renderScheduledServices(data) {
    const container = document.getElementById("ordersList");
    container.innerHTML = "";

    if (!data || data.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted mt-4">
                No scheduled services found.
            </div>
        `;
        return;
    }

    data.forEach(service => {

        const t = service.transaction;

        // 🔥 Technicians UI
        let techHtml = "";

        if (t?.technicians && t.technicians.length > 0) {
            techHtml = t.technicians.map(tech => `
                <div class="product-item">
                    <div class="product-name">
                        👨‍🔧 ${tech.name}
                    </div>
                    <div class="product-sub">
                        Contact: ${tech.contact ?? "N/A"}
                    </div>
                </div>
            `).join("");
        } else {
            techHtml = `<div class="text-muted">No technicians assigned yet</div>`;
        }

        const card = document.createElement("div");

        // ✅ APPLY THEME (Scheduled = calm blue/cream)
        card.classList.add("order-card", "status-scheduled");

        card.innerHTML = `
            <div class="order-section-header">
                📅 Scheduled Service
            </div>

            <span class="label">
                Your service has been scheduled. Please be available at the assigned time.
            </span>

            <div class="order-main">

                <!-- LEFT: BOOKING -->
                <div class="order-left">
                    <div class="order-section-title">Booking Info</div>

                    <div class="order-row">
                        <span class="label">Booking Code:</span>
                        <span class="value">${service.bookingRefCode}</span>
                    </div>

                    <div class="order-row">
                        <span class="label">Address:</span>
                        <span class="value">${service.address ?? "N/A"}</span>
                    </div>

                    <div class="order-row">
                        <span class="label">Status:</span>
                        <span class="value">${formatBookingStatus(service.status)}</span>
                    </div>
                </div>

                <!-- RIGHT: SCHEDULE -->
                <div class="order-right">
                    <div class="order-section-title">Schedule</div>

                    <div class="order-row">
                        <span class="label">Date:</span>
                        <span class="value">${formatDate(t?.scheduledDate)}</span>
                    </div>

                    <div class="order-row">
                        <span class="label">Time:</span>
                        <span class="value">${t?.scheduledTime ?? "N/A"}</span>
                    </div>

                    <div class="order-section-title mt-2">Assigned Technicians</div>
                    <div class="product-list">
                        ${techHtml}
                    </div>
                </div>

            </div>

            <!-- BOTTOM -->
            <div class="order-bottom">

                <div class="order-price">
                    ₱ ${formatPrice(service.totalAmount)}
                </div>

                <div class="order-footer-new">
                    <button class="btn btn-sm btn-primary" onclick="openServiceDetails(${service.bookingId})">
                        View Details
                    </button>
                </div>

            </div>
        `;

        container.appendChild(card);
    });
}


/// Completed Service
function renderCompletedServices(data) {
    const container = document.getElementById("ordersList");
    container.innerHTML = "";

    if (!data || data.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted mt-4">
                No completed services yet.
            </div>
        `;
        return;
    }

    data.forEach(service => {

        const t = service.transaction || {};

        // ⭐ Rating display
        let ratingHtml = "";

        if (t.rating && t.rating > 0) {
            ratingHtml = `
                <div class="order-row">
                    <span class="label">Rating:</span>
                    <span class="value">${renderStars(t.rating)}</span>
                </div>
            `;
        } else {
            ratingHtml = `
                <div class="order-row">
                    <span class="label">Rating:</span>
                    <span class="value text-muted">Not rated yet</span>
                </div>
            `;
        }

        const card = document.createElement("div");

        // ✅ APPLY THEME (Completed = success but still soft)
        card.classList.add("order-card", "status-completed");

        card.innerHTML = `
            <div class="order-section-header">
                ✅ Completed Service
            </div>

            <span class="label">
                Your service has been successfully completed. Thank you for choosing our service!
            </span>

            <div class="order-main">

                <!-- LEFT -->
                <div class="order-left">
                    <div class="order-section-title">Booking Info</div>

                    <div class="order-row">
                        <span class="label">Booking Code:</span>
                        <span class="value">${service.bookingRefCode}</span>
                    </div>

                    <div class="order-row">
                        <span class="label">Address:</span>
                        <span class="value">${service.address ?? "N/A"}</span>
                    </div>

                    <div class="order-row">
                        <span class="label">Status:</span>
                        <span class="value">${formatBookingStatus(service.status)}</span>
                    </div>
                </div>

                <!-- RIGHT -->
                <div class="order-right">
                    <div class="order-section-title">Completion Info</div>

                    <div class="order-row">
                        <span class="label">Completed Date:</span>
                        <span class="value">${formatDate(t?.completedDate)}</span>
                    </div>

                    <div class="order-row">
                        <span class="label">Completed Time:</span>
                        <span class="value">${formatTimeFromDb(t?.completedTime)}</span>
                    </div>

                    ${ratingHtml}
                </div>

            </div>

            <!-- BOTTOM -->
            <div class="order-bottom">

                <div class="order-price">
                    ₱ ${formatPrice(service.totalAmount)}
                </div>

                <div class="order-footer-new">
                    <button class="btn btn-sm btn-primary" onclick="openServiceDetails(${service.bookingId})">
                        View Details
                    </button>

                    ${!t.rating
                ? `<button class="btn btn-sm btn-warning" onclick="openRatingModal(${t.transactionId})">
                                Rate Service
                               </button>`
                : ""
            }
                </div>

            </div>
        `;

        container.appendChild(card);
    });
}

function renderPartiallyCompletedServices(data) {
    const container = document.getElementById("ordersList");
    container.innerHTML = "";

    if (!data || data.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted mt-4">
                No partially completed services.
            </div>
        `;
        return;
    }

    data.forEach(service => {

        const t = service.transaction || {};

        const card = document.createElement("div");

        // ✅ APPLY YOUR THEME
        card.classList.add("order-card", "status-partial");

        card.innerHTML = `
            <div class="order-section-header">
                ⚠️ Partially Completed Service
            </div>

            <span class="label">
                Your service was partially completed. We’ll continue working on it and keep you updated until it’s fully resolved. You can check the reason below for more details.
            </span>

            <div class="order-main">

                <!-- LEFT -->
                <div class="order-left">
                    <div class="order-section-title">Booking Info</div>

                    <div class="order-row">
                        <span class="label">Booking Code:</span>
                        <span class="value">${service.bookingRefCode}</span>
                    </div>

                    <div class="order-row">
                        <span class="label">Address:</span>
                        <span class="value">${service.address ?? "N/A"}</span>
                    </div>

                    <div class="order-row">
                        <span class="label">Status:</span>
                        <span class="value">${formatBookingStatus(service.status)}</span>
                    </div>
                </div>

                <!-- RIGHT -->
                <div class="order-right">
                    <div class="order-section-title">Partial Completion Info</div>

                    <div class="order-row">
                        <span class="label">Date:</span>
                        <span class="value">${formatDate(t?.partiallyCompletedDate)}</span>
                    </div>

                    <div class="order-row">
                        <span class="label">Time:</span>
                        <span class="value">${formatTime(t?.partiallyCompletedTime)}</span>
                    </div>

                    <div class="order-row">
                        <span class="label">Reason:</span>
                        <span class="value text-danger">
                            ${t?.reason ?? "No reason provided"}
                        </span>
                    </div>
                </div>

            </div>

            <!-- BOTTOM -->
            <div class="order-bottom">

                <div class="order-price">
                    ₱ ${formatPrice(service.totalAmount)}
                </div>

                <div class="order-footer-new">
                    <button class="btn btn-sm btn-primary" onclick="openServiceDetails(${service.bookingId})">
                        View Details
                    </button>
                </div>

            </div>
        `;

        container.appendChild(card);
    });
}


function renderFailedServices(data) {
    const container = document.getElementById("ordersList");
    container.innerHTML = "";

    if (!data || data.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted mt-4">
                No failed services.
            </div>
        `;
        return;
    }

    data.forEach(service => {
        const t = service.transaction || {};
        const isRefund = t?.isRefund;

        const card = document.createElement("div");

        // ✅ USE YOUR THEME SYSTEM
        card.classList.add(
            "order-card",
            isRefund ? "status-refund" : "status-failed"
        );

        card.innerHTML = `
            <div class="order-section-header">
                ❌ Failed Service ${isRefund ? "(For Refund)" : ""}
            </div>

            <span class="label">
                ${isRefund
                ? "This service could not be completed and is now being processed for refund. Please see the reason below."
                : "We’re sorry — this service could not be completed. Please check the reason below for more details."
            }
            </span>

            <div class="order-main">

                <!-- LEFT -->
                <div class="order-left">
                    <div class="order-section-title">Booking Info</div>

                    <div class="order-row">
                        <span class="label">Booking Code:</span>
                        <span class="value">${service.bookingRefCode}</span>
                    </div>

                    <div class="order-row">
                        <span class="label">Address:</span>
                        <span class="value">${service.address ?? "N/A"}</span>
                    </div>

                    <div class="order-row">
                        <span class="label">Status:</span>
                        <span class="value">${formatBookingStatus(service.status)}</span>
                    </div>
                </div>

                <!-- RIGHT -->
                <div class="order-right">
                    <div class="order-section-title">Failure Info</div>

                    <div class="order-row">
                        <span class="label">Date:</span>
                        <span class="value">${formatDate(t?.failedDate)}</span>
                    </div>

                    <div class="order-row">
                        <span class="label">Time:</span>
                        <span class="value">${formatTime(t?.failedTime)}</span>
                    </div>

                    <div class="order-row">
                        <span class="label">Reason:</span>
                        <span class="value text-danger">
                            ${t?.reason ?? "No failure reason provided"}
                        </span>
                    </div>
                </div>

            </div>

            <!-- BOTTOM -->
            <div class="order-bottom">

                <div class="order-price">
                    ₱ ${formatPrice(service.totalAmount)}
                </div>

                <div class="order-footer-new">
                    <button class="btn btn-sm btn-primary" onclick="openServiceDetails(${service.bookingId})">
                        View Details
                    </button>
                </div>

            </div>
        `;

        container.appendChild(card);
    });
}

function renderCancelledServices(data) {
    const container = document.getElementById("ordersList");
    container.innerHTML = "";

    if (!data || data.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted mt-4">
                No cancelled services.
            </div>
        `;
        return;
    }

    data.forEach(service => {
        const t = service.transaction || {};

        const card = document.createElement("div");

        // ✅ APPLY THEME (neutral gray)
        card.classList.add("order-card", "status-cancelled");

        card.innerHTML = `
            <div class="order-section-header">
                🚫 Cancelled Service
            </div>

            <span class="label">
                This service was cancelled. If you need assistance or want to rebook, feel free to explore our available services.
            </span>

            <div class="order-main">

                <!-- LEFT -->
                <div class="order-left">
                    <div class="order-section-title">Booking Info</div>

                    <div class="order-row">
                        <span class="label">Booking Code:</span>
                        <span class="value">${service.bookingRefCode}</span>
                    </div>

                    <div class="order-row">
                        <span class="label">Address:</span>
                        <span class="value">${service.address ?? "N/A"}</span>
                    </div>

                    <div class="order-row">
                        <span class="label">Status:</span>
                        <span class="value">${formatBookingStatus(service.status)}</span>
                    </div>
                </div>

                <!-- RIGHT -->
                <div class="order-right">
                    <div class="order-section-title">Cancellation Info</div>

                    <div class="order-row">
                        <span class="label">Date:</span>
                        <span class="value">${formatDate(t?.cancelledDate)}</span>
                    </div>

                    <div class="order-row">
                        <span class="label">Time:</span>
                        <span class="value">${formatTime(t?.cancelledTime)}</span>
                    </div>

                    <div class="order-row">
                        <span class="label">Reason:</span>
                        <span class="value text-danger">
                            ${t?.reason ?? "No cancellation reason provided"}
                        </span>
                    </div>
                </div>

            </div>

            <!-- BOTTOM -->
            <div class="order-bottom">

                <div class="order-price">
                    ₱ ${formatPrice(service.totalAmount)}
                </div>

                <div class="order-footer-new">
                    <button class="btn btn-sm btn-primary" onclick="openServiceDetails(${service.bookingId})">
                        View Details
                    </button>
                </div>

            </div>
        `;

        container.appendChild(card);
    });
}