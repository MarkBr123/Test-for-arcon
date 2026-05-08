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

    // 🔥 FIX: DO NOT TOUCH BOOTSTRAP tab-content
    const contents = document.querySelectorAll(".main-tab-content");

    const sortSelect = document.getElementById("sortSelect");

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            const target = tab.dataset.tab;

            tabs.forEach(t => t.classList.remove("active"));

            // 🔥 ONLY affect your own content
            contents.forEach(c => c.classList.remove("active"));

            tab.classList.add("active");

            const activeContent = document.getElementById(target);
            if (activeContent) {
                activeContent.classList.add("active");
            }

            const currentSort = sortSelect.value;
            loadTab(target, currentSort);
        });
    });

    sortSelect.addEventListener("change", () => {
        const selectedSort = sortSelect.value;

        const activeTab = document.querySelector(".tab.active");
        const tabKey = activeTab?.dataset.tab;

        if (tabKey) {
            loadTab(tabKey, selectedSort);
        }
    });

    loadTab("Pending", sortSelect.value);
});

function loadTransactions(status) {
    console.log("Loading:", status);
}



/// Helpers
function formatPrice(num) {
    return Number(num || 0).toLocaleString("en-PH", {
        minimumFractionDigits: 2
    });
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

    // invalid date check
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



//  For Confirmation
async function loadPendingServices(sort) {
    console.log("CALLING PENDING API"); 
    await fetchAndRender(`/api/my-shop-services/my-pending-services?sortBy=${sort}`, renderPendingServices);
}

//  Processing
async function loadProcessingServices(sort) {
    await fetchAndRender(`/api/my-shop-services/my-processing-services?sortBy=${sort}`, renderProcessingServices);
}

//  Scheduled
async function loadScheduledServices(sort) {
    await fetchAndRender(`/api/my-shop-services/my-scheduled-services?sortBy=${sort}`, renderScheduledServices);
}

//  Completed
async function loadCompletedServices(sort) {
    await fetchAndRender(`/api/my-shop-services/my-completed-services?sortBy=${sort}`, renderCompletedServices);
}

//  Partial
async function loadPartiallyCompletedServices(sort) {
    await fetchAndRender(`/api/my-shop-services/my-partially-completed-services?sortBy=${sort}`, renderPartiallyCompletedServices);
}

//  Failed
async function loadFailedServices(sort = "latest") {
    try {
        const res = await fetch(
            `/api/my-shop-services/my-failed-services?sortBy=${sort}`
        );

        const result = await res.json();

        //  no merging needed anymore
        const data = result.data || [];

        renderFailedServices(data);

    } catch (err) {
        console.error("Failed loading failed services:", err);
    }
}
//  Cancelled
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

        //  APPLY THEME HERE
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
                    <button class="btn btn-sm btn-primary" onclick="openServiceDetails(${service.id})"">
                        View Details
                    </button>

                    <button class="btn btn-sm btn-outline-danger" onclick="openCancelServiceModal(${service.bookingId})">
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

        //  APPLY THEME (Processing = still blue but slightly softer)
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

                    <button class="btn btn-sm btn-outline-danger" onclick="openCancelServiceModal(${service.id})">
                        Cancel
                        
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
                        <span class="label">Reference Code:</span>
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

                   <button class="btn btn-sm btn-outline-secondary"
                            onclick="showCannotCancelModal()">
                        ⚠️ Cancel
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

        // CORRECT SOURCE (from booking)
        const isRated = service.isRated === true;
        const ratingValue = service.rating?.rating ?? 0;

        // Rating display (RIGHT SIDE)
        let ratingHtml = "";

        if (isRated && ratingValue > 0) {
            ratingHtml = `
                <div class="order-row">
                    <span class="label">Rating:</span>
                    <span class="value">${renderStars(ratingValue)}</span>
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
                        <span class="label">Reference Code:</span>
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

            <!-- Actions -->
            <div class="d-flex flex-wrap gap-2 align-items-center mt-2">

                <!-- View Details -->
                <button class="btn btn-sm btn-outline-primary"
                    onclick="openServiceDetails(${service.bookingId})">
                    <i class="bi bi-eye"></i>
                    View Details
                </button>

                <!-- Warranty Claim -->
                <button class="btn btn-sm btn-outline-success"
                    onclick="openWarrantyClaim(${service.bookingId})">
                    <i class="bi bi-shield-check"></i>
                    Warranty Claim
                </button>

                <!-- Rating -->
                ${isRated
                            ? `
                    <span class="text-success fw-semibold d-flex align-items-center gap-1">
                        <i class="bi bi-check-circle-fill"></i>
                        Rated ${renderStars(ratingValue)}
                    </span>
                    `
                : `
        <button class="btn btn-sm btn-warning"
            onclick="openSetRating(${service.bookingId})">
            <i class="bi bi-star-fill"></i>
            Rate Service
        </button>
        `
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
                        <span class="label">Reference Code:</span>
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
                        <span class="label">Reference Code:</span>
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
                        <span class="label">Reference Code:</span>
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



///// CANCELLATION PART /////


let selectedBookingId = null;

// OPEN FIRST MODAL
function openCancelServiceModal(bookingId) {
    selectedBookingId = bookingId;

    const modalEl = document.getElementById("cancelReasonModal");
    if (!modalEl) return;

    const input = document.getElementById("cancelReasonInput");
    if (input) input.value = "";

    bootstrap.Modal.getOrCreateInstance(modalEl).show();
}

// GO TO CONFIRM MODAL
function openConfirmCancelModal() {
    const input = document.getElementById("cancelReasonInput");
    const reason = input ? input.value.trim() : "";

    if (!reason) {
        alert("Please provide a cancellation reason.");
        return;
    }

    const reasonModalEl = document.getElementById("cancelReasonModal");
    const confirmModalEl = document.getElementById("confirmCancelModal");

    if (!confirmModalEl) return;

    // close first modal safely
    bootstrap.Modal.getOrCreateInstance(reasonModalEl).hide();

    // open confirm modal
    bootstrap.Modal.getOrCreateInstance(confirmModalEl).show();
}

// CONFIRM + API CALL
async function confirmCancelService() {
    try {
        const input = document.getElementById("cancelReasonInput");
        const reason = input ? input.value.trim() : "";

        const confirmModalEl = document.getElementById("confirmCancelModal");
        const successModalEl = document.getElementById("cancelSuccessModal");

        // close confirm modal safely
        bootstrap.Modal.getOrCreateInstance(confirmModalEl).hide();

        //API CALL
        const res = await fetch(`/api/my-shop-services/customer/cancel/${selectedBookingId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ reason })
        });

        if (!res.ok) {
            const err = await res.json();
            alert(err.message || "Failed to cancel service");
            return;
        }

        // SHOW SUCCESS MODAL
        if (successModalEl) {
            bootstrap.Modal.getOrCreateInstance(successModalEl).show();
        }

        // reload after slight delay (prevents UI flicker)
        setTimeout(() => {
            loadTab(currentTab, document.getElementById("sortSelect")?.value);
        }, 300);

    } catch (error) {
        console.error("Cancel error:", error);
        alert("Something went wrong.");
    }
}

