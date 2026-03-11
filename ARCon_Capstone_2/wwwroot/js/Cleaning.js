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
            priceTier.innerHTML = '<option value="">No price tier available</option>';
            priceTier.disabled = true;
            updateTotal();
            return;
        }

        const svc = await res.json();
        serviceId = svc.id;
        API_CACHE.serviceMap[key] = serviceId;
    }
    priceTier.dataset.serviceId = serviceId;
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
    opt.dataset.unit = t.unit;
    opt.dataset.min = t.capacity_min_range;
    opt.dataset.max = t.capacity_max_range;

        const fmt = n => Number(n).toFixed(1).replace(/\.0$/, '');
        opt.textContent = `${fmt(t.min)}-${fmt(t.max)} ${t.unit} — ₱${t.price.toLocaleString()}`;

        priceTier.appendChild(opt);
        console.log(t);
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
            <div class="aircon-entry-title">Service #${id}</div>
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
                                            <option value="Samsung">Samsung</option>
                                            <option value="LG">LG</option>
                                            <option value="Panasonic">Panasonic</option>
                                            <option value="Daikin">Daikin</option>
                                            <option value="Koppel">Koppel</option>
                                            <option value="Fujidenzo">Fujidenzo</option>
                                            <option value="Sharp">Sharp</option>
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
            entry.querySelector('.aircon-entry-title').textContent = `Service #${i + 1}`
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
                alert(`Service #${id} is incomplete.`);
                entry.scrollIntoView({ behavior: 'smooth', block: 'center' });
                entry.style.border = '2px solid #e53935';
                setTimeout(() => entry.style.border = '', 2000);
                return;
            }
        }

        // ✅ Merge same configs
        mergeDuplicateAircons();

        // ✅ Then render summary
        renderAirconSummary();

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
        updateTotal();
    });


}


