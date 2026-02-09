

document.addEventListener('DOMContentLoaded', function () {
    // Configuration - Installation specific data
    const installationData = {
        'window': { basePrice: 3500, description: 'Window Type Installation' },
        'split_wall': { basePrice: 4500, description: 'Split Type Wall Mounted Installation' },
        'split_floor': { basePrice: 5000, description: 'Split Type Floor Mounted Installation' },
        'split_ceiling': { basePrice: 6000, description: 'Split Type Ceiling Cassette Installation' },
        'central': { basePrice: 15000, description: 'Central AC System Installation' },
        'portable': { basePrice: 2500, description: 'Portable AC Setup' }
    };

    const capacityMultiplier = {
        '0.5': 1.0,
        '1.0': 1.2,
        '1.5': 1.5,
        '2.0': 1.8,
        '2.5': 2.2,
        '3.0': 2.8
    };

    const installationTypeMultiplier = {
        'new': 1.0,
        'replacement': 0.8,
        'relocation': 0.9,
        'commercial': 1.5
    };

    const difficultyMultiplier = {
        'easy': 1.0,
        'medium': 1.2,
        'difficult': 1.5,
        'very_difficult': 2.0
    };

    // DOM Elements
    const pages = {
        page1: document.getElementById('page1'),
        page2: document.getElementById('page2'),
        page3: document.getElementById('page3'),
        progressSteps: document.querySelectorAll('.progress-step'),
        backBtn: document.getElementById('backBtn'),
        nextBtn: document.getElementById('nextBtn'),
        submitBtn: document.getElementById('submitBtn'),
        unitEntries: document.getElementById('unitEntries'),
        addUnitBtn: document.getElementById('addUnitBtn'),
        uploadBox: document.getElementById('uploadBox'),
        mediaUpload: document.getElementById('mediaUpload'),
        installationForm: document.getElementById('installationForm')
    };

    // State
    let currentPage = 1;
    let unitCount = 1;
    const totalPages = 3;

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

        // Add unit
        pages.addUnitBtn.addEventListener('click', addUnitEntry);

        // File upload
        pages.uploadBox.addEventListener('click', () => pages.mediaUpload.click());
        pages.mediaUpload.addEventListener('change', handleFileUpload);

        // Form submission
        pages.installationForm.addEventListener('submit', handleSubmit);

        // Real-time updates for page 2 inputs
        document.getElementById('propertyType').addEventListener('change', updateSummary);
        document.getElementById('floorLevel').addEventListener('change', updateSummary);
        document.getElementById('accessDifficulty').addEventListener('change', updateSummary);
        document.getElementById('powerSource').addEventListener('change', updateSummary);
        document.getElementById('wallType').addEventListener('change', updateSummary);
        document.getElementById('installationHeight').addEventListener('change', updateSummary);
    }

    function goToNextPage() {
        if (!validateCurrentPage()) return;

        if (currentPage < totalPages) {
            currentPage++;
            showPage(currentPage);

            // Update button visibility
            if (currentPage === totalPages) {
                pages.nextBtn.classList.add('hidden');
                pages.submitBtn.classList.remove('hidden');
            } else {
                pages.nextBtn.classList.remove('hidden');
                pages.submitBtn.classList.add('hidden');
            }

            if (currentPage > 1) {
                pages.backBtn.classList.remove('hidden');
            }
        }
    }

    function goToPreviousPage() {
        if (currentPage > 1) {
            currentPage--;
            showPage(currentPage);

            // Update button visibility
            if (currentPage === 1) {
                pages.backBtn.classList.add('hidden');
            }

            pages.nextBtn.classList.remove('hidden');
            pages.submitBtn.classList.add('hidden');
        }
    }

    function showPage(pageNumber) {
        // Hide all pages
        pages.page1.classList.remove('active');
        pages.page2.classList.remove('active');
        pages.page3.classList.remove('active');

        // Show target page
        document.getElementById(`page${pageNumber}`).classList.add('active');

        // Update progress indicator
        pages.progressSteps.forEach(step => {
            step.classList.remove('active');
            if (parseInt(step.dataset.page) <= pageNumber) {
                step.classList.add('active');
            }
        });

        // Update summary on page 3
        if (pageNumber === 3) {
            updateSummary();
        }
    }

    function validateCurrentPage() {
        if (currentPage === 1) {
            const unitEntries = document.querySelectorAll('.aircon-entry');

            for (const entry of unitEntries) {
                const acType = entry.querySelector('.ac-type');
                const capacity = entry.querySelector('.capacity');
                const brand = entry.querySelector('.aircon-brand');
                const installationType = entry.querySelector('.installation-type');
                const units = entry.querySelector('.units-input');

                if (!acType.value || !capacity.value || !brand.value || !installationType.value || !units.value) {
                    alert('Please fill all required fields for AC Unit #' + entry.dataset.unitId);
                    return false;
                }
            }
        } else if (currentPage === 2) {
            const propertyType = document.getElementById('propertyType');
            const floorLevel = document.getElementById('floorLevel');

            if (!propertyType.value || !floorLevel.value) {
                alert('Please fill all required fields in Location Details');
                return false;
            }
        }
        return true;
    }

    function addUnitEntry() {
        unitCount++;
        const template = document.querySelector('.aircon-entry').cloneNode(true);

        template.dataset.unitId = unitCount;
        template.querySelector('.aircon-entry-title').textContent = `AC Unit #${unitCount}`;

    
        template.querySelectorAll('[data-unit]').forEach(el => {
            el.dataset.unit = unitCount;
            const id = el.id ? el.id.replace(/\d+$/, unitCount) : null;
            if (id) el.id = id;
        });

        // Clear values
        template.querySelector('.ac-type').value = '';
        template.querySelector('.capacity').value = '';
        template.querySelector('.aircon-brand').value = '';
        template.querySelector('.installation-type').value = '';
        template.querySelector('.units-input').value = 1;
        template.querySelector('.install-date').value = '';

        // Show remove button
        template.querySelector('.remove-aircon-btn').classList.remove('hidden');
        template.querySelector('.remove-aircon-btn').addEventListener('click', function () {
            if (unitCount > 1) {
                template.remove();
                unitCount--;
                updateSummary();
            }
        });

        // Add event listeners
        addUnitEventListeners(template, unitCount);

        // Append to container
        pages.unitEntries.appendChild(template);

        // Update summary
        updateSummary();
    }

    function addUnitEventListeners(entry, unitId) {
        // All dropdown changes trigger summary update
        entry.querySelector('.ac-type').addEventListener('change', updateSummary);
        entry.querySelector('.capacity').addEventListener('change', updateSummary);
        entry.querySelector('.aircon-brand').addEventListener('change', updateSummary);
        entry.querySelector('.installation-type').addEventListener('change', updateSummary);
        entry.querySelector('.install-date').addEventListener('change', updateSummary);

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
                div.style.display = 'inline-block';
                div.style.margin = '5px';

                const img = document.createElement('img');
                img.src = e.target.result;
                img.alt = 'Preview';
                img.style.maxWidth = '100px';
                img.style.maxHeight = '100px';
                img.style.borderRadius = '5px';

                div.appendChild(img);
                preview.appendChild(div);
            };
            reader.readAsDataURL(file);
        }
    }

    function updateSummary() {
        const unitEntries = document.querySelectorAll('.aircon-entry');
        let totalUnits = 0;
        let totalPrice = 0;
        let totalCapacity = 0;
        const unitTypes = [];
        const installationTypes = new Set();
        const brands = new Set();

        // Calculate totals from units
        unitEntries.forEach(entry => {
            const units = parseInt(entry.querySelector('.units-input').value) || 1;
            const acType = entry.querySelector('.ac-type').value;
            const capacity = entry.querySelector('.capacity').value;
            const brand = entry.querySelector('.aircon-brand').value;
            const installationType = entry.querySelector('.installation-type').value;

            totalUnits += units;
            totalCapacity += (parseFloat(capacity) || 0) * units;

            if (acType && installationData[acType]) {
                const typeName = entry.querySelector('.ac-type option:checked').textContent;
                unitTypes.push(`${typeName} (${units} unit${units > 1 ? 's' : ''})`);
            }

            if (brand) {
                const brandName = entry.querySelector('.aircon-brand option:checked').textContent;
                brands.add(brandName);
            }

            if (installationType) {
                const typeName = entry.querySelector('.installation-type option:checked').textContent;
                installationTypes.add(typeName);
            }

            // Calculate price
            if (acType && installationData[acType]) {
                let unitPrice = installationData[acType].basePrice;

                // Adjust for capacity
                if (capacity && capacityMultiplier[capacity]) {
                    unitPrice *= capacityMultiplier[capacity];
                }

                // Adjust for installation type
                if (installationType && installationTypeMultiplier[installationType]) {
                    unitPrice *= installationTypeMultiplier[installationType];
                }

                totalPrice += Math.round(unitPrice * units);
            }
        });

        // Additional services
        const additionalCheckboxes = document.querySelectorAll('input[name="additional"]:checked');
        const additionalServices = additionalCheckboxes.length > 0
            ? Array.from(additionalCheckboxes).map(cb => {
                const labels = {
                    'electrical_wiring': 'Electrical Wiring',
                    'drainage_piping': 'Drainage Piping',
                    'wall_cutting': 'Wall Cutting',
                    'scaffolding': 'Scaffolding Required',
                    'disposal': 'Old Unit Disposal'
                };
                return labels[cb.value] || cb.value;
            }).join(', ')
            : 'None';

        // Add additional service costs
        if (additionalCheckboxes.length > 0) {
            additionalCheckboxes.forEach(cb => {
                if (cb.value === 'electrical_wiring') totalPrice += 1500;
                if (cb.value === 'drainage_piping') totalPrice += 800;
                if (cb.value === 'wall_cutting') totalPrice += 1200;
                if (cb.value === 'scaffolding') totalPrice += 2000;
                if (cb.value === 'disposal') totalPrice += 500;
            });
        }

        // Adjust for location factors
        const difficulty = document.getElementById('accessDifficulty').value;
        const floorLevel = document.getElementById('floorLevel').value;
        const propertyType = document.getElementById('propertyType').value;

        if (difficulty && difficultyMultiplier[difficulty]) {
            totalPrice *= difficultyMultiplier[difficulty];
        }

        // Adjust for floor level
        if (floorLevel && floorLevel >= 2) {
            totalPrice *= 1.1; // 10% increase per floor above ground
        }

        // Round to nearest 100
        totalPrice = Math.round(totalPrice / 100) * 100;

        // Update DOM
        if (document.getElementById('summaryUnits')) {
            document.getElementById('summaryUnits').querySelector('.summary-value').textContent =
                unitTypes.length > 0 ? unitTypes.join(', ') : 'Not selected';
        }

        if (document.getElementById('summaryCapacity')) {
            document.getElementById('summaryCapacity').querySelector('.summary-value').textContent =
                totalCapacity > 0 ? `${totalCapacity} HP` : '0 HP';
        }

        if (document.getElementById('summaryInstallationType')) {
            document.getElementById('summaryInstallationType').querySelector('.summary-value').textContent =
                installationTypes.size > 0 ? Array.from(installationTypes).join(', ') : 'Not selected';
        }

        if (document.getElementById('summaryPropertyType')) {
            const propertySelect = document.getElementById('propertyType');
            const propertyValue = propertySelect.options[propertySelect.selectedIndex]?.textContent || 'Not selected';
            document.getElementById('summaryPropertyType').querySelector('.summary-value').textContent = propertyValue;
        }

        if (document.getElementById('summaryDifficulty')) {
            const difficultySelect = document.getElementById('accessDifficulty');
            const difficultyValue = difficultySelect.options[difficultySelect.selectedIndex]?.textContent || 'Not specified';
            document.getElementById('summaryDifficulty').querySelector('.summary-value').textContent = difficultyValue;
        }

        if (document.getElementById('summaryAdditional')) {
            document.getElementById('summaryAdditional').querySelector('.summary-value').textContent = additionalServices;
        }

        if (document.getElementById('summaryPrice')) {
            document.getElementById('summaryPrice').textContent = `₱ ${totalPrice.toLocaleString()}`;
        }

        if (document.getElementById('estimatedPrice')) {
            document.getElementById('estimatedPrice').textContent = `₱ ${totalPrice.toLocaleString()}`;
        }
    }

    function handleSubmit(event) {
        event.preventDefault();

        if (!validateCurrentPage()) return;

        // Collect form data
        const formData = {
            installationDetails: collectInstallationDetails(),
            locationDetails: collectLocationDetails(),
            personalInfo: collectPersonalInfo(),
            files: Array.from(pages.mediaUpload.files).map(file => file.name),
            totalPrice: parsePrice(document.getElementById('summaryPrice').textContent)
        };

      //this would send this to our server
        console.log('Installation form submitted:', formData);
        alert('Installation request submitted successfully! Our team will contact you within 24 hours.');


        // pages.installationForm.reset();
        // currentPage = 1;
        // showPage(1);
    }

    function collectInstallationDetails() {
        const entries = [];

        document.querySelectorAll('.aircon-entry').forEach(entry => {
            entries.push({
                acType: entry.querySelector('.ac-type').value,
                capacity: entry.querySelector('.capacity').value,
                brand: entry.querySelector('.aircon-brand').value,
                installationType: entry.querySelector('.installation-type').value,
                units: entry.querySelector('.units-input').value,
                installDate: entry.querySelector('.install-date').value
            });
        });

        return entries;
    }

    function collectLocationDetails() {
        return {
            propertyType: document.getElementById('propertyType').value,
            floorLevel: document.getElementById('floorLevel').value,
            roomDimensions: document.getElementById('roomDimensions').value,
            accessDifficulty: document.getElementById('accessDifficulty').value,
            powerSource: document.getElementById('powerSource').value,
            wallType: document.getElementById('wallType').value,
            installationHeight: document.getElementById('installationHeight').value,
            specialRequirements: document.getElementById('specialRequirements').value
        };
    }

    function collectPersonalInfo() {
        return {
            fullName: document.getElementById('fullName').value,
            customerType: document.getElementById('customerType').value,
            address: document.getElementById('address').value,
            landmark: document.getElementById('landmark').value,
            phone: document.getElementById('phone').value,
            email: document.getElementById('email').value,
            preferredTime: document.getElementById('preferredTime').value
        };
    }

    function parsePrice(priceString) {
        return parseInt(priceString.replace(/[^\d]/g, ''));
    }

    // Initialize event listeners for first unit
    addUnitEventListeners(document.querySelector('.aircon-entry'), 1);

    // Initialize additional checkboxes
    document.querySelectorAll('input[name="additional"]').forEach(checkbox => {
        checkbox.addEventListener('change', updateSummary);
    });

    // Set minimum date for installation date inputs
    const today = new Date().toISOString().split('T')[0];
    document.querySelectorAll('.install-date').forEach(input => {
        input.min = today;
    });
});