document.addEventListener('DOMContentLoaded', function () {
    initForm();
});

const PRICE_DATA = {
    window_non_inverter: {
        "Standard Cleaning": [
            { range: "0.5 - 1.0HP", price: 600 },
            { range: "1.5 - 2.5HP", price: 700 }
        ],
        "Pulldown Deep Cleaning": [
            { range: "0.5 - 1.0HP", price: 800 },
            { range: "1.5 - 2.5HP", price: 1000 }
        ]
    },
    window_inverter: {
        "Standard Cleaning": [
            { range: "0.5 - 1.0HP", price: 700 },
            { range: "1.5 - 2.5HP", price: 800 }
        ],
        "Pulldown Deep Cleaning": [
            { range: "0.5 - 1.0HP", price: 900 },
            { range: "1.5 - 2.5HP", price: 1200 }
        ]
    },
    split_wall_mounted: {
        "Standard Cleaning": [
            { range: "1.0 - 1.5HP", price: 1400 },
            { range: "2.0 - 2.5HP", price: 1500 },
            { range: "3.0 - 4.0HP", price: 1700 }
        ],
        "Pulldown Deep Cleaning": [
            { range: "1.0 - 1.5HP", price: 2500 },
            { range: "2.0 - 2.5HP", price: 2700 },
            { range: "3.0 - 4.0HP", price: 3000 }
        ]
    },
    floor_mounted: {
        "Standard Cleaning": [{ range: "3TR - 6TR", price: 2800 }],
        "Pulldown Deep Cleaning": [{ range: "3TR - 6TR", price: 3500 }]
    },
    ceiling_suspended: {
        "Standard Cleaning": [{ range: "3TR - 6TR", price: 3500 }],
        "Pulldown Deep Cleaning": [{ range: "3TR - 6TR", price: 4500 }]
    },
    cassette_type: {
        "Standard Cleaning": [{ range: "3TR - 6TR", price: 3500 }],
        "Pulldown Deep Cleaning": [{ range: "3TR - 6TR", price: 4500 }]
    }
};

let airconCounter = 1;

function initForm() {
    console.log('Form initialized');

    const firstService = document.getElementById('serviceType-1');
    const firstPriceTier = document.getElementById('priceTier-1');

    if (firstService) {
        firstService.disabled = false;
        firstService.innerHTML = '<option value="">Select AC Type first</option>';
    }

    if (firstPriceTier) {
        firstPriceTier.disabled = false;
        firstPriceTier.innerHTML = '<option value="">Select Service first</option>';
    }

    initAircon(1);
    setupEventDelegation();
    setupNavigation();

    console.log('Init complete, PRICE_DATA:', PRICE_DATA);
}

function initAircon(id) {
    const acType = document.getElementById(`acType-${id}`);
    const service = document.getElementById(`serviceType-${id}`);
    const priceTier = document.getElementById(`priceTier-${id}`);

    if (!acType || !service || !priceTier) {
        console.error(`Could not find elements for aircon ${id}`);
        return;
    }

    console.log(`Initializing aircon ${id}`);

    service.disabled = false;
    priceTier.disabled = false;

    acType.addEventListener('change', function () {
        console.log(`AC type changed for ${id}:`, this.value);
        updateServiceDropdown(id);
    });

    service.addEventListener('change', function () {
        console.log(`Service changed for ${id}:`, this.value);
        updatePriceTierDropdown(id);
    });

    priceTier.addEventListener('change', function () {
        console.log(`Price tier changed for ${id}:`, this.value);
        updateTotal();
    });

    console.log(`Aircon ${id} initialized successfully`);
}

function updateServiceDropdown(id) {
    console.log(`Updating service dropdown for ${id}`);

    const acType = document.getElementById(`acType-${id}`);
    const service = document.getElementById(`serviceType-${id}`);
    const priceTier = document.getElementById(`priceTier-${id}`);

    if (!acType || !service || !priceTier) {
        console.error(`Elements not found for ${id}`);
        return;
    }

    console.log(`Selected AC type: ${acType.value}`);

    if (!acType.value) {
        service.innerHTML = '<option value="">Select AC Type first</option>';
        service.disabled = true;
        priceTier.innerHTML = '<option value="">Select Service first</option>';
        priceTier.disabled = true;
        return;
    }

    service.innerHTML = '<option value="">Select Service...</option>';
    service.disabled = false;

    priceTier.innerHTML = '<option value="">Select Service first</option>';
    priceTier.disabled = true;

    const services = PRICE_DATA[acType.value];
    console.log(`Services for ${acType.value}:`, services);

    if (services) {
        Object.keys(services).forEach(serviceName => {
            const option = document.createElement('option');
            option.value = serviceName;
            option.textContent = serviceName;
            service.appendChild(option);
        });
        console.log(`Added ${Object.keys(services).length} services to dropdown`);
    } else {
        console.warn(`No services found for AC type: ${acType.value}`);
        service.innerHTML = '<option value="">No services available</option>';
    }

    updateTotal();
}