document.addEventListener('DOMContentLoaded', () => {

    // ================= BACK BUTTON LOGIC =================
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
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
    }


    // ================= CUSTOMER TYPE → BUSINESS FIELD =================
    const businessNameInput = document.getElementById("businessName");
    const customerTypeRadios = document.querySelectorAll('input[name="customer_type"]');

    function updateBusinessField() {
        const selected = document.querySelector('input[name="customer_type"]:checked')?.value;
    const isBusiness = selected === "BUSINESS";

    businessNameInput.disabled = !isBusiness;
    businessNameInput.required = isBusiness;

    // Optional: clear value if switching to Personal
    if (!isBusiness) {
        businessNameInput.value = "";
        }
    }

    // Run on page load
    updateBusinessField();

    // Run when radio changes
    customerTypeRadios.forEach(radio => {
        radio.addEventListener("change", updateBusinessField);
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

// ================= RENDER AIRCON SUMMARY (PAGE 2) =================
function renderAirconSummary() {
    const container = document.getElementById('airconSummaryContainer');
    if (!container) return;

    container.innerHTML = '';

    const entries = document.querySelectorAll('.aircon-entry');

    if (!entries.length) {
        container.innerHTML = '<div class="text-muted">No aircon services added.</div>';
        return;
    }

    entries.forEach((entry, index) => {
        const id = entry.dataset.airconId;

        // ✅ FIXED IDs
        const acTypeText = getSelectedText(`acType-${id}`);
        const serviceText = getSelectedText(`serviceType-${id}`);
        const tierText = getSelectedText(`priceTier-${id}`);
        const brandText = getSelectedText(`brand-${id}`);

        const units = entry.querySelector('.units-input')?.value || 1;

        const card = document.createElement('div');
        card.className = 'card p-3 mb-3';

        card.innerHTML = `
                <div class="svc-row">

                    <div class="svc-left">
                        <div class="svc-title">Service #${index + 1}</div>
                        <div class="svc-meta">
                            ${acTypeText} • ${serviceText}
                        </div>
                    </div>

                    <div class="svc-mid">
                        <div class="svc-tier">${tierText}</div>
                        <div class="svc-brand">${brandText}</div>
                    </div>

                    <div class="svc-right">
                        ${units} unit${units > 1 ? 's' : ''}
                    </div>

                </div>
            `;

        container.appendChild(card);
    });
}


// ================= HELPER =================
function getSelectedText(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return '-';

    const option = select.options[select.selectedIndex];

    // placeholder usually has value=""
    if (!option || !option.value) return '-';

    return option.textContent.trim();
}

///Post///
async function submitBooking() {

    const btn = document.getElementById('submitBtn');

    // ================= BASIC VALIDATION =================
    const addressId = Number(document.getElementById('customerAddressId')?.value);
    const scheduleDate = document.getElementById('scheduleDate')?.value;
    const propertyType = document.querySelector('[name="property_type"]')?.value;
    const paymentMethod = getRadioValue('payment_method');
    const preferredTimeInput = document.getElementById('preferredTime');
    const businessNameInput = document.getElementById("businessName");

    const showInfo = (msg) => {
        document.getElementById('infoMessage').textContent = msg;
        new bootstrap.Modal(document.getElementById('infoModal')).show();
    };

    if (!addressId) return showInfo("Please select a service address.");
    if (!scheduleDate) return showInfo("Please select your preferred service date.");
    if (!propertyType) return showInfo("Please select the property type.");
    if (!paymentMethod) return showInfo("Please choose a payment method.");

    // ================= BUILD PAYLOAD =================
    const payload = {
        customer_addresses_id: addressId,
        schedule_date: scheduleDate,
        preferred_time: preferredTimeInput.value
            ? preferredTimeInput.value + ":00"
            : null,
        property_type: propertyType.toUpperCase(),
        business_name: document.getElementById('businessName')?.value?.trim() || null,
        customer_note: document.querySelector('[name="customer_note"]')?.value || null,
        payment_method: paymentMethod.toUpperCase(),
        sbitems: []
    };

    // ================= COLLECT AIRCON ITEMS =================
    const entries = document.querySelectorAll('.aircon-entry');

    if (!entries.length) {
        return showInfo("Please add at least one aircon service.");
    }

    entries.forEach(entry => {
        const id = entry.dataset.airconId;
        const tierSelect = document.getElementById(`priceTier-${id}`);
        const unitsInput = entry.querySelector('.units-input');
        const brandSelect = document.getElementById(`brand-${id}`);

        const customerType = getRadioValue('customer_type');
        const businessName = document.getElementById('businessName')?.value?.trim();

        if (customerType === "BUSINESS" && !businessName) {
            return showInfo("Please enter your business name.");
        }

        if (!tierSelect?.value) return;

        const selectedOption = tierSelect.selectedOptions[0];
        const price = Number(selectedOption?.dataset.price || 0);
        const serviceId = Number(tierSelect.dataset.serviceId);

        if (!serviceId) return;

        payload.sbitems.push({
            services_id: serviceId,
            service_price_tiers_id: Number(tierSelect.value),
            unit_count: Math.max(1, Number(unitsInput?.value || 1)),
            unit_brand: brandSelect?.value || null,
            unit: selectedOption?.dataset.unit || null,
            capacity_range: selectedOption?.textContent || null,
            business_name: customerType === "BUSINESS" ? businessName : null,
            price: price
        });
    });

    if (!payload.sbitems.length) {
        return showInfo("Please complete the service details before booking.");
    }

    console.log("📦 BOOKING PAYLOAD:", payload);

    // ================= LOADING STATE =================
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';

    try {
        const res = await fetch("/api/service-bookings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify(payload)
        });

        const text = await res.text();

        let data;
        try {
            data = JSON.parse(text);
        } catch {
            throw new Error("Unexpected server response.");
        }

        // ================= SERVER VALIDATION ERROR =================
        if (!res.ok) {
            document.getElementById('errorMessage').textContent =
                data.message || "Booking could not be completed.";

            new bootstrap.Modal(
                document.getElementById('errorModal')
            ).show();

            btn.disabled = false;
            btn.textContent = "Book Service";
            return;
        }

        // ================= SUCCESS =================
        document.getElementById('successBookingId').textContent =
            data.reference ?? data.bookingId;

        const successModal = new bootstrap.Modal(
            document.getElementById('successModal')
        );
        successModal.show();

        // Auto redirect after 3s
        setTimeout(() => {
            window.location.href =
                `/Shop/Booking/Success?id=${data.bookingId}`;
        }, 10000);

        document.getElementById('successOkBtn').onclick = () => {
            window.location.href =
                `/Shop/Booking/Success?id=${data.bookingId}`;
        };

    } catch (err) {
        // ================= NETWORK ERROR =================
        document.getElementById('errorMessage').textContent =
            err.message || "Network error. Please check your connection.";

        const errorModal = new bootstrap.Modal(
            document.getElementById('errorModal')
        );
        errorModal.show();

        document.getElementById('retryBtn').onclick = () => {
            bootstrap.Modal.getInstance(
                document.getElementById('errorModal')
            ).hide();

            btn.disabled = false;
            btn.textContent = "Book Service";
        };
    }
}
function getRadioValue(name) {
    return document.querySelector(`input[name="${name}"]:checked`)?.value || null;
}

///Submit Button///
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('submitBtn')
        ?.addEventListener('click', async (e) => {
            e.preventDefault();
            await submitBooking();
        });
});

function updateBusinessField() {
    const selected = document.querySelector('input[name="customer_type"]:checked')?.value;
    const isBusiness = selected === "BUSINESS";

    businessNameInput.disabled = !isBusiness;
    businessNameInput.required = isBusiness;

    if (!isBusiness) businessNameInput.value = "";
}

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

    // Page 1 total
    const est = document.getElementById('estimatedPrice');
    if (est) est.textContent = `₱ ${total.toLocaleString()}`;

    // Page 2 total
    const final = document.getElementById('totalAmount');
    if (final) final.textContent = `₱ ${total.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}