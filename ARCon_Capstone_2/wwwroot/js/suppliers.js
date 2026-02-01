let supplierModalMode = "CREATE"; // create, edit and summry
let supplierModalInstance = null;


//for row display
let currentPage = 1;
let pageSize = 24;
let currentSortBy = "created_at";
let currentSortDir = "desc";
let currentSearch = "";
let searchTimeout = null;

// for editing
let editingSupplierId = null;

// ===============================
// SUPPLIER CREATE (MODAL)
// ===============================
const requiredFields = [

"proprietorName",
"proprietorContactNo",
"dtiBusinessNumber",
"tinNumber",
"officialWebsite",
"landlineNo",
"supplierRep",
"repEmail",
"repContactNo",
"houseUnit",
"streetName",
"barangay",
"city",
"province",
"landmark",

];

// Open modal for CREATE
function openCreateSupplierModal() {
    supplierModalMode = "CREATE";
    editingSupplierId = null;
    clearSupplierForm();
    document.getElementById("supplierModalTitle").textContent = "Create Supplier";

    setSupplierModalReadOnly(false);


    if (!supplierModalInstance) {
        supplierModalInstance = new bootstrap.Modal(
            document.getElementById("supplierModal")
        );
    }

    supplierModalInstance.show();
}

//Helper function
function isBlank(value) {
    return !value || value.trim().length === 0;
}
// Mark input invalid (red)
function setInvalid(input, invalid) {
    if (invalid) {
        input.classList.add("is-invalid");
    } else {
        input.classList.remove("is-invalid");
    }
}


async function submitSupplier()
{

    const supplierName = document.getElementById("supplierName").value.trim();

    if (isBlank(supplierName)) {
        alert("Supplier name is required and cannot be blank.");
        return;
    }

    const payload = {
        supplier_Name: supplierName,
        proprietor_Name: document.getElementById("proprietorName").value.trim() || null,
        proprietor_Contact_No: document.getElementById("proprietorContactNo").value.trim() || null,
        dti_Business_Number: document.getElementById("dtiBusinessNumber").value.trim() || null,
        tin_Number: document.getElementById("tinNumber").value.trim() || null,
        official_Website: document.getElementById("officialWebsite").value.trim() || null,
        landline_No: document.getElementById("landlineNo").value.trim() || null,

        supplier_Rep: document.getElementById("supplierRep").value.trim() || null,
        rep_Email: document.getElementById("repEmail").value.trim() || null,
        rep_Contact_No: document.getElementById("repContactNo").value.trim() || null,

        house_Unit: document.getElementById("houseUnit").value.trim() || null,
        street_Name: document.getElementById("streetName").value.trim() || null,
        barangay: document.getElementById("barangay").value.trim() || null,
        city: document.getElementById("city").value.trim() || null,
        province: document.getElementById("province").value.trim() || null,
        landmark: document.getElementById("landmark").value.trim() || null,

        note: document.getElementById("notes").value.trim() || null
    };

    let hasError = false;

    requiredFields.forEach(id => {
        const input = document.getElementById(id);
        const invalid = isBlank(input.value);
        setInvalid(input, invalid);
        if (invalid) hasError = true;
    });

    if (hasError) {
        alert("Please fill in the required fields.");
        return;
    }

    try {

        let url = "/api/suppliers/create";
        let method = "POST";
        let successMessage = "Supplier created successfully!";

        if (supplierModalMode === "EDIT") {
            url = `/api/suppliers/${editingSupplierId}`;
            method = "PUT";
            successMessage = "Supplier updated successfully!";
        }

        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            alert(await res.text());
            return;
        }

        supplierModalInstance.hide();
        alert(successMessage);

        if (typeof loadSuppliers === "function") {
            loadSuppliers(currentPage);
        }

    } catch (err) {
        console.error(err);
        alert("Unexpected error occurred.");
    }
}

// Clear modal form
function clearSupplierForm() {
    document
        .querySelectorAll("#supplierModal input, #supplierModal textarea")
        .forEach(i => i.value = "");
}

///// DISPLAY ROWS
//Load Rows///
function loadSuppliers(page = 1) {
    currentPage = page;

    fetch(`/api/suppliers?page=${page}&pageSize=${pageSize}&sortBy=${currentSortBy}&sortDir=${currentSortDir}&search=${currentSearch}`)
        .then(r => {
            if (!r.ok) throw new Error("Failed to load suppliers");
            return r.json();
        })
        .then(data => {
            renderSuppliers(data.items);
            renderPagination(data.totalCount);
        })
        .catch(err => {
            console.error(err);
            alert(err.message);
        });
}

