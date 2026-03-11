// ================= GLOBAL STATE =================
let airconCounter = 1;

const API_CACHE = {
    airconTypes: null,
    categories: null,
    serviceMap: {} // "acTypeId-categoryId" → serviceId
};

// ================= INIT =================
document.addEventListener('DOMContentLoaded', async () => {
    await preloadDropdownData();
    initAirconRow(1);
    wireUI();
});

// ================= PRELOAD =================
async function preloadDropdownData() {
    if (!API_CACHE.airconTypes) {
        API_CACHE.airconTypes = await fetch('/api/service-aircon-types/dropdown')
            .then(r => r.json());
    }

    if (!API_CACHE.categories) {
        const all = await fetch('/api/service-categories/dropdown')
            .then(r => r.json());

        API_CACHE.categories = all.filter(c => c.serviceClass === "CLEANING");
    }

    populateDropdownsFor(1);
}

function populateDropdownsFor(id) {
    const acSel = document.getElementById(`acType-${id}`);
    const svcSel = document.getElementById(`serviceType-${id}`);

    if (acSel) {
        acSel.innerHTML = '<option value="">Select AC Type...</option>';
        API_CACHE.airconTypes.forEach(t =>
            acSel.appendChild(new Option(t.name, t.id))
        );
    }

    if (svcSel) {
        svcSel.innerHTML = '<option value="">Select Service...</option>';
        API_CACHE.categories.forEach(c =>
            svcSel.appendChild(new Option(c.name, c.id))
        );
    }
}

// ================= AIRCON ROW =================
function initAirconRow(id) {
    const ac = document.getElementById(`acType-${id}`);
    const svc = document.getElementById(`serviceType-${id}`);
    const tier = document.getElementById(`priceTier-${id}`);

    ac?.addEventListener('change', () => loadPriceTiers(id));
    svc?.addEventListener('change', () => loadPriceTiers(id));
    tier?.addEventListener('change', updateTotal);
}

async function loadPriceTiers(id) {
    const acId = document.getElementById(`acType-${id}`).value;
    const catId = document.getElementById(`serviceType-${id}`).value;
    const tierSel = document.getElementById(`priceTier-${id}`);

    if (!acId || !catId) {
        tierSel.innerHTML = '<option value="">Select Service first</option>';
        tierSel.disabled = true;
        return;
    }

    const key = `${acId}-${catId}`;
    let serviceId = API_CACHE.serviceMap[key];

    if (!serviceId) {
        const res = await fetch(`/api/services/by-combo?categoryId=${catId}&airconTypeId=${acId}`);
        if (!res.ok) {
            tierSel.innerHTML = '<option value="">Unavailable</option>';
            tierSel.disabled = true;
            return;
        }
        const svc = await res.json();
        serviceId = svc.id;
        API_CACHE.serviceMap[key] = serviceId;
    }

    tierSel.dataset.serviceId = serviceId;

    const tiers = await fetch(`/api/service-price-tiers/by-service/${serviceId}`)
        .then(r => r.json());

    tierSel.innerHTML = '<option value="">Select Price Tier...</option>';
    tierSel.disabled = false;

    tiers.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.id;
        opt.dataset.price = t.price;
        opt.textContent = `${t.minHp}-${t.maxHp} HP — ₱${t.price.toLocaleString()}`;
        tierSel.appendChild(opt);
    });
}

// ================= TOTAL =================
function updateTotal() {
    let total = 0;

    document.querySelectorAll('.aircon-entry').forEach(entry => {
        const id = entry.dataset.airconId;
        const tier = document.getElementById(`priceTier-${id}`);
        const units = entry.querySelector('.units-input');

        const price = Number(tier?.selectedOptions[0]?.dataset.price || 0);
        const count = Math.max(1, Number(units?.value) || 1);

        total += price * count;
    });

    document.getElementById('estimatedPrice').textContent =
        `₱ ${total.toLocaleString()}`;
}

