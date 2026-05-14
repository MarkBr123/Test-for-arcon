// =====================================
// GLOBALS
// =====================================

let selectedSupplierId = null;

let defectiveInventories = [];

let selectedInventoryIds = [];



// =====================================
// INIT
// =====================================

document.addEventListener(
    "DOMContentLoaded",

    () => {

        loadSuppliers();

        bindEvents();
    }
);



// =====================================
// EVENTS
// =====================================

function bindEvents() {

    // SUPPLIER CHANGE

    document.getElementById(
        "supplierSelect"
    ).addEventListener(
        "change",

        async function () {

            selectedSupplierId =
                this.value;

            selectedInventoryIds = [];

            updateTotals();

            if (!selectedSupplierId) {

                renderDefectiveInventories([]);

                return;
            }

            await loadDefectiveInventories(
                selectedSupplierId
            );
        }
    );



    // SEARCH

    document.getElementById(
        "inventorySearchInput"
    ).addEventListener(
        "input",

        debounce(async function () {

            if (!selectedSupplierId)
                return;

            await loadDefectiveInventories(
                selectedSupplierId,
                this.value
            );

        }, 400)
    );
}



// =====================================
// LOAD SUPPLIERS
// =====================================

async function loadSuppliers() {

    try {

        const response =
            await fetch(
                "/api/suppliers/dropdown"
            );

        const data =
            await response.json();

        const select =
            document.getElementById(
                "supplierSelect"
            );

        select.innerHTML = `
            <option value="">
                Select supplier
            </option>
        `;

        (data || []).forEach(s => {

            select.innerHTML += `

                <option value="${s.id}">

                    ${s.supplier_name}

                </option>
            `;
        });
    }
    catch (err) {

        console.error(err);

        alert(
            "Failed to load suppliers."
        );
    }
}



// =====================================
// LOAD DEFECTIVE INVENTORIES
// =====================================

async function loadDefectiveInventories(
    supplierId,
    search = ""
) {

    try {

        const response =
            await fetch(

                `/api/supplier-returns/supplier/${supplierId}/defective-inventories?search=${encodeURIComponent(search)}`
            );

        const data =
            await response.json();

        defectiveInventories =
            data.items || [];

        renderDefectiveInventories(
            defectiveInventories
        );
    }
    catch (err) {

        console.error(err);

        alert(
            "Failed to load defective inventories."
        );
    }
}



// =====================================
// RENDER INVENTORIES
// =====================================

function renderDefectiveInventories(
    items
) {

    const tbody =
        document.getElementById(
            "defectiveInventoryTableBody"
        );

    tbody.innerHTML = "";



    // EMPTY

    if (!items || items.length === 0) {

        tbody.innerHTML = `

            <tr>

                <td colspan="8"
                    class="text-center text-muted py-4">

                    No defective inventories found.

                </td>

            </tr>
        `;

        return;
    }



    // ROWS

    items.forEach(item => {

        const checked =
            selectedInventoryIds.includes(
                item.id
            )

                ? "checked"

                : "";



        tbody.innerHTML += `

            <tr>

                <td>

                    <input type="checkbox"
                           class="form-check-input"
                           ${checked}
                           onchange="toggleInventorySelection(${item.id})">

                </td>



                <td>

                    ${item.serial_number || "-"}

                </td>



                <td>

                    ${item.product_name || "-"}

                </td>



                <td>

                    ${item.brand || "-"}

                </td>



                <td>

                    ${item.sku || "-"}

                </td>



                <td>

                    ${item.po_number || "-"}

                </td>



                <td>

                    ${item.received_date

                ? formatDate(
                    item.received_date
                )

                : "-"
            }

                </td>



                <td>

                    <span class="badge bg-danger">

                        ${item.status}

                    </span>

                </td>

            </tr>
        `;
    });
}



// =====================================
// TOGGLE INVENTORY
// =====================================

function toggleInventorySelection(
    inventoryId
) {

    const exists =
        selectedInventoryIds.includes(
            inventoryId
        );

    if (exists) {

        selectedInventoryIds =
            selectedInventoryIds.filter(
                x => x !== inventoryId
            );
    }
    else {

        selectedInventoryIds.push(
            inventoryId
        );
    }

    updateTotals();
}



// =====================================
// UPDATE TOTALS
// =====================================

function updateTotals() {

    document.getElementById(
        "totalItems"
    ).value =
        selectedInventoryIds.length;



    let total = 0;

    selectedInventoryIds.forEach(id => {

        const item =
            defectiveInventories.find(
                x => x.id === id
            );

        if (item) {

            total +=
                Number(
                    item.unit_cost || 0
                );
        }
    });

    document.getElementById(
        "totalAmount"
    ).value =
        formatPrice(total);
}