// Render Rows
function renderSuppliers(items) {

    const tbody = document.getElementById("supplierTableBody");
    tbody.innerHTML = "";

    if (!items.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-muted">
                    No suppliers found
                </td>
            </tr>
        `;
        return;
    }

    items.forEach(sup => {

        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td class="fw-semibold">${sup.supplier_name}</td>
            <td>${sup.supplier_rep ?? "—"}</td>
            <td>${sup.rep_contact_no ?? "—"}</td>
            <td>${sup.rep_email ?? "—"}</td>
            <td>${sup.dti_business_number ?? "—"}</td>
            <td>${sup.city ?? "—"}</td>
            <td>${sup.province ?? "—"}</td>
            <td>${sup.created_at ?? "—"}</td>
            <td>${sup.updated_at ?? "—"}</td>
            <td>
                <span class="badge ${
                        sup.status === "ACTIVE" ? "bg-success" :
                            sup.status === "ARCHIVED" ? "bg-warning" :
                                "bg-secondary"
                        }">
                    ${sup.status ?? "—"}
                </span>
            </td>


            <td class="text-center">
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-info summary-btn">
                        Details
                    </button>
                    <button class="btn btn-outline-primary edit-btn">
                        Edit
                    </button>
                    <button class="btn btn-outline-danger archive-btn">
                        Archive
                    </button>
                </div>
            </td>
        `;

        /* ROW CLICK → SUMMARY */
        tr.addEventListener("click", () => {
            openSupplierSummary(sup.id);
        });

        /* PREVENT BUTTONS FROM TRIGGERING ROW CLICK */
        tr.querySelector(".summary-btn").addEventListener("click", e => {
            e.stopPropagation();
            openSupplierSummary(sup.id);
        });

        tr.querySelector(".edit-btn").addEventListener("click", e => {
            e.stopPropagation();
            openEditSupplierModal(sup.id);
        });

        tr.querySelector(".archive-btn").addEventListener("click", e => {
            e.stopPropagation();
            archiveSupplier(sup.id);
        });

        tbody.appendChild(tr);
    });
}

//Sorting
function sortSuppliers(field) {
    if (currentSortBy === field) {
        currentSortDir = currentSortDir === "asc" ? "desc" : "asc";
    } else {
        currentSortBy = field;
        currentSortDir = "asc";
    }

    loadSuppliers(currentPage);
}


//Pagination
function renderPagination(totalCount) {

    const totalPages = Math.ceil(totalCount / pageSize);
    const ul = document.getElementById("pagination");
    ul.innerHTML = "";

    if (totalPages <= 1) return;

    // Previous
    ul.insertAdjacentHTML("beforeend", `
        <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
            <a class="page-link" href="#" onclick="loadSuppliers(${currentPage - 1})">
                Previous
            </a>
        </li>
    `);

    for (let i = 1; i <= totalPages; i++) {
        ul.insertAdjacentHTML("beforeend", `
            <li class="page-item ${i === currentPage ? "active" : ""}">
                <a class="page-link" href="#" onclick="loadSuppliers(${i})">
                    ${i}
                </a>
            </li>
        `);
    }

    // Next
    ul.insertAdjacentHTML("beforeend", `
        <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
            <a class="page-link" href="#" onclick="loadSuppliers(${currentPage + 1})">
                Next
            </a>
        </li>
    `);
}

// search Supplier
function applySupplierSearch() {
    currentSearch = document
        .getElementById("supplierSearchInput")
        .value
        .trim();

    loadSuppliers(1);
}


///// end Display rows

//Archive

function archiveSupplier(id) {

    if (!confirm("Are you sure you want to archive this supplier? This user will not show on the list.")) {
        return;
    }

    fetch(`/api/suppliers/${id}`, {
        method: "DELETE"
    })
        .then(async r => {
            if (!r.ok) {
                const msg = await r.text();
                throw new Error(msg || "Archive failed");
            }
            return r.json();
        })
        .then(res => {
            console.log("Archived:", res);

            // reload current page (pagination-safe)
            loadSuppliers(currentPage);
        })
        .catch(err => {
            console.error(err);
            alert(err.message);
        });
}