document.getElementById("cancelSuccessModal").addEventListener("hidden.bs.modal", () => {
    loadTab(currentTab, document.getElementById("sortSelect").value);
});


function showCannotCancelModal() {
    const modalEl = document.getElementById("cannotCancelModal");
    if (!modalEl) return;

    bootstrap.Modal.getOrCreateInstance(modalEl).show();
}



//// Details Summary Modal //////

async function openServiceDetails(bookingId) {
    try {
        const res = await fetch(`/api/my-shop-services/customer/stsummary/${bookingId}`);

        if (!res.ok) {
            alert("Failed to load details");
            return;
        }

        const data = await res.json();
        console.log("DATA:", data);

        const b = data.booking || {};
        const t = data.latestTransaction || {};
        const transactions = data.transactions || [];
        const customer = data.customer || {};

        const modalEl = document.getElementById("serviceDetailsModal");
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();

        // SAFE SET
        const setText = (id, value) => {
            const el = modalEl.querySelector(`#${id}`);
            if (el) el.textContent = value ?? "N/A";
        };

        // ================= BOOKING =================
        setText("d_bookingCode", b.referenceCode);
        setText("d_status", b.status);
        setText("d_scheduledDate", formatDate(b.scheduledDate));
        setText("d_time", b.preferredTime);
        setText("d_address", data.address);

        // NEW BOOKING FIELDS
        setText("d_propertyType", b.propertyType);
        setText("d_customerNote", b.customerNote);
        setText("d_businessName", b.businessName);
        setText("d_failureCount", b.failureCount);
        setText("d_partialCount", b.partialCount);

        // ================= CUSTOMER =================
        setText("d_customerName", customer.name);
        setText("d_customerContact", customer.contact);

        // ================= TRANSACTION =================
        setText("d_transactionCode", t.referenceCode || "Not yet assigned");

        setText("d_completedDate",
            t.completedDate ? formatDate(t.completedDate) : "Pending"
        );

        setText("d_completedTime",
            t.completedTime ? formatTimeSpecific(t.completedTime) : "Pending"
        );

        // NEW TRANSACTION FIELDS
        setText("d_actualDate",
            t.scheduledDate ? formatDate(t.scheduledDate) : "Not scheduled"
        );

        setText("d_actualTime",
            t.scheduledTime ? formatTimeSpecific(t.scheduledTime) : "Not scheduled"
        );

        setText("d_estimatedDate",
            t.estimatedCompletionDate
                ? formatDate(t.estimatedCompletionDate)
                : "Not available"
        );

        setText("d_estimatedTime",
            t.estimatedCompletionTime
                ? formatTimeSpecific(t.estimatedCompletionTime)
                : "Not available"
        );

        const ratingEl = modalEl.querySelector("#d_rating");
        if (ratingEl) {
            ratingEl.innerHTML = t.rating
                ? renderStars(t.rating)
                : "Not rated";
        }

        // ================= REMARKS =================
        let remarks = "No issues reported.";

        if (t.statusDetails?.isFailed) {
            remarks = `❌ Failed: ${t.statusDetails.failReason}`;
        } else if (t.statusDetails?.isPartiallyCompleted) {
            remarks = `⚠️ Partial: ${t.statusDetails.partiallyReason}`;
        } else if (t.statusDetails?.isCancelled) {
            remarks = `🚫 Cancelled: ${t.statusDetails.cancellationReason}`;
        } else if (t.statusDetails?.isRefund) {
            remarks = `💸 Refund in progress`;
        }

        setText("d_remarks", remarks);

        // ================= SERVICES =================
        const itemsContainer = modalEl.querySelector("#d_items");
        itemsContainer.innerHTML = "";

        if (data.items?.length > 0) {
            data.items.forEach(item => {
                const div = document.createElement("div");
                div.classList.add("product-item");

                div.innerHTML = `
                    <div class="product-name">${item.serviceName}</div>
                    <div class="product-sub">
                        ${item.airconType ?? "N/A"} • ${item.unitCount} unit(s)
                    </div>
                    <div class="product-sub">
                        ₱${formatPrice(item.price)} × ${item.unitCount}
                    </div>
                `;

                itemsContainer.appendChild(div);
            });
        } else {
            itemsContainer.innerHTML = `<div class="text-muted">No services found</div>`;
        }

        // ================= SUMMARY =================
        setText("d_total", formatPrice(data.summary?.totalAmount || 0));

        const feeEl = modalEl.querySelector("#d_reserviceFee");
        if (feeEl) {
            const totalFees = data.summary?.totalReserviceFees || 0;

            feeEl.textContent = totalFees > 0
                ? "₱ " + formatPrice(totalFees)
                : "None";
        }

        // ================= HISTORY =================
        const historyContainer = modalEl.querySelector("#d_transactions");
        historyContainer.innerHTML = "";

        if (transactions.length === 0) {
            historyContainer.innerHTML =
                `<div class="text-muted">No service attempts yet.</div>`;
        } else {
            transactions.forEach((tx, index) => {

                let color = "secondary";
                if (tx.status === "COMPLETED") color = "success";
                else if (tx.status === "FAILED") color = "danger";
                else if (tx.status === "PARTIALLY_COMPLETED") color = "warning";

                const div = document.createElement("div");
                div.classList.add("transaction-card");

                div.innerHTML = `
                    <div class="transaction-header">
                        Attempt ${index + 1}
                        <span class="badge bg-${color}">
                            ${tx.status}
                        </span>
                    </div>

                    <div class="transaction-body">
                        <div><strong>Date:</strong> ${formatDate(tx.createdAt)}</div>
                        <div><strong>Scheduled:</strong> ${formatDate(tx.scheduledDate)} ${formatTimeSpecific(tx.scheduledTime)}</div>
                        <div><strong>Completed:</strong> ${tx.completedDate ? formatDate(tx.completedDate) : "—"}</div>
                        <div><strong>Reference:</strong> ${tx.referenceCode}</div>

                        ${tx.reserviceFee > 0
                        ? `<div class="text-warning"><strong>Reservice Fee: ₱${formatPrice(tx.reserviceFee)}</strong></div>`
                        : ""
                    }
                    </div>
                `;

                historyContainer.appendChild(div);
            });
        }

    } catch (err) {
        console.error("DETAILS ERROR:", err);
        alert("Something went wrong.");
    }
}

