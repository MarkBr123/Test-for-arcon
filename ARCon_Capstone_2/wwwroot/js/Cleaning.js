// ================= INIT =================
document.addEventListener('DOMContentLoaded', initForm);

let airconCounter = 1;

const API_CACHE = {
    airconTypes: null,
    categories: null,
    serviceMap: {} // "acTypeId-categoryId" → serviceId
};

async function initForm() {
    await preloadDropdownData();
    initAircon(1);
    setupEventDelegation();
    setupNavigation();
}

// ================= PRELOAD =================
async function preloadDropdownData() {
    if (!API_CACHE.airconTypes) {
        API_CACHE.airconTypes = await fetch('/api/service-aircon-types/dropdown')
            .then(r => r.json());
    }

    if (!API_CACHE.categories) {
        const allCategories = await fetch('/api/service-categories/dropdown')
            .then(r => r.json());

        API_CACHE.categories = allCategories.filter(c =>
            c.serviceClass === "CLEANING"
        );
    }

    populateInitialDropdowns();
}

function populateInitialDropdowns() {
    document.querySelectorAll('.ac-type').forEach(select => {
        select.innerHTML = '<option value="">Select AC Type...</option>';
        API_CACHE.airconTypes.forEach(t =>
            select.appendChild(new Option(t.name, t.id))
        );
    });

    document.querySelectorAll('.service-type').forEach(select => {
        select.innerHTML = '<option value="">Select Service...</option>';
        API_CACHE.categories.forEach(c =>
            select.appendChild(new Option(c.name, c.id))
        );
    });
}

// ================= AIRCON LOGIC =================
function initAircon(id) {
    const acType = document.getElementById(`acType-${id}`);
    const service = document.getElementById(`serviceType-${id}`);
    const priceTier = document.getElementById(`priceTier-${id}`);

    if (!acType || !service || !priceTier) return;

    acType.addEventListener('change', () => updatePriceTierDropdown(id));
    service.addEventListener('change', () => updatePriceTierDropdown(id));
    priceTier.addEventListener('change', updateTotal);
}

async function updatePriceTierDropdown(id) {
    const acTypeId = document.getElementById(`acType-${id}`).value;
    const categoryId = document.getElementById(`serviceType-${id}`).value;
    const priceTier = document.getElementById(`priceTier-${id}`);

    if (!acTypeId || !categoryId) {
        priceTier.innerHTML = '<option value="">Select Service first</option>';
        priceTier.disabled = true;
        return;
    }

    const key = `${acTypeId}-${categoryId}`;
    let serviceId = API_CACHE.serviceMap[key];

    if (!serviceId) {
        const res = await fetch(
            `/api/services/by-combo?categoryId=${categoryId}&airconTypeId=${acTypeId}`
        );

        if (!res.ok) {
            priceTier.innerHTML = '<option value="">No service available</option>';
            priceTier.disabled = true;
            updateTotal();
            return;
        }

        const svc = await res.json();
        serviceId = svc.id;
        API_CACHE.serviceMap[key] = serviceId;
    }

    const tiers = await fetch(`/api/service-price-tiers/by-service/${serviceId}`)
        .then(r => r.json());

    if (!tiers || tiers.length === 0) {
        priceTier.innerHTML = '<option value="">No service available</option>';
        priceTier.disabled = true;
        updateTotal();
        return;
    }

    priceTier.innerHTML = '<option value="">Select Price Tier...</option>';
    priceTier.disabled = false;

    tiers.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.id;
        opt.dataset.price = t.price;
        opt.textContent =
            `${t.min} - ${t.max} ${t.unit} — ₱${t.price.toLocaleString()}`;
        priceTier.appendChild(opt);
    });

    updateTotal();
}