// ================= UI EVENTS =================
function wireUI() {

    // + − units
    document.addEventListener('click', e => {
        if (e.target.classList.contains('plus') ||
            e.target.classList.contains('minus')) {

            const input = e.target.parentElement.querySelector('.units-input');
            const delta = e.target.classList.contains('plus') ? 1 : -1;

            input.value = Math.min(10, Math.max(1, Number(input.value) + delta));
            updateTotal();
        }
    });

    // Add Aircon
    document.getElementById('addAirconBtn')?.addEventListener('click', addAircon);

    // Navigation
    document.getElementById('nextBtn')?.addEventListener('click', goNext);
    document.getElementById('backBtn')?.addEventListener('click', goBack);
    document.getElementById('submitBtn')?.addEventListener('click', submitBooking);
}

// ================= ADD ROW =================
function addAircon() {
    airconCounter++;
    const id = airconCounter;

    const html = `
    <div class="aircon-entry" data-aircon-id="${id}">
        <div class="aircon-entry-title">Service #${id}</div>

        <select id="acType-${id}" class="ac-type"></select>
        <select id="serviceType-${id}" class="service-type"></select>
        <select id="priceTier-${id}" class="price-tier"></select>

        <div class="counter-box">
            <button type="button" class="minus">−</button>
            <input class="units-input" type="number" value="1" min="1" max="10">
            <button type="button" class="plus">+</button>
        </div>
    </div>`;

    document.getElementById('airconEntries')
        .insertAdjacentHTML('beforeend', html);

    populateDropdownsFor(id);
    initAirconRow(id);
}

// ================= NAVIGATION =================
function goNext() {
    document.getElementById('page1').classList.remove('active');
    document.getElementById('page2').classList.add('active');
    document.getElementById('nextBtn').classList.add('hidden');
    document.getElementById('backBtn').classList.remove('hidden');
    document.getElementById('submitBtn').classList.remove('hidden');
}

function goBack() {
    document.getElementById('page2').classList.remove('active');
    document.getElementById('page1').classList.add('active');
    document.getElementById('nextBtn').classList.remove('hidden');
    document.getElementById('backBtn').classList.add('hidden');
    document.getElementById('submitBtn').classList.add('hidden');
}

// ================= SUBMIT =================
async function submitBooking() {
    const btn = document.getElementById('submitBtn');
    btn.disabled = true;
    btn.textContent = "Processing...";

    const payload = buildPayload();
    console.log("PAYLOAD:", payload);

    try {
        const res = await fetch('/api/service-bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify(payload)
        });

        const text = await res.text();
        if (!res.ok) throw new Error(text);

        const data = JSON.parse(text);
        window.location.href = `/Shop/Booking/Success?id=${data.bookingId}`;

    } catch (err) {
        console.error(err);
        alert("Booking failed.");
        btn.disabled = false;
        btn.textContent = "Book Service";
    }
}

function buildPayload() {
    const addressId = Number(document.getElementById('customerAddressId').value);
    const scheduleDate = document.getElementById('scheduleDate').value;
    const preferredTime = document.getElementById('preferredTime').value;
    const propertyType = document.querySelector('[name="property_type"]').value;
    const paymentMethod = document.querySelector('input[name="payment_method"]:checked')?.value;

    const sbitems = [];

    document.querySelectorAll('.aircon-entry').forEach(entry => {
        const id = entry.dataset.airconId;
        const tier = document.getElementById(`priceTier-${id}`);
        const units = entry.querySelector('.units-input');
        const opt = tier.selectedOptions[0];

        const serviceId = Number(tier.dataset.serviceId);
        if (!serviceId) return;

        sbitems.push({
            services_id: serviceId,
            service_price_tiers_id: Number(tier.value),
            unit_count: Number(units.value),
            price: Number(opt.dataset.price)
        });
    });

    return {
        customer_addresses_id: addressId,
        schedule_date: scheduleDate,
        preferred_time: preferredTime ? preferredTime + ":00" : null,
        property_type: propertyType,
        payment_method: paymentMethod,
        sbitems
    };
}