// your special time fix
function formatTimeSpecific(time) {
    if (!time) return "N/A";

    try {
        const parts = time.split(":");
        let h = parseInt(parts[0]);
        const m = parts[1];

        const ampm = h >= 12 ? "PM" : "AM";
        h = h % 12 || 12;

        return `${h}:${m} ${ampm}`;
    } catch {
        return "N/A";
    }
}



/// Service Rating

let currentBookingId = null;
let selectedRating = 0;

const ratingLabels = {
    1: "😞 Very Bad",
    2: "😕 Needs Improvement",
    3: "😐 Okay",
    4: "😊 Satisfied",
    5: "🔥 Excellent Service"
};

// Open Modal
function openSetRating(bookingId) {
    if (!bookingId) {
        console.error("Booking ID missing");
        return;
    }

    const btn = document.querySelector(
        `button[onclick="openSetRating(${bookingId})"]`
    );

    if (!btn) {
        showRatingAlert("You already rated this service.", "warning");
        return;
    }

    currentBookingId = bookingId;
    selectedRating = 0;

    const modalEl = document.getElementById("ratingModal");
    if (!modalEl) return;

    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    setTimeout(() => {
        hideRatingAlert(); // reset alert

        const commentEl = document.getElementById("ratingComment");
        const labelEl = document.getElementById("ratingLabel");

        if (commentEl) commentEl.value = "";
        if (labelEl) labelEl.innerText = "Select a rating";

        document.querySelectorAll("#starContainer .star").forEach(s => {
            s.classList.remove("active");
        });
    }, 0);
}