// ================= TOTAL =================
function updateTotal() {
    let total = 0;

    document.querySelectorAll('.aircon-entry').forEach(entry => {
        const id = entry.dataset.airconId;
        const tier = document.getElementById(`priceTier-${id}`);
        const units = entry.querySelector('.units-input');

        if (!tier || !units) return;

        const price = Number(tier.selectedOptions[0]?.dataset.price || 0);
        const count = Number(units.value || 1);

        total += price * count;
    });

    const el = document.getElementById('estimatedPrice');
    if (el) el.textContent = `₱ ${total.toLocaleString()}`;
}

// ================= UI EVENTS =================
function setupEventDelegation() {
    document.addEventListener('click', e => {

        // + Units
        if (e.target.classList.contains('plus')) {
            const input = e.target.parentElement.querySelector('.units-input');
            if (input && input.value < 10) input.value++;
            updateTotal();
        }

        // − Units
        if (e.target.classList.contains('minus')) {
            const input = e.target.parentElement.querySelector('.units-input');
            if (input && input.value > 1) input.value--;
            updateTotal();
        }

        // Add Aircon
        if (e.target.id === 'addAirconBtn' || e.target.closest('#addAirconBtn')) {
            addAircon();
        }

        // Remove Aircon
        if (e.target.classList.contains('remove-aircon-btn')) {
            const entry = e.target.closest('.aircon-entry');
            if (entry && document.querySelectorAll('.aircon-entry').length > 1) {
                entry.remove();
                renumberAircons();
                updateTotal();
            }
        }
    });

    document.addEventListener('input', e => {
        if (e.target.classList.contains('units-input')) updateTotal();
    });
}

// ================= ADD AIRCON =================
function addAircon() {
    airconCounter++;
    const id = airconCounter;

    const html = `
    <div class="aircon-entry" data-aircon-id="${id}">
        <div class="aircon-entry-header">
            <div class="aircon-entry-title">Aircon #${id}</div>
            <button type="button" class="remove-aircon-btn">Remove</button>
        </div>

        <div class="aircon-entry-content">
            <div class="form-group">
                <label>AC Type *</label>
                <select id="acType-${id}" class="ac-type" required></select>
            </div>
            <div class="form-group">
                <label>Service Type *</label>
                <select id="serviceType-${id}" class="service-type" required></select>
            </div>
        </div>

        <div class="aircon-entry-content">
            <div class="form-group">
                <label>Price Tier *</label>
                <select id="priceTier-${id}" class="price-tier" required></select>
            </div>
            <div class="form-group">
                <label>Brand</label>
                <select id="brand-${id}" class="aircon-brand">
                    <option value="">Select Brand...</option>
                    <option value="samsung">Samsung</option>
                    <option value="lg">LG</option>
                    <option value="panasonic">Panasonic</option>
                    <option value="daikin">Daikin</option>
                    <option value="koppel">Koppel</option>
                    <option value="other">Other</option>
                </select>
            </div>
        </div>

        <div class="units-warranty">
            <div class="form-group">
                <label>Units *</label>
                <div class="counter-box">
                    <button type="button" class="minus">−</button>
                    <input class="units-input" type="number" value="1" min="1" max="10">
                    <button type="button" class="plus">+</button>
                </div>
            </div>
        </div>
    </div>
    `;

    document.getElementById('airconEntries')
    .insertAdjacentHTML('beforeend', html);
    populateDropdownsFor(id); // ✅ ONLY new one
    initAircon(id);
}

// ================= HELPERS =================
function renumberAircons() {
    document.querySelectorAll('.aircon-entry')
        .forEach((entry, i) =>
            entry.querySelector('.aircon-entry-title').textContent = `Aircon #${i + 1}`
        );
}

function getEntrySignature(entry) {
    const id = entry.dataset.airconId;
    const acType = document.getElementById(`acType-${id}`)?.value || '';
    const service = document.getElementById(`serviceType-${id}`)?.value || '';
    const tier = document.getElementById(`priceTier-${id}`)?.value || '';
    const brand = document.getElementById(`brand-${id}`)?.value || '';
    return `${acType}|${service}|${tier}|${brand}`;
}

