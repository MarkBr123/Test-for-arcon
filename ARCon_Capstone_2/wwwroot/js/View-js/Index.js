document.addEventListener("DOMContentLoaded", () => {

    //Services smooth scroll
    if (window.location.hash === "#services") {
        const servicesSection = document.getElementById("services");
        if (servicesSection) {
            setTimeout(() => {
                servicesSection.scrollIntoView({ behavior: "smooth" });
            }, 100);
        }
    }

    //Cart modal controls
    const cartModal = document.getElementById("cartModal");
    const cartButton = document.getElementById("cartButton");
    const closeBtn = document.querySelector(".cart-close");

    if (cartButton && cartModal && closeBtn) {
        cartButton.addEventListener("click", e => {
            e.preventDefault();
            renderCart();
            cartModal.style.display = "block";
        });

        closeBtn.addEventListener("click", () => {
            cartModal.style.display = "none";
        });

        window.addEventListener("click", e => {
            if (e.target === cartModal) {
                cartModal.style.display = "none";
            }
        });
    }

    updateCartCount();
});

/*for cart*/

function getCart() {
    return JSON.parse(localStorage.getItem("cart")) || [];
}

function saveCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
}

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

function renderCart() {
    const cartItemsContainer = document.getElementById("cartItems");
    const cartTotal = document.getElementById("cartTotal");
    const cart = getCart();

    cartItemsContainer.innerHTML = "";
    let total = 0;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = "<p>Your cart is empty.</p>";
        cartTotal.textContent = "₱0";
        return;
    }

    cart.forEach(item => {
        total += item.price * item.quantity;
        cartItemsContainer.innerHTML += `
                <div class="cart-item">
                    <strong>${item.name}</strong> - ₱${item.price} × ${item.quantity}
                </div>
            `;
    });

    cartTotal.textContent = "₱" + total;
}

// Initialize cart modal display
const cartModal = document.getElementById("cartModal");
const cartIcon = document.getElementById("cartButton");
const cartClose = document.querySelector(".cart-close");

cartIcon.addEventListener("click", e => {
    e.preventDefault();
    renderCart();
    cartModal.style.display = "block";
});

cartClose.addEventListener("click", () => cartModal.style.display = "none");

window.addEventListener("click", e => {
    if (e.target == cartModal) cartModal.style.display = "none";
});

// CART LOGIC 
function getCart() {
    return JSON.parse(localStorage.getItem("cart")) || [];
}

function saveCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
}

function updateCartCount() {
    const cartCount = document.getElementById("cartCount");
    if (!cartCount) return;

    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

    cartCount.textContent = totalItems;
    cartCount.style.display = totalItems > 0 ? "inline-block" : "none";
}

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

function removeFromCart(productId) {
    let cart = getCart().filter(i => i.id !== productId);
    saveCart(cart);
    renderCart();
}

/*Direct to product page*/
function goToProduct() {
    window.location.href = '@Url.Action("Product", "Product", new { area = "Shop" })';
}
