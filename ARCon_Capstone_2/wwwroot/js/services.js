const createServiceModal = document.getElementById("createServiceModal");
const acTypeSelect = document.getElementById("acTypeSelect");
const serviceCategorySelect = document.getElementById("serviceCategorySelect");
const saveBtn = document.getElementById("saveServiceBtn");

///////////   START CREATE SERVICE   ///////////

// Load dropdown data when modal opens
createServiceModal.addEventListener("shown.bs.modal", async () => {
    await loadAcTypes();
    await loadServiceCategories();
    toggleSaveButton();
});

// Clear selections when modal closes
createServiceModal.addEventListener("hidden.bs.modal", () => {
    acTypeSelect.value = "";
    serviceCategorySelect.value = "";
    toggleSaveButton();
});

async function loadAcTypes() {
    const res = await fetch("/api/service-aircon-types/dropdown");
    const data = await res.json();

    acTypeSelect.innerHTML =
        `<option value="">-- Select AC Type --</option>` +
        data.map(x => `<option value="${x.id}">${x.name}</option>`).join("");
}

async function loadServiceCategories() {
    const res = await fetch("/api/service-categories/dropdown");
    const data = await res.json();

    serviceCategorySelect.innerHTML =
        `<option value="">-- Select Service Category --</option>` +
        data.map(x => `<option value="${x.id}">${x.name}</option>`).join("");
}

acTypeSelect.addEventListener("change", toggleSaveButton);
serviceCategorySelect.addEventListener("change", toggleSaveButton);

function toggleSaveButton() {
    saveBtn.disabled = !(acTypeSelect.value && serviceCategorySelect.value);
}

async function saveService() {
    const acTypeId = acTypeSelect.value;
    const categoryId = serviceCategorySelect.value;

    if (!acTypeId || !categoryId) return;

    saveBtn.disabled = true;

    const response = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            serviceAirconTypeId: parseInt(acTypeId),
            serviceCategoryId: parseInt(categoryId)
        })
    });

    if (response.ok) {
        const result = await response.json();

        if (result.created) {
            alert("Service created successfully.");
        } else {
            alert("Service already exists.");
        }

        bootstrap.Modal.getInstance(createServiceModal).hide();
        location.reload();
    } else {
        alert("Failed to save service.");
        saveBtn.disabled = false;
    }
}

///////////   END CREATE SERVICE   ///////////