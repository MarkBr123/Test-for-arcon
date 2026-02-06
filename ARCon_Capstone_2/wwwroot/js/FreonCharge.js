document.addEventListener('DOMContentLoaded', function () {
    // Configuration - Freon Charging specific data
    const serviceData = {
        'standard_charge': { basePrice: 2500 },
        'leak_check': { basePrice: 3500 },
        'full_recharge': { basePrice: 4500 },
        'pressure_test': { basePrice: 2000 }
    };

    const refrigerantPrices = {
        'r22': 1.0,
        'r32': 1.2,
        'r410a': 1.3,
        'r134a': 1.1,
        'not_sure': 1.0
    };

    // DOM Elements
    const pages = {
        page1: document.getElementById('page1'),
        page2: document.getElementById('page2'),
        progressSteps: document.querySelectorAll('.progress-step'),
        backBtn: document.getElementById('backBtn'),
        nextBtn: document.getElementById('nextBtn'),
        submitBtn: document.getElementById('submitBtn'),
        airconEntries: document.getElementById('airconEntries'),
        addAirconBtn: document.getElementById('addAirconBtn'),
        uploadBox: document.getElementById('uploadBox'),
        mediaUpload: document.getElementById('mediaUpload'),
        serviceForm: document.getElementById('serviceForm')
    };

    // State
    let currentPage = 1;
    let airconCount = 1;

    // Initialize
    initForm();

    // Functions
    function initForm() {
        setupEventListeners();
        updateSummary();
    }

    function setupEventListeners() {
        // Page navigation
        pages.nextBtn.addEventListener('click', goToNextPage);
        pages.backBtn.addEventListener('click', goToPreviousPage);

        // Add aircon
        pages.addAirconBtn.addEventListener('click', addAirconEntry);

        // File upload
        pages.uploadBox.addEventListener('click', () => pages.mediaUpload.click());
        pages.mediaUpload.addEventListener('change', handleFileUpload);

        // Form submission
        pages.serviceForm.addEventListener('submit', handleSubmit);
    }

    function goToNextPage() {
        if (!validateCurrentPage()) return;

        if (currentPage === 1) {
            currentPage = 2;
            showPage(2);
            pages.nextBtn.classList.add('hidden');
            pages.submitBtn.classList.remove('hidden');
            pages.backBtn.classList.remove('hidden');
        }
    }

    function goToPreviousPage() {
        currentPage = 1;
        showPage(1);
        pages.nextBtn.classList.remove('hidden');
        pages.submitBtn.classList.add('hidden');
        pages.backBtn.classList.add('hidden');
    }

    function showPage(pageNumber) {
        // Hide all pages
        pages.page1.classList.remove('active');
        pages.page2.classList.remove('active');

        // Show target page
        document.getElementById(`page${pageNumber}`).classList.add('active');

        // Update progress indicator
        pages.progressSteps.forEach(step => {
            step.classList.remove('active');
            if (parseInt(step.dataset.page) <= pageNumber) {
                step.classList.add('active');
            }
        });

        // Update summary on page 2
        if (pageNumber === 2) {
            updateSummary();
        }
    }

    function validateCurrentPage() {
        if (currentPage === 1) {
            const airconEntries = document.querySelectorAll('.aircon-entry');

            for (const entry of airconEntries) {
                const acType = entry.querySelector('.ac-type');
                const refrigerantType = entry.querySelector('.refrigerant-type');
                const serviceType = entry.querySelector('.service-type');
                const units = entry.querySelector('.units-input');

                if (!acType.value || !refrigerantType.value || !serviceType.value || !units.value) {
                    alert('Please fill all required fields for Aircon #' + entry.dataset.airconId);
                    return false;
                }
            }
        }
        return true;
    }

    function addAirconEntry() {
        airconCount++;
        const template = document.querySelector('.aircon-entry').cloneNode(true);

        // Update IDs and data attributes
        template.dataset.airconId = airconCount;
        template.querySelector('.aircon-entry-title').textContent = `Aircon #${airconCount}`;

        // Update all inputs within this entry
        template.querySelectorAll('[data-aircon]').forEach(el => {
            el.dataset.aircon = airconCount;
            const id = el.id ? el.id.replace(/\d+$/, airconCount) : null;
            if (id) el.id = id;
        });

        // Clear values
        template.querySelector('.ac-type').value = '';
        template.querySelector('.refrigerant-type').value = '';
        template.querySelector('.service-type').value = '';
        template.querySelector('.aircon-brand').value = '';
        template.querySelector('.units-input').value = 1;
        template.querySelector('.last-charged').value = '';

        // Show remove button
        template.querySelector('.remove-aircon-btn').classList.remove('hidden');
        template.querySelector('.remove-aircon-btn').addEventListener('click', function () {
            if (airconCount > 1) {
                template.remove();
                airconCount--;
                updateSummary();
            }
        });

        // Add event listeners
        addAirconEventListeners(template, airconCount);

        // Append to container
        pages.airconEntries.appendChild(template);

        // Update summary
        updateSummary();
    }

    function addAirconEventListeners(entry, airconId) {
        // All dropdown changes trigger summary update
        entry.querySelector('.ac-type').addEventListener('change', updateSummary);
        entry.querySelector('.refrigerant-type').addEventListener('change', updateSummary);
        entry.querySelector('.service-type').addEventListener('change', updateSummary);
        entry.querySelector('.aircon-brand').addEventListener('change', updateSummary);
        entry.querySelector('.last-charged').addEventListener('input', updateSummary);

        // Units counter
        const minusBtn = entry.querySelector('.minus');
        const plusBtn = entry.querySelector('.plus');
        const unitsInput = entry.querySelector('.units-input');

        minusBtn.addEventListener('click', function () {
            const current = parseInt(unitsInput.value);
            if (current > 1) {
                unitsInput.value = current - 1;
                updateSummary();
            }
        });

        plusBtn.addEventListener('click', function () {
            const current = parseInt(unitsInput.value);
            if (current < 10) {
                unitsInput.value = current + 1;
                updateSummary();
            }
        });

        unitsInput.addEventListener('change', updateSummary);
    }

    function handleFileUpload(event) {
        const files = event.target.files;
        const preview = document.getElementById('preview');
        preview.innerHTML = '';

        for (const file of files) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const div = document.createElement('div');

                if (file.type.startsWith('image/')) {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.alt = 'Preview';
                    div.appendChild(img);
                } else if (file.type.startsWith('video/')) {
                    const video = document.createElement('video');
                    video.src = e.target.result;
                    video.controls = true;
                    video.style.maxWidth = '100px';
                    video.style.maxHeight = '100px';
                    div.appendChild(video);
                }

                preview.appendChild(div);
            };
            reader.readAsDataURL(file);
        }
    }

    function updateSummary() {
        const airconEntries = document.querySelectorAll('.aircon-entry');
        let totalUnits = 0;
        let totalPrice = 0;
        const airconTypes = [];
        const refrigerantTypes = new Set();
        const serviceTypes = new Set();

        // Calculate totals
        airconEntries.forEach(entry => {
            const units = parseInt(entry.querySelector('.units-input').value) || 1;
            const acType = entry.querySelector('.ac-type').value;
            const refrigerantType = entry.querySelector('.refrigerant-type').value;
            const serviceType = entry.querySelector('.service-type').value;

            totalUnits += units;

            if (acType) {
                const typeName = entry.querySelector('.ac-type option:checked').textContent;
                airconTypes.push(`${typeName} (${units} unit${units > 1 ? 's' : ''})`);
            }

            if (refrigerantType) {
                const refrigerantName = entry.querySelector('.refrigerant-type option:checked').textContent;
                refrigerantTypes.add(refrigerantName);
            }

            if (serviceType) {
                const serviceName = entry.querySelector('.service-type option:checked').textContent;
                serviceTypes.add(serviceName);
            }

            // Calculate price
            if (serviceType && serviceData[serviceType]) {
                let unitPrice = serviceData[serviceType].basePrice;

                // Adjust for refrigerant type
                if (refrigerantType && refrigerantPrices[refrigerantType]) {
                    unitPrice *= refrigerantPrices[refrigerantType];
                }

                totalPrice += Math.round(unitPrice * units);
            }
        });

        // Additional services
        const additionalCheckboxes = document.querySelectorAll('input[name="additional"]:checked');
        const additionalServices = additionalCheckboxes.length > 0
            ? Array.from(additionalCheckboxes).map(cb => {
                const labels = {
                    'leak_detection': 'UV Leak Detection',
                    'vacuum_pump': 'Vacuum & Purge',
                    'ladder': 'Ladder needed'
                };
                return labels[cb.value] || cb.value;
            }).join(', ')
            : 'None';

        // Add additional service costs
        if (additionalCheckboxes.length > 0) {
            additionalCheckboxes.forEach(cb => {
                if (cb.value === 'leak_detection') totalPrice += 500;
                if (cb.value === 'vacuum_pump') totalPrice += 800;
            });
        }

        // Update DOM
        document.getElementById('summaryAircons').querySelector('.summary-value').textContent =
            airconTypes.length > 0 ? airconTypes.join(', ') : 'Not selected';

        document.getElementById('summaryRefrigerant').textContent =
            refrigerantTypes.size > 0 ? Array.from(refrigerantTypes).join(', ') : 'Not selected';

        document.getElementById('summaryServiceType').textContent =
            serviceTypes.size > 0 ? Array.from(serviceTypes).join(', ') : 'Not selected';

        document.getElementById('summaryUnits').textContent = totalUnits;
        document.getElementById('summaryAdditional').textContent = additionalServices;
        document.getElementById('summaryPrice').textContent = `₱ ${totalPrice.toLocaleString()}`;
        document.getElementById('estimatedPrice').textContent = `₱ ${totalPrice.toLocaleString()}`;
    }

    function handleSubmit(event) {
        event.preventDefault();

        if (!validateCurrentPage()) return;

        // Collect form data
        const formData = {
            serviceDetails: collectServiceDetails(),
            personalInfo: collectPersonalInfo(),
            files: Array.from(pages.mediaUpload.files).map(file => file.name),
            totalPrice: parsePrice(document.getElementById('summaryPrice').textContent)
        };

        // In a real app, you would send this to your server
        console.log('Freon Charging form submitted:', formData);
        alert('Freon Charging booking submitted successfully! We will contact you soon.');
    }

    function collectServiceDetails() {
        const entries = [];

        document.querySelectorAll('.aircon-entry').forEach(entry => {
            entries.push({
                acType: entry.querySelector('.ac-type').value,
                refrigerantType: entry.querySelector('.refrigerant-type').value,
                serviceType: entry.querySelector('.service-type').value,
                brand: entry.querySelector('.aircon-brand').value,
                units: entry.querySelector('.units-input').value,
                lastCharged: entry.querySelector('.last-charged').value
            });
        });

        return entries;
    }

    function collectPersonalInfo() {
        return {
            fullName: document.getElementById('fullName').value,
            customerType: document.getElementById('customerType').value,
            address: document.getElementById('address').value,
            phone: document.getElementById('phone').value,
            email: document.getElementById('email').value,
            preferredContact: document.getElementById('preferredContact').value,
            notes: document.getElementById('notes').value
        };
    }

    function parsePrice(priceString) {
        return parseInt(priceString.replace(/[^\d]/g, ''));
    }

    // Initialize event listeners for first aircon
    addAirconEventListeners(document.querySelector('.aircon-entry'), 1);

    // Initialize additional checkboxes
    document.querySelectorAll('input[name="additional"]').forEach(checkbox => {
        checkbox.addEventListener('change', updateSummary);
    });
});