function mergeDuplicateAircons() {
    const entries = Array.from(document.querySelectorAll('.aircon-entry'));
    const map = new Map();

    for (const entry of entries) {
        const sig = getEntrySignature(entry);
        const unitsInput = entry.querySelector('.units-input');
        const units = Number(unitsInput?.value || 1);

        if (!sig || sig.includes('||')) continue;

        if (map.has(sig)) {
            const existing = map.get(sig);
            const existingUnitsInput = existing.querySelector('.units-input');
            existingUnitsInput.value =
                Number(existingUnitsInput.value) + units;
            entry.remove();
        } else {
            map.set(sig, entry);
        }
    }

    renumberAircons();
    updateTotal();
}

function populateDropdownsFor(id) {
    const acTypeSelect = document.getElementById(`acType-${id}`);
    const serviceSelect = document.getElementById(`serviceType-${id}`);

    if (acTypeSelect) {
        acTypeSelect.innerHTML = '<option value="">Select AC Type...</option>';
        API_CACHE.airconTypes.forEach(t =>
            acTypeSelect.appendChild(new Option(t.name, t.id))
        );
    }

    if (serviceSelect) {
        serviceSelect.innerHTML = '<option value="">Select Service...</option>';
        API_CACHE.categories.forEach(c =>
            serviceSelect.appendChild(new Option(c.name, c.id))
        );
    }
}