// SUPPLIER SUMMARY //

//Open SUMMARY (read-only modal)
//This is what your table Summary button should call.
function openSupplierSummary(id) {
    supplierModalMode = "SUMMARY";

    fetch(`/api/suppliers/${id}/summary`)
        .then(r => {
            if (!r.ok) throw new Error("Failed to load supplier");
            return r.json();
        })
        .then(sup => {

            document.getElementById("supplierModalTitle").textContent =
                "Supplier Summary";

            fillSupplierModal(sup);
            setSupplierModalReadOnly(true);

            if (!supplierModalInstance) {
                supplierModalInstance = new bootstrap.Modal(
                    document.getElementById("supplierModal")
                );
            }

            supplierModalInstance.show();
        })
        .catch(err => {
            console.error(err);
            alert(err.message);
        });
}



//Helper: set modal READ - ONLY or EDITABLE
function setSupplierModalReadOnly(isReadOnly) {
    document
        .querySelectorAll("#supplierModal input, #supplierModal textarea, #supplierModal select")
        .forEach(el => {
            el.readOnly = isReadOnly;

            if (isReadOnly) {
                el.setAttribute("disabled", "disabled");
            } else {
                el.removeAttribute("disabled");
            }
        });

    // Handle Save button (HIDE + DISABLE)
    const saveBtn = document.getElementById("supplierSaveBtn");
    if (saveBtn) {
        saveBtn.disabled = isReadOnly;
        saveBtn.style.display = isReadOnly ? "none" : "inline-block";
    }
}


//Helper: fill modal fields (core reuse)
function fillSupplierModal(sup) {
    document.getElementById("supplierName").value = sup.supplier_name ?? "";
    document.getElementById("officialWebsite").value = sup.offical_website ?? "";

    document.getElementById("proprietorName").value = sup.proprietor_name ?? "";
    document.getElementById("proprietorContactNo").value = sup.proprieto_contact_no ?? "";
    document.getElementById("landlineNo").value = sup.landline_no ?? "";

    document.getElementById("dtiBusinessNumber").value = sup.dti_business_number ?? "";
    document.getElementById("tinNumber").value = sup.tin_number ?? "";

    document.getElementById("supplierRep").value = sup.supplier_rep ?? "";
    document.getElementById("repEmail").value = sup.rep_email ?? "";
    document.getElementById("repContactNo").value = sup.rep_contact_no ?? "";

    document.getElementById("houseUnit").value = sup.house_unit ?? "";
    document.getElementById("streetName").value = sup.street_name ?? "";
    document.getElementById("barangay").value = sup.barangay ?? "";
    document.getElementById("city").value = sup.city ?? "";
    document.getElementById("province").value = sup.province ?? "";
    document.getElementById("landmark").value = sup.landmark ?? "";

    document.getElementById("notes").value = sup.notes ?? "";
}

//search auto-run while typing, with a small debounce
document.addEventListener("DOMContentLoaded", () => {

    const searchInput = document.getElementById("supplierSearchInput");

    if (!searchInput) return;

    searchInput.addEventListener("input", () => {

        clearTimeout(searchTimeout);

        searchTimeout = setTimeout(() => {
            currentSearch = searchInput.value.trim();
            loadSuppliers(1);
        }, 400); // delay in ms (adjust if you want)
    });

});

// end summary





//Edit Supplier
function openEditSupplierModal(id) {
    supplierModalMode = "EDIT";
    editingSupplierId = id;

    fetch(`/api/suppliers/${id}/summary`)
        .then(r => {
            if (!r.ok) throw new Error("Failed to load supplier");
            return r.json();
        })
        .then(sup => {

            document.getElementById("supplierModalTitle").textContent =
                "Edit Supplier";

            fillSupplierModal(sup);
            setSupplierModalReadOnly(false);

            if (!supplierModalInstance) {
                supplierModalInstance = new bootstrap.Modal(
                    document.getElementById("supplierModal")
                );
            }

            supplierModalInstance.show();
        })
        .catch(err => {
            console.error(err);
            alert(err.message);
        });
}

//INIT
document.addEventListener("DOMContentLoaded", () => {
    loadSuppliers();
});

document.querySelectorAll("input, textarea").forEach(input => {
    input.addEventListener("input", () => {
        if (!isBlank(input.value)) {
            input.classList.remove("is-invalid");
        }
    });
});

