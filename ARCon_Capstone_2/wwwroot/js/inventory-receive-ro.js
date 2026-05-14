// =====================================
// GLOBALS
// =====================================

let selectedReturnOrder = null;

let selectedReturnItems = [];



// =====================================
// OPEN MODAL
// =====================================

async function openReturnOrderModal() {

    const modal =
        new bootstrap.Modal(
            document.getElementById(
                "returnOrderModal"
            )
        );

    modal.show();

    await loadReturnOrdersForReceiving();
}



// =====================================
// LOAD RETURN ORDERS
// =====================================

async function loadReturnOrdersForReceiving() {

    try {

        const response =
            await fetch(
                "/api/supplier-returns/for-receiving"
            );

        const data =
            await response.json();

        renderReturnOrdersModal(
            data || []
        );
    }
    catch (err) {

        console.error(err);

        alert(
            "Failed to load return orders."
        );
    }
}



// =====================================
// RENDER MODAL TABLE
// =====================================

function renderReturnOrdersModal(
    items
) {

    const tbody =
        document.getElementById(
            "returnOrderModalBody"
        );

    tbody.innerHTML = "";



    // EMPTY

    if (!items || items.length === 0) {

        tbody.innerHTML = `

            <tr>

                <td colspan="7"
                    class="text-center text-muted py-4">

                    No SENT return orders found.

                </td>

            </tr>
        `;

        return;
    }



    // ROWS

    items.forEach(item => {

        tbody.innerHTML += `

            <tr>

                <td>

                    ${item.return_number}

                </td>



                <td>

                    ${item.supplier_name}

                </td>



                <td>

                    <span class="badge bg-primary">

                        ${item.status}

                    </span>

                </td>



                <td>

                    ${item.return_method || "-"}

                </td>



                <td>

                    ${item.total_items || 0}

                </td>



                <td>

                    ${formatDate(
            item.created_at
        )}

                </td>



                <td>

                    <button class="btn btn-sm btn-primary"
                            onclick="selectReturnOrder(${item.id})">

                        Select

                    </button>

                </td>

            </tr>
        `;
    });
}



// =====================================
// SELECT RETURN ORDER
// =====================================

async function selectReturnOrder(
    id
) {

    try {

        const response =
            await fetch(
                `/api/supplier-returns/${id}/receive-summary`
            );

        const data =
            await response.json();



        selectedReturnOrder =
            data;

        selectedReturnItems =
            data.items || [];



        // CLOSE MODAL

        bootstrap.Modal
            .getInstance(
                document.getElementById(
                    "returnOrderModal"
                )
            )
            .hide();



        // SHOW INFO

        renderReturnOrderInfo(
            data
        );



        // SHOW ITEMS

        renderReturnedItems(
            selectedReturnItems
        );



        // SHOW REPLACEMENT TABLE

        renderReplacementInputs(
            selectedReturnItems
        );
    }
    catch (err) {

        console.error(err);

        alert(
            "Failed to load return summary."
        );
    }
}



// =====================================
// HEADER INFO
// =====================================

function renderReturnOrderInfo(
    data
) {

    document.getElementById(
        "returnOrderInfo"
    ).classList.remove(
        "d-none"
    );



    document.getElementById(
        "returnNumber"
    ).innerText =
        data.return_number || "-";



    document.getElementById(
        "returnSupplier"
    ).innerText =
        data.supplier_name || "-";



    document.getElementById(
        "returnStatus"
    ).innerText =
        data.status || "-";



    document.getElementById(
        "returnMethod"
    ).innerText =
        data.return_method || "-";



    document.getElementById(
        "returnCourier"
    ).innerText =
        data.courier_name || "-";



    document.getElementById(
        "returnTracking"
    ).innerText =
        data.tracking_number || "-";



    document.getElementById(
        "returnItems"
    ).innerText =
        data.total_items || 0;



    document.getElementById(
        "returnShipping"
    ).innerText =
        `₱${formatPrice(
            data.shipping_cost || 0
        )}`;



    document.getElementById(
        "returnRemarks"
    ).innerText =
        data.remarks || "-";
}