// ================= NAVIGATION =================
function setupNavigation() {
    const nextBtn = document.getElementById('nextBtn');
    if (!nextBtn) return;

    nextBtn.addEventListener('click', () => {

        // 🚫 Not logged in
        if (!IS_LOGGED_IN) {
            const returnUrl = encodeURIComponent(window.location.pathname);
            window.location.href = `/Shop/Home/Login?returnUrl=${returnUrl}`;
            return;
        }

        const entries = document.querySelectorAll('.aircon-entry');

        // 🚫 No aircon
        if (entries.length === 0) {
            alert('Please add at least one aircon service.');
            return;
        }

        // 🚫 Validate each
        for (const entry of entries) {
            const id = entry.dataset.airconId;

            const acType = document.getElementById(`acType-${id}`);
            const service = document.getElementById(`serviceType-${id}`);
            const tier = document.getElementById(`priceTier-${id}`);
            const units = entry.querySelector('.units-input');

            const invalidUnits = !units || !units.value || Number(units.value) < 1;

            if (
                !acType?.value ||
                !service?.value ||
                !tier?.value ||
                tier?.disabled ||
                invalidUnits
            ) {
                alert(`Aircon #${id} is incomplete.`);
                entry.scrollIntoView({ behavior: 'smooth', block: 'center' });
                entry.style.border = '2px solid #e53935';
                setTimeout(() => entry.style.border = '', 2000);
                return;
            }
        }

        // 🔁 Merge duplicates
        mergeDuplicateAircons();

        // ✅ Proceed
        document.getElementById('page1').classList.remove('active');
        document.getElementById('page2').classList.add('active');

        nextBtn.classList.add('hidden');
        document.getElementById('backBtn').classList.remove('hidden');
        document.getElementById('submitBtn').classList.remove('hidden');

        // progress indicator
        document.querySelectorAll('.progress-step')[0].classList.remove('active');
        document.querySelectorAll('.progress-step')[1].classList.add('active');

        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ================= BACK BUTTON =================
document.addEventListener('DOMContentLoaded', () => {

    const backBtn = document.getElementById('backBtn');
    if (!backBtn) return;

    backBtn.addEventListener('click', () => {

        // Show Page 1
        document.getElementById('page2').classList.remove('active');
        document.getElementById('page1').classList.add('active');

        // Toggle buttons
        document.getElementById('backBtn').classList.add('hidden');
        document.getElementById('submitBtn').classList.add('hidden');
        document.getElementById('nextBtn').classList.remove('hidden');

        // Progress indicator
        const steps = document.querySelectorAll('.progress-step');
        if (steps.length >= 2) {
            steps[1].classList.remove('active');
            steps[0].classList.add('active');
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

});

//////////////////// ADDRESS MODAL ////////////////////

const addressModal = document.getElementById('addressModal');
const container = document.getElementById("addressListContainer");
const chooseAddressBtn = document.getElementById('chooseAddressBtn');
const selectedAddressBox = document.getElementById('selectedAddressBox');
const selectedAddressText = document.getElementById('selectedAddressText');
const customerAddressIdInput = document.getElementById('customerAddressId');
const changeAddressBtn = document.getElementById('changeAddressBtn');


// ================= OPEN MODAL =================
async function openAddressModal() {
    const modal = bootstrap.Modal.getOrCreateInstance(addressModal);
    modal.show();
    await loadCustomerAddresses();
}

chooseAddressBtn?.addEventListener('click', openAddressModal);
changeAddressBtn?.addEventListener('click', openAddressModal);


// ================= LOAD ADDRESSES =================
async function loadCustomerAddresses() {

    container.innerHTML = `<div class="loading">Loading addresses...</div>`;

    try {
        const res = await fetch('/api/shop/addresses', {
            credentials: "same-origin"
        });

        if (!res.ok) throw new Error('Failed to load');

        const addresses = await res.json();

        container.innerHTML = '';

        if (!addresses.length) {
            container.innerHTML = `
                <div class="empty">
                    No saved addresses found.
                </div>`;
            return;
        }

        addresses.forEach(addr => {

            // ✅ Normalize casing (camelCase or PascalCase — both work)
            const barangay = addr.barangay ?? addr.Barangay ?? '';
            const municipality = addr.municipality ?? addr.Municipality ?? '';
            const province = addr.province ?? addr.Province ?? '';
            const region = addr.region ?? addr.Region ?? '';

            const card = document.createElement('div');
            card.className = 'address-card';
            if (addr.is_default) card.classList.add('default');

            card.innerHTML = `
                <div class="addr-main">
                    ${addr.house_unit ?? ''}, ${addr.street_name ?? ''}
                </div>
                <div class="addr-sub">
                    ${barangay}, ${municipality}, ${province}
                </div>
                <div class="addr-sub">
                    ${region} • ${addr.zip_code ?? ''}
                </div>
                ${addr.landmark ? `<div class="addr-sub">Landmark: ${addr.landmark}</div>` : ''}
                ${addr.is_default ? `<div class="addr-badge">Default</div>` : ''}
            `;

            card.addEventListener('click', () => selectAddress(addr));
            container.appendChild(card);
        });

    } catch (err) {
        container.innerHTML = `
            <div class="error">
                Failed to load addresses.
            </div>`;
        console.error(err);
    }
}


// ================= SELECT ADDRESS =================
function selectAddress(addr) {

    // ✅ Normalize casing
    const barangay = addr.barangay ?? addr.Barangay ?? '';
    const municipality = addr.municipality ?? addr.Municipality ?? '';
    const province = addr.province ?? addr.Province ?? '';
    const region = addr.region ?? addr.Region ?? '';

    // Save ID
    customerAddressIdInput.value = addr.id;

    // Show preview
    selectedAddressBox.classList.remove('hidden');

    selectedAddressText.innerHTML = `
        <strong>${addr.house_unit ?? ''}, ${addr.street_name ?? ''}</strong><br>
        ${barangay}, ${municipality}, ${province}<br>
        ${region} • ${addr.zip_code ?? ''}
        ${addr.landmark ? `<br>Landmark: ${addr.landmark}` : ''}
    `;

    // Close modal
    bootstrap.Modal.getInstance(addressModal)?.hide();
}