document.addEventListener("DOMContentLoaded", () => {

    // SMOOTH SCROLL TO SECTION
    if (window.location.hash === "#services") {
        const servicesSection = document.getElementById("services");
        if (servicesSection) {
            setTimeout(() => {
                servicesSection.scrollIntoView({ behavior: "smooth" });
            }, 100);
        }
    }

    // CART INITIALIZATION
    initCartModal();
    updateCartCount();
    renderCart(); // Render cart if there are items

    // NOTIFICATIONS INITIALIZATION
    initNotifications();

   // ACTIVATE SPECIFIC TAB IF FLAGGED
    const tabToActivate = localStorage.getItem("activateTab");
    if (tabToActivate) {
        const tabButton = document.querySelector(`.tabs button[data-tab="${tabToActivate}"]`);
        if (tabButton) tabButton.click(); // Trigger tab switch
        localStorage.removeItem("activateTab"); // Clear flag
    }
});

/* CART FUNCTIONS */

// Get cart from localStorage
function getCart() {
    return JSON.parse(localStorage.getItem("cart")) || [];
}

// Save cart to localStorage and update count
function saveCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
}

// Add a product to the cart
function addToCart(product) {
    let cart = getCart();
    const existing = cart.find(p => p.id === product.id);
    if (existing) {
        existing.quantity++;
    } else {
        product.quantity = 1;
        cart.push(product);
    }
    saveCart(cart);
    renderCart();
    alert(`${product.name} added to cart!`);
}

// Update cart icon/badge count
function updateCartCount() {
    const cartCount = document.getElementById("cartCount");
    if (!cartCount) return;

    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

    cartCount.textContent = totalItems;
    cartCount.style.display = totalItems > 0 ? "inline-block" : "none";
}

// Render cart items in modal
function renderCart() {
    const cartItemsContainer = document.getElementById("cartItems");
    const cartTotal = document.getElementById("cartTotal");
    if (!cartItemsContainer || !cartTotal) return;

    const cart = getCart();
    cartItemsContainer.innerHTML = "";
    let total = 0;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = "<p>Your cart is empty.</p>";
        cartTotal.textContent = "₱0";
        return;
    }

    cart.forEach(item => {
        const qty = item.quantity || 1;
        const subtotal = item.price * qty;
        total += subtotal;

        cartItemsContainer.innerHTML += `
            <div class="cart-item">
                <div>
                    <strong>${item.name}</strong><br>
                    ₱${item.price.toLocaleString()}
                </div>
                <div class="action-group">
                    <div class="counter-box">
                        <button type="button" onclick="changeQty(${item.id}, -1)">−</button>
                        <input type="number" value="${qty}" min="1" readonly>
                        <button type="button" onclick="changeQty(${item.id}, 1)">+</button>
                    </div>
                    <button class="btn btn-sm btn-danger ms-2" onclick="removeFromCart(${item.id})">✖</button>
                </div>
            </div>
        `;
    });

    cartTotal.textContent = "₱" + total.toLocaleString();
}

// Change quantity of a cart item
function changeQty(productId, delta) {
    let cart = getCart();
    const item = cart.find(i => i.id === productId);
    if (!item) return;

    item.quantity = (item.quantity || 1) + delta;
    if (item.quantity <= 0) {
        cart = cart.filter(i => i.id !== productId);
    }

    saveCart(cart);
    renderCart();
}

// Remove item from cart
function removeFromCart(productId) {
    let cart = getCart().filter(i => i.id !== productId);
    saveCart(cart);
    renderCart();
}

// Initialize cart modal open/close
function initCartModal() {
    const cartModal = document.getElementById("cartModal");
    const cartButton = document.getElementById("cartButton");
    const cartClose = document.querySelector(".cart-close");

    if (!cartModal || !cartButton || !cartClose) return;

    cartButton.addEventListener("click", e => {
        e.preventDefault();
        renderCart();
        cartModal.style.display = "block";
    });

    cartClose.addEventListener("click", () => cartModal.style.display = "none");

    window.addEventListener("click", e => {
        if (e.target === cartModal) cartModal.style.display = "none";
    });
}

/* ===========================
   NOTIFICATIONS FUNCTIONS
=========================== */

// Initialize notifications
function initNotifications() {
    const notificationBadge = document.getElementById("notificationCount");
    const notificationModal = document.getElementById("notificationModal");
    const notificationModalBody = document.querySelector("#notificationModal .modal-body");

    if (!notificationBadge || !notificationModal || !notificationModalBody) return;

    // Load notifications immediately
    loadNotifications();

    // Mark all as read when modal opens
    notificationModal.addEventListener('show.bs.modal', () => {
        markAllNotificationsRead();
    });
}