function updatePriceTierDropdown(id) {
    console.log(`Updating price tier dropdown for ${id}`);

    const acType = document.getElementById(`acType-${id}`);
    const service = document.getElementById(`serviceType-${id}`);
    const priceTier = document.getElementById(`priceTier-${id}`);

    if (!acType || !service || !priceTier) {
        console.error(`Elements not found for ${id}`);
        return;
    }

    console.log(`AC: ${acType.value}, Service: ${service.value}`);

    if (!acType.value || !service.value) {
        priceTier.innerHTML = '<option value="">Select Service first</option>';
        priceTier.disabled = true;
        return;
    }

    priceTier.innerHTML = '<option value="">Select Price Tier...</option>';
    priceTier.disabled = false;

    const tiers = PRICE_DATA[acType.value]?.[service.value];
    console.log(`Tiers for ${acType.value} - ${service.value}:`, tiers);

    if (tiers && tiers.length > 0) {
        tiers.forEach(tier => {
            const option = document.createElement('option');
            option.value = tier.range;
            option.dataset.price = tier.price;
            option.textContent = `${tier.range} - ₱${tier.price}`;
            priceTier.appendChild(option);
        });
        console.log(`Added ${tiers.length} tiers to dropdown`);
    } else {
        console.warn(`No tiers found for ${acType.value} - ${service.value}`);
        priceTier.innerHTML = '<option value="">No tiers available</option>';
    }

    updateTotal();
}

function setupEventDelegation() {
    console.log('Setting up event delegation');

    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('plus')) {
            const input = e.target.parentElement.querySelector('.units-input');
            if (input && parseInt(input.value) < 10) {
                input.value = parseInt(input.value) + 1;
                updateTotal();
            }
        }

        if (e.target.classList.contains('minus')) {
            const input = e.target.parentElement.querySelector('.units-input');
            if (input && parseInt(input.value) > 1) {
                input.value = parseInt(input.value) - 1;
                updateTotal();
            }
        }

        if (e.target.classList.contains('warranty-btn')) {
            const container = e.target.closest('.warranty');
            if (container) {
                container.querySelectorAll('.warranty-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                e.target.classList.add('active');
            }
        }

        if (e.target.classList.contains('remove-aircon-btn')) {
            const entry = e.target.closest('.aircon-entry');
            if (entry && document.querySelectorAll('.aircon-entry').length > 1) {
                entry.remove();
                updateTotal();
            }
        }

        if (e.target.id === 'addAirconBtn' || e.target.closest('#addAirconBtn')) {
            addAircon();
        }

        if (e.target.id === 'uploadBox' || e.target.closest('#uploadBox')) {
            const mediaUpload = document.getElementById('mediaUpload');
            if (mediaUpload) mediaUpload.click();
        }
    });

    document.addEventListener('input', function (e) {
        if (e.target.classList.contains('units-input')) {
            let value = parseInt(e.target.value) || 1;
            if (value < 1) e.target.value = 1;
            if (value > 10) e.target.value = 10;
            updateTotal();
        }
    });

    const fileInput = document.getElementById('mediaUpload');
    if (fileInput) {
        fileInput.addEventListener('change', function (e) {
            const preview = document.getElementById('preview');
            if (preview) {
                preview.innerHTML = '';

                Array.from(e.target.files).forEach(file => {
                    if (!file.type.startsWith('image/')) return;

                    const reader = new FileReader();
                    reader.onload = function (e) {
                        const img = document.createElement('img');
                        img.src = e.target.result;
                        img.style.cssText = 'width: 100px; height: 100px; object-fit: cover; border-radius: 5px; margin: 5px;';

                        const removeBtn = document.createElement('button');
                        removeBtn.textContent = '×';
                        removeBtn.style.cssText = 'position: absolute; margin-left: -25px; background: red; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer;';
                        removeBtn.onclick = function () { img.remove(); };

                        const container = document.createElement('div');
                        container.style.cssText = 'display: inline-block; position: relative;';
                        container.appendChild(img);
                        container.appendChild(removeBtn);

                        preview.appendChild(container);
                    };
                    reader.readAsDataURL(file);
                });
            }
        });
    }
}

