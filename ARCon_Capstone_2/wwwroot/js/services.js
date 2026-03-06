let page = 1;
let pageSize = 24;
let sortBy = "airconType";
let sortDir = "asc";


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

//Load Table
async function loadServices() {
    const search = document.getElementById("servicesSearch")?.value || "";

    const url =
        `/api/services/services-list` +
        `?page=${page}` +
        `&pageSize=${pageSize}` +
        `&sortBy=${sortBy}` +
        `&sortDir=${sortDir}` +
        `&search=${encodeURIComponent(search)}`;

    const res = await fetch(url);
    const result = await res.json();

    renderServices(result.data);
    renderPagination(result.totalCount);
}

//render parent row
function renderServices(data) {
    const tbody = document.getElementById("servicesTable");
    tbody.innerHTML = "";

    if (!data.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="3" class="text-center text-muted">
                    No services found
                </td>
            </tr>`;
        return;
    }

    data.forEach((row, i) => {
        tbody.insertAdjacentHTML("beforeend", `
            <tr data-service-id="${row.serviceId}">
                <td>${row.airconType}</td>
                <td>${row.serviceName}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary"
                            onclick="togglePriceTiers(${i}, this)">
                        View Price Tiers
                    </button>
                    <button class="btn btn-sm btn-outline-primary"
                            onclick="addNewTier(${i}, this)">
                        + New Price Tier
                    </button>
                    <button class="btn btn-sm btn-outline-primary"
                            onclick="editTiers(${i}, this)">
                       Edit
                    </button>
                </td>
            </tr>

            <tr class="d-none" id="price-row-${i}">
                <td colspan="3">
                    <div id="price-content-${i}">Loading...</div>
                </td>
            </tr>
        `);
    });
}

// render child row
async function togglePriceTiers(index, btn) {
    const parentRow = btn.closest("tr");
    const serviceId = parentRow.dataset.serviceId;

    const priceRow = document.getElementById(`price-row-${index}`);
    const content = document.getElementById(`price-content-${index}`);

    if (!priceRow.classList.contains("d-none")) {
        priceRow.classList.add("d-none");
        btn.textContent = "View Price Tier";
        return;
    }

    priceRow.classList.remove("d-none");
    btn.textContent = "Hide Prices";

    if (content.dataset.loaded) return;

    const res = await fetch(`/api/services/${serviceId}/price-tiers`);
    const tiers = await res.json();

    content.innerHTML = tiers.length
        ? `
        <table class="table table-sm table-bordered mb-0">
            <thead>
                <tr>
                    <th>Min HP</th>
                    <th>Max HP</th>
                    <th>Price</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${tiers.map(t => `
                    <tr data-tier-id="${t.id}">
                        <td>${t.minHp}</td>
                        <td>${t.maxHp}</td>
                        <td class="price">₱${Number(t.price).toLocaleString()}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-warning"
                                    onclick="editPriceTier(${t.id})">
                                Edit
                            </button>
                            <button class="btn btn-sm btn-outline-danger"
                                    onclick="deletePriceTier(${t.id}, ${serviceId})">
                                Delete
                            </button>
                        </td>
                    </tr>

                `).join("")}
            </tbody>
        </table>`
        : `<em class="text-muted">No price tiers</em>`;

    content.dataset.loaded = "true";
}


//sort values
function changeSort(column) {
    if (sortBy === column) {
        sortDir = sortDir === "asc" ? "desc" : "asc";
    } else {
        sortBy = column;
        sortDir = "asc";
    }
    loadServices();
}

//pagination
function renderPagination(totalCount) {
    const totalPages = Math.ceil(totalCount / pageSize);
    const ul = document.getElementById("pagination");
    ul.innerHTML = "";

    for (let i = 1; i <= totalPages; i++) {
        ul.insertAdjacentHTML("beforeend", `
            <li class="page-item ${i === page ? "active" : ""}">
                <button class="page-link" onclick="goToPage(${i})">
                    ${i}
                </button>
            </li>
        `);
    }
}
function goToPage(p) {
    page = p;
    loadServices();
}

//add new service tier
function addNewTier(index, btn) {
    const serviceId = btn.closest("tr").dataset.serviceId;

    document.getElementById("priceTierServiceId").value = serviceId;
    document.getElementById("minHp").value = "";
    document.getElementById("maxHp").value = "";
    document.getElementById("price").value = "";

    // default to HP
    document.getElementById("unitHP").checked = true;

    new bootstrap.Modal(
        document.getElementById("priceTierModal")
    ).show();
}


async function savePriceTier() {
    const serviceId = Number(document.getElementById("priceTierServiceId").value);
    const minHp = Number(document.getElementById("minHp").value);
    const maxHp = Number(document.getElementById("maxHp").value);
    const price = Number(document.getElementById("price").value);

    const unit = document.querySelector('input[name="capacityUnit"]:checked')?.value;

    if (!minHp || !maxHp || !price) {
        alert("All fields are required.");
        return;
    }

    if (minHp >= maxHp) {
        alert("Min must be less than Max");
        return;
    }

    const res = await fetch("/api/service-price-tiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            serviceId,
            capacityMin: minHp,
            capacityMax: maxHp,
            unit, // ✅ added
            price
        })
    });

    if (!res.ok) {
        alert(await res.text());
        return;
    }

    bootstrap.Modal
        .getInstance(document.getElementById("priceTierModal"))
        .hide();

    location.reload();
}



//edit tier (we'll use the same modal as create tier)
async function editPriceTier(tierId) {
    try {
        const res = await fetch(`/api/service-price-tiers/${tierId}`);
        if (!res.ok) throw new Error(await res.text());

        const tier = await res.json();

        document.getElementById("editPriceTierId").value = tier.id;
        document.getElementById("editPriceTierServiceId").value = tier.serviceId;
        document.getElementById("editMinHp").value = tier.capacityMin;
        document.getElementById("editMaxHp").value = tier.capacityMax;
        document.getElementById("editPrice").value = tier.price;

        // ✅ set unit radio
        if (tier.unit === "TR") {
            document.getElementById("editUnitTR").checked = true;
        } else {
            document.getElementById("editUnitHP").checked = true;
        }

        window.editingTierId = tierId;

        new bootstrap.Modal(
            document.getElementById("editPriceTierModal")
        ).show();

    } catch (err) {
        alert(err.message);
    }
}


//save the edit
async function saveEditedPriceTier() {
    const selectedUnit = document.querySelector('input[name="editUnit"]:checked');

    const payload = {
        serviceId: Number(editPriceTierServiceId.value),
        capacityMin: Number(editMinHp.value),
        capacityMax: Number(editMaxHp.value),
        unit: unit, // ✅ added
        price: Number(editPrice.value)
    };

    // validation
    if (payload.capacityMin >= payload.capacityMax) {
        alert("Min must be less than Max");
        return;
    }

    try {
        const res = await fetch(
            `/api/service-price-tiers/edit/${editPriceTierId.value}`,
            {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            }
        );

        if (!res.ok) {
            alert(await res.text());
            return;
        }

        alert("Price tier updated successfully");

        bootstrap.Modal
            .getInstance(document.getElementById("editPriceTierModal"))
            .hide();

    } catch {
        alert("Something went wrong while updating the price tier");
    }

    location.reload();
}

//delete a price tier
async function deletePriceTier(tierId, serviceId) {
    if (!confirm("Are you sure you want to delete this price tier?")) {
        return;
    }

    try {
        const res = await fetch(`/api/service-price-tiers/${tierId}`, {
            method: "DELETE"
        });

        if (!res.ok) {
            alert(await res.text());
            return;
        }

        alert("Price tier deleted successfully");

        // simplest & safest (recommended)
        location.reload();


    } catch {
        alert("Failed to delete price tier");
    }
}





//initial load + live search
document.addEventListener("DOMContentLoaded", loadServices);
function searchServices() {
    page = 1;
    loadServices();
}

// Clear Modal on Create
function openCreateTier(serviceId) {
    priceTierServiceId.value = serviceId;
    minHp.value = "";
    maxHp.value = "";
    price.value = "";
    window.editingTierId = null;

    new bootstrap.Modal(
        document.getElementById("priceTierModal")
    ).show();
}