// Load notifications into the modal
function loadNotifications() {
    const notifications = JSON.parse(localStorage.getItem("notifications")) || [];
    const notificationModalBody = document.querySelector("#notificationModal .modal-body");
    const notificationBadge = document.getElementById("notificationCount");

    if (!notificationModalBody || !notificationBadge) return;

    // Clear modal content
    notificationModalBody.innerHTML = "";

    if (notifications.length === 0) {
        notificationModalBody.innerHTML = `
            <div class="text-center text-muted py-4 empty-notification">
                No notifications yet
            </div>
        `;
        updateNotificationBadge();
        return;
    }

    // Display each notification
    notifications.slice().reverse().forEach(notif => {
        const div = document.createElement("div");
        div.classList.add("notification-item", "p-2", "border-bottom");
        if (!notif.read) div.classList.add("fw-bold"); // Unread bold

        div.innerHTML = `
            <strong>${notif.title}</strong><br>
            ${notif.date}<br>
            ${notif.message}
        `;

        // On click: mark read and redirect
        div.addEventListener("click", () => {
            notif.read = true;
            localStorage.setItem("notifications", JSON.stringify(notifications));
            updateNotificationBadge();

            if (notif.url) {
                // Navigate to Cart page and flag the Ordered tab
                window.location.href = "/Ecommerce/Cart/CartIndex";
                localStorage.setItem("activateTab", "Ordered");
            }
        });

        notificationModalBody.appendChild(div);
    });

    updateNotificationBadge();
}

// Update notification badge count
function updateNotificationBadge() {
    const notificationBadge = document.getElementById("notificationCount");
    if (!notificationBadge) return;

    const notifications = JSON.parse(localStorage.getItem("notifications")) || [];
    const unreadCount = notifications.filter(n => !n.read).length;

    if (unreadCount > 0) {
        notificationBadge.textContent = unreadCount;
        notificationBadge.style.display = "inline-block";
    } else {
        notificationBadge.textContent = "";
        notificationBadge.style.display = "none";
    }
}

// Mark all notifications as read
function markAllNotificationsRead() {
    const notifications = JSON.parse(localStorage.getItem("notifications")) || [];
    notifications.forEach(n => n.read = true);
    localStorage.setItem("notifications", JSON.stringify(notifications));
    updateNotificationBadge();
}

// Push a new order notification
function pushOrderNotification(order) {
    const notifications = JSON.parse(localStorage.getItem("notifications")) || [];

    const newNotif = {
        id: Date.now(),
        title: `Order #${order.id}`,
        date: new Date().toLocaleString(),
        message: order.items.map(i => `${i.name} x${i.quantity}`).join(", "),
        url: "/Ecommerce/Cart/CartIndex#Ordered" // Redirect to Ordered tab
    };

    notifications.push(newNotif);
    localStorage.setItem("notifications", JSON.stringify(notifications));

    loadNotifications(); // Refresh modal
}


/*Product slide*/


    let currentSlide = 0;

    function moveSlide(direction) {
    const slides = document.querySelectorAll('.deal-slide');
    const totalSlides = slides.length;

    currentSlide += direction;

    if (currentSlide < 0) {
        currentSlide = totalSlides - 1;
    }

    if (currentSlide >= totalSlides) {
        currentSlide = 0;
    }

    const track = document.querySelector('.deals-track');
    track.style.transform = `translateX(-${currentSlide * 100}%)`;
}


/* PRODUCT JS */

document.querySelectorAll('.dropdown-item')

    .forEach(item => {

        item.addEventListener('click', function () {

            const category = item.closest('.text-dropdown')

                .querySelector('.dropdown-label')

                .innerText.trim();

            let queryParams =

                new URLSearchParams();

            /* BRANDS */

            if (category.includes('Brands')) {

                queryParams.set(
                    'brands',
                    item.dataset.value
                );
            }

            /* HP */

            else if (category.includes('HP')) {

                queryParams.set(
                    'hp',
                    parseFloat(
                        item.dataset.value
                    )
                );
            }

            /* FORM FACTORS */

            else if (
                category.includes('Form')
            ) {

                queryParams.set(
                    'formFactors',
                    item.dataset.value
                );
            }

            /* SORT */

            else if (
                category.includes('Sort')
            ) {

                queryParams.set(
                    'sort',
                    item.dataset.value
                );
            }

            /* REDIRECT */

            window.location.href =

                `/Shop/Home/Search?${queryParams.toString()}`;
        });
    });

/* 
   PRESET BUTTONS*/

document.getElementById("b1")
    ?.addEventListener("click", () => {

        window.location.href =
            "/Shop/Home/Search?preset=newest";
    });

document.getElementById("b2")
    ?.addEventListener("click", () => {

        window.location.href =
            "/Shop/Home/Search?preset=best-deals";
    });

document.getElementById("b3")
    ?.addEventListener("click", () => {

        window.location.href =
            "/Shop/Home/Search?preset=special-picks";
    });

document.getElementById("b4")
    ?.addEventListener("click", () => {

        window.location.href =
            "/Shop/Home/Search?preset=favorites";
    });


// Mobile dropdown toggle (click-based for touch screens)
if (window.innerWidth <= 480) {
    document.querySelectorAll('#tb .text-dropdown').forEach(dropdown => {
        dropdown.addEventListener('click', function (e) {
            const menu = this.querySelector('.dropdown-menu');
            const isVisible = menu.style.display === 'block';

            // Close all other dropdowns first
            document.querySelectorAll('#tb .dropdown-menu').forEach(m => {
                m.style.display = 'none';
            });

            // Toggle clicked one
            menu.style.display = isVisible ? 'none' : 'block';

            e.stopPropagation(); // prevent bubbling
        });
    });

    // Close when tapping outside
    document.addEventListener('click', function () {
        document.querySelectorAll('#tb .dropdown-menu').forEach(m => {
            m.style.display = 'none';
        });
    });
}