function addAircon() {
    airconCounter++;
    console.log(`Adding new aircon #${airconCounter}`);

    const newAircon = `
        <div class="aircon-entry" data-aircon-id="${airconCounter}">
            <div class="aircon-entry-header">
                <div class="aircon-entry-title">Aircon #${airconCounter}</div>
                <button type="button" class="remove-aircon-btn">Remove</button>
            </div>
            <div class="aircon-entry-content">
                <div>
                    <label for="acType-${airconCounter}">AC Type *</label>
                    <select id="acType-${airconCounter}" class="ac-type" data-aircon="${airconCounter}" required>
                        <option value="">Select AC Type...</option>
                        <option value="window_non_inverter">Window Type Non-Inverter</option>
                        <option value="window_inverter">Window Type Inverter</option>
                        <option value="split_wall_mounted">Split Type Wall Mounted</option>
                        <option value="floor_mounted">Floor Mounted</option>
                        <option value="ceiling_suspended">Ceiling Suspended</option>
                        <option value="cassette_type">Cassette Type</option>
                    </select>
                </div>
                <div>
                    <label for="serviceType-${airconCounter}">Service *</label>
                    <select id="serviceType-${airconCounter}" class="service-type" data-aircon="${airconCounter}" required>
                        <option value="">Select AC Type first</option>
                    </select>
                </div>
            </div>
            <div class="aircon-entry-content">
                <div>
                    <label for="priceTier-${airconCounter}">Price Tier *</label>
                    <select id="priceTier-${airconCounter}" class="price-tier" data-aircon="${airconCounter}" required>
                        <option value="">Select Service first</option>
                    </select>
                </div>
                <div>
                    <label for="brand-${airconCounter}">Brand (Optional)</label>
                    <select id="brand-${airconCounter}" class="aircon-brand" data-aircon="${airconCounter}">
                        <option value="">Select Brand...</option>
                        <option value="samsung">Samsung</option>
                        <option value="lg">LG</option>
                        <option value="panasonic">Panasonic</option>
                        <option value="daikin">Daikin</option>
                        <option value="mitsubishi">Mitsubishi</option>
                        <option value="other">Other</option>
                    </select>
                </div>
            </div>
            <div class="units-warranty">
                <div>
                    <label>Number of Units *</label>
                    <div class="counter-box">
                        <button type="button" class="minus" data-aircon="${airconCounter}">−</button>
                        <input class="units-input" type="number" value="1" min="1" max="10" data-aircon="${airconCounter}" required>
                        <button type="button" class="plus" data-aircon="${airconCounter}">+</button>
                    </div>
                </div>
                <div>
                    <label>Warranty Status *</label>
                    <div class="warranty">
                        <button type="button" class="warranty-btn active" data-status="In-Warranty" data-aircon="${airconCounter}">In-Warranty</button>
                        <button type="button" class="warranty-btn" data-status="Out-of-Warranty" data-aircon="${airconCounter}">Out-of-Warranty</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    const airconEntries = document.getElementById('airconEntries');
    if (airconEntries) {
        airconEntries.insertAdjacentHTML('beforeend', newAircon);
        initAircon(airconCounter);
    }
}

function updateTotal() {
    let totalPrice = 0;
    let totalUnits = 0;

    document.querySelectorAll('.aircon-entry').forEach(entry => {
        const id = entry.getAttribute('data-aircon-id');
        const priceTier = document.getElementById(`priceTier-${id}`);
        const unitsInput = entry.querySelector('.units-input');

        if (priceTier?.value && unitsInput) {
            const selectedOption = priceTier.options[priceTier.selectedIndex];
            const price = parseFloat(selectedOption.dataset.price) || 0;
            const units = parseInt(unitsInput.value) || 1;
            totalPrice += price * units;
            totalUnits += units;
        }
    });

    const priceElement = document.getElementById('estimatedPrice');
    const summaryPrice = document.getElementById('summaryPrice');
    const summaryUnits = document.getElementById('summaryUnits');

    if (priceElement) priceElement.textContent = `₱ ${totalPrice}`;
    if (summaryPrice) summaryPrice.textContent = `₱ ${totalPrice}`;
    if (summaryUnits) summaryUnits.textContent = totalUnits;
}

function setupNavigation() {
    const nextBtn = document.getElementById('nextBtn');
    const backBtn = document.getElementById('backBtn');
    const submitBtn = document.getElementById('submitBtn');

    if (nextBtn) {
        nextBtn.addEventListener('click', function () {
            document.getElementById('page1').classList.remove('active');
            document.getElementById('page2').classList.add('active');
            if (backBtn) backBtn.classList.remove('hidden');
            nextBtn.classList.add('hidden');
            if (submitBtn) submitBtn.classList.remove('hidden');

            document.querySelectorAll('.progress-step').forEach((step, i) => {
                step.classList.toggle('active', i === 1);
            });
        });
    }

    if (backBtn) {
        backBtn.addEventListener('click', function () {
            document.getElementById('page2').classList.remove('active');
            document.getElementById('page1').classList.add('active');
            backBtn.classList.add('hidden');
            if (nextBtn) nextBtn.classList.remove('hidden');
            if (submitBtn) submitBtn.classList.add('hidden');

            document.querySelectorAll('.progress-step').forEach((step, i) => {
                step.classList.toggle('active', i === 0);
            });
        });
    }

    if (submitBtn) {
        submitBtn.addEventListener('click', function (e) {
            e.preventDefault();
            alert('Form submitted successfully!');
        });
    }
}