// Star selection
document.querySelectorAll("#starContainer .star").forEach(star => {
    star.addEventListener("click", function () {
        selectedRating = parseInt(this.dataset.value);

        document.querySelectorAll("#starContainer .star").forEach(s => {
            s.classList.toggle("active", s.dataset.value <= selectedRating);
        });

        document.getElementById("ratingLabel").innerText =
            ratingLabels[selectedRating];
    });
});

//Submit Rating
document.getElementById("submitRatingBtn").addEventListener("click", async () => {
    if (!selectedRating) {
        alert("Please select a rating.");
        return;
    }

    const btn = document.getElementById("submitRatingBtn");
    btn.disabled = true;

    try {
        const comment = document.getElementById("ratingComment").value;

        const res = await fetch(`/api/my-shop-ratings/${currentBookingId}/rate`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                rating: selectedRating,
                comment: comment
            })
        });

        let data = {};
        try {
            data = await res.json();
        } catch {

        }

        // 
        if (!res.ok) {

            if (data?.isRated) {

                // ENSURE MODAL IS OPEN
                const modalEl = document.getElementById("ratingModal");
                let modal = bootstrap.Modal.getInstance(modalEl);

                if (!modal) {
                    modal = new bootstrap.Modal(modalEl);
                }

                modal.show();

                //
                showRatingAlert("This service has already been rated.", "warning");

                updateRatingUI(
                    currentBookingId,
                    data?.rating?.rating ?? selectedRating
                );

                return;
            }

            showRatingAlert(data?.message || "The service booking is already rated");
            return;
        }

        alert("✅ Rating submitted!");

        closeModal();

        
        updateRatingUI(
            currentBookingId,
            data?.rating?.rating ?? selectedRating
        );

    } catch (err) {
        console.error(err);
        alert("Something went wrong. Please try again.");
    } finally {
        btn.disabled = false;
    }


});

//Close modal safely
function closeModal() {
    const modalEl = document.getElementById("ratingModal");
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();
}