// =====================================
// SAVE
// =====================================

document.getElementById(
    "saveReturnOrderBtn"
).addEventListener(
    "click",

    async () => {

        try {

            if (!selectedSupplierId) {

                alert(
                    "Please select a supplier."
                );

                return;
            }

            if (
                selectedInventoryIds.length === 0
            ) {

                alert(
                    "Please select at least one inventory item."
                );

                return;
            }



            const payload = {

                supplierId:
                    Number(
                        selectedSupplierId
                    ),

                returnMethod:
                    document.getElementById(
                        "returnMethod"
                    ).value,

                courierName:
                    document.getElementById(
                        "courierName"
                    ).value,

                trackingNumber:
                    document.getElementById(
                        "trackingNumber"
                    ).value,

                pickupDate:
                    document.getElementById(
                        "pickupDate"
                    ).value,

                shippedDate:
                    document.getElementById(
                        "shippedDate"
                    ).value,

                shippingCost:
                    Number(
                        document.getElementById(
                            "shippingCost"
                        ).value || 0
                    ),

                remarks:
                    document.getElementById(
                        "remarks"
                    ).value,

                items:
                    selectedInventoryIds.map(
                        id => ({
                            inventoryId: id
                        })
                    )
            };



            console.log(payload);



            // TODO:
            // POST API HERE



            alert(
                "Ready for API integration."
            );

        }
        catch (err) {

            console.error(err);

            alert(
                "Failed to save return order."
            );
        }
    }
);



// =====================================
// DEBOUNCE
// =====================================

function debounce(
    func,
    delay
) {

    let timer;

    return function () {

        const context =
            this;

        const args =
            arguments;

        clearTimeout(timer);

        timer =
            setTimeout(() => {

                func.apply(
                    context,
                    args
                );

            }, delay);
    };
}



// =====================================
// FORMAT DATE
// =====================================

function formatDate(date) {

    return new Date(date)
        .toLocaleDateString(
            "en-PH",
            {
                year: "numeric",
                month: "short",
                day: "numeric"
            }
        );
}



// =====================================
// FORMAT PRICE
// =====================================

function formatPrice(value) {

    return Number(value || 0)
        .toLocaleString(
            "en-PH",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );
}



////////////////////////   POST  //////////////////////////////////

// =====================================
// SAVE
// =====================================

document.getElementById(
    "saveReturnOrderBtn"
).addEventListener(
    "click",

    async () => {

        try {

            if (!selectedSupplierId) {

                alert(
                    "Please select a supplier."
                );

                return;
            }

            if (
                selectedInventoryIds.length === 0
            ) {

                alert(
                    "Please select at least one inventory item."
                );

                return;
            }



            // =====================================
            // PAYLOAD
            // =====================================

            const payload = {

                supplierId:
                    Number(
                        selectedSupplierId
                    ),

                returnMethod:
                    document.getElementById(
                        "returnMethod"
                    ).value || null,

                courierName:
                    document.getElementById(
                        "courierName"
                    ).value || null,

                trackingNumber:
                    document.getElementById(
                        "trackingNumber"
                    ).value || null,

                pickupDate:
                    document.getElementById(
                        "pickupDate"
                    ).value || null,

                shippedDate:
                    document.getElementById(
                        "shippedDate"
                    ).value || null,

                shippingCost:
                    Number(
                        document.getElementById(
                            "shippingCost"
                        ).value || 0
                    ),

                remarks:
                    document.getElementById(
                        "remarks"
                    ).value || null,

                returnReason: null,

                conditionNotes: null,

                items:
                    selectedInventoryIds.map(
                        id => ({
                            inventoryId: id
                        })
                    )
            };



            console.log(payload);



            // =====================================
            // POST
            // =====================================

            const response =
                await fetch(
                    "/api/supplier-returns",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );



            const result =
                await response.json();



            // =====================================
            // FAILED
            // =====================================

            if (!response.ok) {

                alert(
                    result.message ||
                    "Failed to create supplier return."
                );

                return;
            }



            // =====================================
            // SUCCESS
            // =====================================

            alert(
                result.message ||
                "Supplier return created successfully."
            );



            // =====================================
            // REDIRECT
            // =====================================

            window.location.href =
                "/Admin/ReturnOrders/ReturnIndex";
        }
        catch (err) {

            console.error(err);

            alert(
                "Something went wrong."
            );
        }
    }
);