// =====================================
// RETURNED ITEMS
// =====================================

function renderReturnedItems(
    items
) {

    document.getElementById(
        "returnItemsSection"
    ).classList.remove(
        "d-none"
    );



    const tbody =
        document.getElementById(
            "returnItemsBody"
        );

    tbody.innerHTML = "";



    items.forEach(item => {

        tbody.innerHTML += `

            <tr>

                <td>

                    ${item.defective_serial || "-"}

                </td>



                <td>

                    ${item.product_name || "-"}

                </td>



                <td>

                    ${item.sku || "-"}

                </td>



                <td>

                    ${item.return_reason || "-"}

                </td>



                <td class="text-center">

                    <span class="badge bg-warning text-dark">

                        PENDING

                    </span>

                </td>

            </tr>
        `;
    });
}



// =====================================
// REPLACEMENT INPUTS
// =====================================

function renderReplacementInputs(
    items
) {

    document.getElementById(
        "replacementInventorySection"
    ).classList.remove(
        "d-none"
    );



    const tbody =
        document.getElementById(
            "replacementInventoryBody"
        );

    tbody.innerHTML = "";



    items.forEach(item => {

        tbody.innerHTML += `

            <tr>

                <td>

                    ${item.product_name || "-"}

                </td>



                <td>

                    ${item.defective_serial || "-"}

                </td>



                <td>

                    <input type="text"
                           class="form-control form-control-sm replacement-serial-input"
                           data-item-id="${item.id}"
                           placeholder="Enter replacement serial">

                </td>

            </tr>
        `;
    });
}



// =====================================
// RECEIVE INVENTORY
// =====================================

async function receiveReplacementInventory() {

    try {

        if (!selectedReturnOrder) {

            alert(
                "Please select a return order."
            );

            return;
        }



        // BUILD ITEMS

        const items = [];



        document.querySelectorAll(
            ".replacement-serial-input"
        ).forEach(input => {

            const serial =
                input.value.trim();

            if (!serial)
                return;

            items.push({

                supplierReturnItemId:
                    Number(
                        input.dataset.itemId
                    ),

                replacementSerial:
                    serial
            });
        });



        if (items.length === 0) {

            alert(
                "Please enter replacement serial numbers."
            );

            return;
        }



        // PAYLOAD

        const payload = {
            items
        };



        console.log(payload);



        // TODO:
        // POST RECEIVE API HERE



        alert(
            "Ready for receiving API."
        );
    }
    catch (err) {

        console.error(err);

        alert(
            "Failed to receive replacement inventory."
        );
    }
}



// =====================================
// FORMAT DATE
// =====================================

function formatDate(date) {

    if (!date)
        return "-";

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


//////////////////////////////////// POST ////////////////////////////////////////


// =====================================
// RECEIVE INVENTORY
// =====================================

async function receiveReplacementInventory() {

    try {

        if (!selectedReturnOrder) {

            alert(
                "Please select a return order."
            );

            return;
        }



        // =====================================
        // BUILD ITEMS
        // =====================================

        const items = [];



        document.querySelectorAll(
            ".replacement-serial-input"
        ).forEach(input => {

            const serial =
                input.value.trim();

            if (!serial)
                return;

            items.push({

                supplierReturnItemId:
                    Number(
                        input.dataset.itemId
                    ),

                replacementSerial:
                    serial
            });
        });



        // =====================================
        // VALIDATE
        // =====================================

        if (items.length === 0) {

            alert(
                "Please enter replacement serial numbers."
            );

            return;
        }



        // =====================================
        // PAYLOAD
        // =====================================

        const payload = {
            items
        };



        console.log(payload);



        // =====================================
        // POST
        // =====================================

        const response =
            await fetch(

                `/api/supplier-returns/${selectedReturnOrder.id}/receive`,

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
                "Failed to receive replacement inventory."
            );

            return;
        }



        // =====================================
        // SUCCESS
        // =====================================

        alert(
            result.message ||
            "Replacement inventory received successfully."
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