//Update UI (no reload)
function updateRatingUI(bookingId, ratingValue) {
    const btn = document.querySelector(
        `button[onclick="openSetRating(${bookingId})"]`
    );

    if (!btn) return;

    const container = btn.parentElement;

    if (!container) return;

    container.innerHTML = `
        <span class="text-success fw-semibold d-flex align-items-center gap-1">
            ✔ Rated ${renderStars(ratingValue)}
        </span>
    `;
}


function showRatingAlert(message, type = "danger") {
    const alertBox = document.getElementById("ratingAlert");
    if (!alertBox) return;

    alertBox.className = `alert alert-${type}`;
    alertBox.textContent = message;
    alertBox.classList.remove("d-none");
}

function hideRatingAlert() {
    const alertBox = document.getElementById("ratingAlert");
    if (!alertBox) return;

    alertBox.classList.add("d-none");
    alertBox.textContent = "";
}


///Service Warranty Part

// =========================
// Open Warranty Claim Modal
// =========================
function openWarrantyClaim(serviceBookingId) {

    // Store booking id
    document.getElementById("warrantyBookingId").value = serviceBookingId;

    // Reset fields
    document.getElementById("warrantyComplaint").value = "";
    document.getElementById("warrantyPreferredDate").value = "";
    document.getElementById("warrantyPreferredTime").value = "";

    // Open modal
    const modal = new bootstrap.Modal(
        document.getElementById("warrantyClaimModal")
    );

    modal.show();
}



// Submit Warranty Claim

let selectedWarrantyFiles = [];

document.getElementById("warrantyFiles")
    .addEventListener("change", function (e) {

        const files = Array.from(e.target.files);

        selectedWarrantyFiles.push(...files);

        renderWarrantyPreviews();

        // reset input
        e.target.value = "";
    });


// =========================
// Render Previews
// =========================

function renderWarrantyPreviews() {

    const container =
        document.getElementById(
            "warrantyPreviewContainer"
        );

    container.innerHTML = "";

    selectedWarrantyFiles.forEach((file, index) => {

        const wrapper = document.createElement("div");

        wrapper.className =
            "position-relative border rounded-3 overflow-hidden";

        wrapper.style.width = "110px";
        wrapper.style.height = "110px";

        let preview = "";

        // IMAGE
        if (file.type.startsWith("image/")) {

            const imageUrl =
                URL.createObjectURL(file);

            preview = `
                <img src="${imageUrl}"
                     class="w-100 h-100 object-fit-cover">
            `;
        }

        // VIDEO
        else if (file.type.startsWith("video/")) {

            const videoUrl =
                URL.createObjectURL(file);

            preview = `
                <video class="w-100 h-100 object-fit-cover"
                       muted>
                    <source src="${videoUrl}">
                </video>
            `;
        }

        wrapper.innerHTML = `
            ${preview}

            <button type="button"
                    class="btn btn-sm btn-danger position-absolute top-0 end-0 rounded-circle m-1"
                    style="width:28px;height:28px;padding:0;"
                    onclick="removeWarrantyFile(${index})">

                <i class="bi bi-x"></i>
            </button>
        `;

        container.appendChild(wrapper);
    });
}


// =========================
// Remove File
// =========================

function removeWarrantyFile(index) {

    selectedWarrantyFiles.splice(index, 1);

    renderWarrantyPreviews();
}


// =========================
// Submit Warranty Claim
// =========================

async function submitWarrantyClaim() {

    const bookingId = parseInt(
        document.getElementById("warrantyBookingId").value
    );

    const complaint = document
        .getElementById("warrantyComplaint")
        .value
        .trim();

    const preferredDate = document
        .getElementById("warrantyPreferredDate")
        .value;

    const preferredTime = document
        .getElementById("warrantyPreferredTime")
        .value;


    // =========================
    // Validations
    // =========================

    if (!complaint) {

        showToast(
            "Please enter your complaint.",
            "warning"
        );

        return;
    }

    if (complaint.length < 10) {

        showToast(
            "Complaint must contain at least 10 characters.",
            "warning"
        );

        return;
    }

    if (!preferredDate) {

        showToast(
            "Please select a preferred date.",
            "warning"
        );

        return;
    }

    if (!preferredTime) {

        showToast(
            "Please select a preferred time.",
            "warning"
        );

        return;
    }


    // =========================
    // Schedule Validation
    // =========================

    const scheduled =
        new Date(`${preferredDate}T${preferredTime}`);

    const now = new Date();

    if (scheduled < now) {

        showToast(
            "Preferred schedule cannot be in the past.",
            "warning"
        );

        return;
    }

    const maxDate = new Date();

    maxDate.setDate(maxDate.getDate() + 30);

    if (scheduled > maxDate) {

        showToast(
            "Preferred schedule cannot exceed 30 days.",
            "warning"
        );

        return;
    }


    // =========================
    // File Validation
    // =========================

    if (selectedWarrantyFiles.length > 0) {

        let totalSize = 0;

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "video/mp4",
            "video/quicktime",
            "video/x-msvideo"
        ];

        for (const file of selectedWarrantyFiles) {

            totalSize += file.size;

            if (!allowedTypes.includes(file.type)) {

                showToast(
                    `File type not allowed: ${file.name}`,
                    "warning"
                );

                return;
            }
        }

        // 20MB limit
        if (totalSize > 20 * 1024 * 1024) {

            showToast(
                "Total upload size must not exceed 20MB.",
                "warning"
            );

            return;
        }
    }


    // =========================
    // FormData
    // =========================

    const formData = new FormData();

    formData.append(
        "service_booking_id",
        bookingId
    );

    formData.append(
        "complaint",
        complaint
    );

    formData.append(
        "preferred_date",
        preferredDate
    );

    formData.append(
        "preferred_time",
        preferredTime
    );

    // Files
    selectedWarrantyFiles.forEach(file => {

        formData.append("files", file);
    });


    // =========================
    // Submit API
    // =========================

    try {

        // =========================
        // Show Loading
        // =========================

        showLoading();


        // =========================
        // Submit API
        // =========================

        const response = await fetch(
            "/api/my-shop-warranty/service-warranty-claim",
            {
                method: "POST",
                body: formData,
                credentials: "include"
            }
        );


        // =========================
        // Parse Response
        // =========================

        let data = null;

        try {

            data = await response.json();
        }
        catch {

            data = {
                message: "Unexpected server response."
            };
        }


        // =========================
        // Error Response
        // =========================

        if (!response.ok) {

            hideLoading();

            showToast(
                data.message ||
                "Failed to submit warranty claim.",
                "error"
            );

            return;
        }


        // =========================
        // Success
        // =========================

        hideLoading();

        // Reset files
        selectedWarrantyFiles = [];

        renderWarrantyPreviews();

        // Reset form
        document.getElementById(
            "warrantyComplaint"
        ).value = "";

        document.getElementById(
            "warrantyPreferredDate"
        ).value = "";

        document.getElementById(
            "warrantyPreferredTime"
        ).value = "";

        document.getElementById(
            "warrantyFiles"
        ).value = "";


        // Close claim modal
        bootstrap.Modal.getInstance(
            document.getElementById("warrantyClaimModal")
        ).hide();


        // Open success modal
        new bootstrap.Modal(
            document.getElementById("warrantySuccessModal")
        ).show();
    }
    catch (err) {

        // =========================
        // Exception
        // =========================

        hideLoading();

        console.error(err);

        showToast(
            "Something went wrong while submitting warranty claim.",
            "error"
        );
    }
}








function showToast(message, type = "success", delay = 5000) {

    const container = document.getElementById("toastContainer");

    if (!container) {
        console.error("Toast container not found.");
        return;
    }

    let bgClass = "bg-success";

    switch (type) {
        case "error":
            bgClass = "bg-danger";
            break;

        case "warning":
            bgClass = "bg-warning text-dark";
            break;

        case "info":
            bgClass = "bg-info text-dark";
            break;
    }

    const toast = document.createElement("div");

    toast.className =
        `toast align-items-center text-white ${bgClass} border-0 show mb-2`;

    toast.role = "alert";

    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>

            <button type="button"
                    class="btn-close btn-close-white me-2 m-auto"
                    onclick="this.closest('.toast').remove()">
            </button>
        </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, delay);
}


function showLoading() {

    const overlay =
        document.getElementById("loadingOverlay");

    overlay.style.display = "block";

    // Prevent scrolling
    document.body.style.overflow = "hidden";
}

function hideLoading() {

    const overlay =
        document.getElementById("loadingOverlay");

    overlay.style.display = "none";

    // Restore scrolling
    document.body.style.overflow = "";
}