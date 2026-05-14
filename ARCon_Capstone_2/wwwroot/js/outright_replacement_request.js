let currentPage = 1;
let pageSize = 24;

let currentSearch = "";

let currentSortBy = "created_at";
let currentSortDirection = "desc";

let debounceTimer = null;


/////////////////////////////                                       DIPLAY THE TABLE                                           //////////////////////////

document.addEventListener("DOMContentLoaded", () => {

    loadOutrightReplacementRequests();

});

async function loadOutrightReplacementRequests(page = 1) {

    currentPage = page;

    try {

        const response = await fetch(

            `/api/outright-replacements/admin/outright-replacements?page=${currentPage}` +
            `&pageSize=${pageSize}` +
            `&search=${encodeURIComponent(currentSearch)}` +
            `&sortBy=${currentSortBy}` +
            `&sortDirection=${currentSortDirection}`

        );

        if (!response.ok) {

            throw new Error(
                "Failed to load outright replacement requests."
            );
        }

        const data = await response.json();

        renderOutrightReplacementRequestsTable(
            data.data
        );

        renderPagination(
            data.currentPage,
            data.totalPages
        );

        renderCountInfo(
            data.totalCount,
            data.currentPage,
            data.pageSize
        );

    }
    catch (error) {

        console.error(error);

    }
}

function renderOutrightReplacementRequestsTable(items) {

    const tbody = document.getElementById(
        "outrightReplacementRequestsTableBody"
    );

    tbody.innerHTML = "";

    if (!items || items.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="7"
                    class="text-center text-muted py-4">

                    No outright replacement requests found.

                </td>
            </tr>
        `;

        return;
    }

    items.forEach(item => {

        tbody.innerHTML += `
            <tr>

                <td>
                    ${item.warranty_code ?? "-"}
                </td>

                <td>
                    ${item.customer_transaction?.transaction_code ?? "-"}
                </td>

                <td>
                    ${item.customer?.first_name ?? "-"}
                    ${item.customer?.last_name ?? ""}
                </td>

                <td class="text-truncate"
                    style="max-width: 250px;"
                    title="${item.customer_notes ?? "-"}">

                    ${item.customer_notes ?? "-"}

                </td>

                <td>

                    <span class="badge bg-secondary">

                        ${item.status}

                    </span>

                </td>

                <td>
                    ${formatDateTime(item.created_at)}
                </td>

                <td class="text-center">

                    <div class="dropdown">

                        <button class="btn btn-sm warranty-action-btn dropdown-toggle"
                                type="button"
                                data-bs-toggle="dropdown"
                                aria-expanded="false">

                            <i class="bi bi-three-dots"></i>

                        </button>

                                        <ul class="dropdown-menu dropdown-menu-end warranty-dropdown shadow-sm border-0">

                                            <!-- VIEW -->

                                            <li>

                                                <button class="dropdown-item warranty-dropdown-item"
                                                        type="button"
                                                        onclick="window.location.href='/Admin/Warranty/Outright_Replacement_Summary/${item.id}'">

                                                    <i class="bi bi-eye me-2"></i>

                                                    View

                                                </button>

                                            </li>



                                            ${item.status === "PENDING_REVIEW"

                                                        ? `

                                                    <!-- PROCESS -->

                                                    <li>

                                                        <button class="dropdown-item warranty-dropdown-item text-primary"
                                                                type="button"
                                                                onclick="openProcessReplacementModal(${item.id})">

                                                            <i class="bi bi-arrow-repeat me-2"></i>

                                                            Process

                                                        </button>

                                                    </li>



                                                    <!-- REJECT -->

                                                    <li>

                                                        <button class="dropdown-item warranty-dropdown-item text-danger"
                                                                type="button"
                                                                onclick="openRejectOutrightReplacementModal(${item.id})">

                                                            <i class="bi bi-x-circle me-2"></i>

                                                            Reject

                                                        </button>

                                                    </li>

                                                `
                                                        : ""
                                                    }



                                            ${item.status === "FOR_RELEASE"

                                                        ? `

                                                    <!-- RELEASE -->

                                                    <li>

                                                        <button class="dropdown-item warranty-dropdown-item text-warning"
                                                                type="button"
                                                              onclick="openReleaseReplacementModal(${item.id})">

                                                            <i class="bi bi-truck me-2"></i>

                                                            Release

                                                        </button>

                                                    </li>

                                                `
                                                        : ""
                                                    }



                                            ${item.status === "RELEASED"

                                                        ? `

                                                    <!-- COMPLETE -->

                                                    <li>

                                                        <button class="dropdown-item warranty-dropdown-item text-success"
                                                                type="button"
                                                                onclick="openCompleteReplacementModal(${item.id})">

                                                            <i class="bi bi-check-circle me-2"></i>

                                                            Mark as Complete

                                                        </button>

                                                    </li>

                                                `
                                                        : ""
                                            }

                                        </ul>

                    </div>

                </td>

            </tr>
        `;
    });
}

function searchOutrightReplacementRequests() {

    clearTimeout(debounceTimer);

    debounceTimer = setTimeout(() => {

        currentSearch = document
            .getElementById("outrightReplacementSearchInput")
            .value
            .trim();

        loadOutrightReplacementRequests(1);

    }, 400);
}

function sortOutrightReplacementRequests(sortBy) {

    if (currentSortBy === sortBy) {

        currentSortDirection =
            currentSortDirection === "asc"
                ? "desc"
                : "asc";
    }
    else {

        currentSortBy = sortBy;
        currentSortDirection = "asc";
    }

    loadOutrightReplacementRequests(1);
}

function renderPagination(current, totalPages) {

    const pagination =
        document.getElementById(
            "outrightReplacementPagination"
        );

    pagination.innerHTML = "";

    if (totalPages <= 1)
        return;

    for (let i = 1; i <= totalPages; i++) {

        pagination.innerHTML += `
            <li class="page-item ${i === current ? "active" : ""}">

                <button class="page-link"
                        onclick="loadOutrightReplacementRequests(${i})">

                    ${i}

                </button>

            </li>
        `;
    }
}

function renderCountInfo(totalCount, page, pageSize) {

    const info =
        document.getElementById("orrCountInfo");

    const start =
        ((page - 1) * pageSize) + 1;

    const end =
        Math.min(page * pageSize, totalCount);

    if (totalCount === 0) {

        info.innerHTML = `
            Showing 0 entries
        `;

        return;
    }

    info.innerHTML = `
        Showing ${start} to ${end}
        of ${totalCount} entries
    `;
}

function formatDateTime(dateString) {

    if (!dateString)
        return "-";

    return new Date(dateString)
        .toLocaleString();
}


//////////////////////////////////////////////    REJECT    ////////////////////////////////////////////////////
let currentRejectOutrightReplacementId = null;

let rejectReplacementInterval = null;



// =====================================
// OPEN FIRST MODAL
// =====================================

function openRejectOutrightReplacementModal(id) {

    currentRejectOutrightReplacementId = id;

    document.getElementById(
        "rejectReplacementReason"
    ).value = "";

    const modal =
        new bootstrap.Modal(
            document.getElementById(
                "rejectOutrightReplacementModal"
            )
        );

    modal.show();
}



// =====================================
// NEXT BUTTON
// =====================================

document.getElementById(
    "proceedRejectReplacementBtn"
).addEventListener("click", () => {

    const reason =
        document.getElementById(
            "rejectReplacementReason"
        ).value.trim();

    if (!reason ||
        reason.length < 5) {

        showToast(
            "Rejection reason must contain at least 5 characters.",
            "warning"
        );

        return;
    }

    // CLOSE FIRST MODAL

    const modal1 =
        bootstrap.Modal.getInstance(
            document.getElementById(
                "rejectOutrightReplacementModal"
            )
        );

    modal1.hide();

    // OPEN FINAL CONFIRM

    showFinalRejectReplacementModal(reason);
});



// =====================================
// FINAL CONFIRM
// =====================================

function showFinalRejectReplacementModal(reason) {

    let seconds = 5;

    const total = 5;

    const text =
        document.getElementById(
            "rejectReplacementCountdownText"
        );

    const bar =
        document.getElementById(
            "rejectReplacementCountdownBar"
        );

    const btn =
        document.getElementById(
            "confirmRejectReplacementBtn"
        );

    const modalEl =
        document.getElementById(
            "finalRejectOutrightReplacementModal"
        );

    const modal =
        new bootstrap.Modal(modalEl);



    // RESET

    btn.disabled = true;

    text.innerText = seconds;

    bar.style.width = "0%";



    // SHOW MODAL

    modal.show();



    // CLEAR OLD INTERVAL

    if (rejectReplacementInterval) {

        clearInterval(
            rejectReplacementInterval
        );
    }



    // START COUNTDOWN

    rejectReplacementInterval =
        setInterval(() => {

            seconds--;

            text.innerText = seconds;

            bar.style.width =
                (
                    ((total - seconds) / total) * 100
                ) + "%";

            if (seconds <= 0) {

                clearInterval(
                    rejectReplacementInterval
                );

                btn.disabled = false;
            }

        }, 1000);



    // CONFIRM

    btn.onclick = () => {

        modal.hide();

        submitRejectOutrightReplacement(reason);
    };



    // RESET WHEN CLOSED

    modalEl.addEventListener(

        "hidden.bs.modal",

        () => {

            clearInterval(
                rejectReplacementInterval
            );

            btn.disabled = true;

            text.innerText = "5";

            bar.style.width = "0%";
        },

        { once: true }
    );
}



// =====================================
// SUBMIT REJECT
// =====================================

async function submitRejectOutrightReplacement(reason) {

    try {

        const res =
            await fetch(

                `/api/outright-replacements/${currentRejectOutrightReplacementId}/reject`,

                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            rejectionReason: reason
                        })
                }
            );



        // SUCCESS

        if (res.ok) {

            const data =
                await res.json();

            showToast(
                data.message ||
                "Replacement request rejected successfully.",
                "success"
            );

            setTimeout(() => {

                location.reload();

            }, 1200);

            return;
        }



        // ERROR

        let errMessage =
            "Reject failed.";

        try {

            const err =
                await res.json();

            errMessage =
                err.message ||
                errMessage;
        }
        catch {

            errMessage =
                await res.text();
        }

        showToast(
            errMessage,
            "danger"
        );
    }
    catch (err) {

        console.error(err);

        showToast(
            "Error rejecting replacement request.",
            "danger"
        );
    }
}




//////////////////////////////////////////////    Process    ////////////////////////////////////////////////////

let currentProcessReplacementId = null;

let processReplacementSelections = [];

let processReplacementInterval = null;



// =====================================
// OPEN PROCESS MODAL
// =====================================

async function openProcessReplacementModal(id) {

    try {

        currentProcessReplacementId = id;

        processReplacementSelections = [];



        // =====================================
        // GET SUMMARY
        // =====================================

        const response =
            await fetch(
                `/api/outright-replacements/summary/${id}`
            );

        if (!response.ok) {

            throw new Error(
                "Failed to load replacement details."
            );
        }

        const data =
            await response.json();



        // =====================================
        // CONTAINER
        // =====================================

        const container =
            document.getElementById(
                "processReplacementItemsContainer"
            );

        container.innerHTML = "";


        // =====================================
        // BUILD WARRANTY ITEMS
        // =====================================

        for (const item of data.items) {

            // GET AVAILABLE STOCK

            const stockRes =
                await fetch(
                    `/api/outright-replacements/${item.id}/available-replacements`
                );

            if (!stockRes.ok) {

                throw new Error(
                    "Failed to load replacement inventory."
                );
            }

            const stockData =
                await stockRes.json();



            container.innerHTML += `

        <div class="border rounded-4 p-4 mb-3">

            <div class="d-flex justify-content-between align-items-start mb-3">

                <div>

                    <div class="fw-bold fs-6">

                        ${item.product_name}

                    </div>

                    <div class="small text-muted">

                        Original Serial:
                        ${item.original_serial_number ?? "-"}

                    </div>

                </div>

                <span class="badge bg-primary-subtle text-primary">

                    Available:
                    ${stockData.availableStock}

                </span>

            </div>



            <label class="form-label fw-semibold">

                Select Replacement Unit

            </label>

            <select class="form-select replacement-select"
                    data-item-id="${item.id}">

                <option value="">
                    Select Inventory Unit
                </option>

                ${stockData.replacementUnits.map(x => `

                    <option value="${x.inventoryId}">

                        ${x.serialNumber}

                    </option>

                `).join("")}

            </select>

        </div>
    `;
        }


        // =====================================
        // SHOW MODAL
        // =====================================

        const modal =
            new bootstrap.Modal(
                document.getElementById(
                    "processReplacementModal"
                )
            );

        modal.show();

    }
    catch (err) {

        console.error(err);

        showToast(
            err.message ||
            "Failed to open process modal.",
            "danger"
        );
    }
}



// =====================================
// NEXT BUTTON
// =====================================

const proceedBtn =
    document.getElementById(
        "proceedProcessReplacementBtn"
    );

if (proceedBtn) {

    proceedBtn.addEventListener("click", () => {

        const selects =
            document.querySelectorAll(
                ".replacement-select"
            );

        processReplacementSelections = [];



        // =====================================
        // VALIDATE ALL SELECTS
        // =====================================

        for (const select of selects) {

            if (!select.value) {

                showToast(
                    "Please select replacement inventory for all items.",
                    "warning"
                );

                return;
            }

            processReplacementSelections.push({

                warrantyItemId:
                    parseInt(
                        select.dataset.itemId
                    ),

                replacementInventoryId:
                    parseInt(
                        select.value
                    ),

                replacementSerial:
                    select.options[
                        select.selectedIndex
                    ].text
            });
        }



        // =====================================
        // CLOSE FIRST MODAL
        // =====================================

        const modal1 =
            bootstrap.Modal.getInstance(
                document.getElementById(
                    "processReplacementModal"
                )
            );

        modal1.hide();



        // =====================================
        // OPEN FINAL CONFIRM
        // =====================================

        showFinalProcessReplacementModal();

    });
}


// =====================================
// FINAL CONFIRM
// =====================================

function showFinalProcessReplacementModal() {

    let seconds = 5;

    const total = 5;

    const text =
        document.getElementById(
            "processReplacementCountdownText"
        );

    const bar =
        document.getElementById(
            "processReplacementCountdownBar"
        );

    const btn =
        document.getElementById(
            "confirmProcessReplacementBtn"
        );

    const modalEl =
        document.getElementById(
            "finalProcessReplacementModal"
        );

    const modal =
        new bootstrap.Modal(modalEl);



    // =====================================
    // BUILD CONFIRMATION LABEL
    // =====================================

    const confirmationLabel =
        document.getElementById(
            "processReplacementConfirmLabel"
        );

    confirmationLabel.innerHTML = `

        <div class="fw-semibold mb-3">

            Are you sure that this

            <span class="text-primary">

                ${processReplacementSelections
            .map(x =>
                `(Product Serial ${x.replacementSerial})`
            )
            .join(", ")}

            </span>

            will be sent as replacement?

        </div>

        <div class="small text-danger">

            Please ensure that the defective products
            are already physically on hand before
            proceeding.

            The defective units will be marked as
            <strong>DEFECTIVE</strong>.

        </div>
    `;



    // =====================================
    // RESET
    // =====================================

    btn.disabled = true;

    text.innerText = seconds;

    bar.style.width = "0%";



    // =====================================
    // SHOW MODAL
    // =====================================

    modal.show();



    // =====================================
    // CLEAR OLD INTERVAL
    // =====================================

    if (processReplacementInterval) {

        clearInterval(
            processReplacementInterval
        );
    }



    // =====================================
    // START COUNTDOWN
    // =====================================

    processReplacementInterval =
        setInterval(() => {

            seconds--;

            text.innerText = seconds;

            bar.style.width =
                (
                    ((total - seconds) / total) * 100
                ) + "%";

            if (seconds <= 0) {

                clearInterval(
                    processReplacementInterval
                );

                btn.disabled = false;
            }

        }, 1000);



    // =====================================
    // CONFIRM BUTTON
    // =====================================

    btn.onclick = () => {

        modal.hide();

        submitProcessReplacement();
    };



    // =====================================
    // RESET WHEN CLOSED
    // =====================================

    modalEl.addEventListener(

        "hidden.bs.modal",

        () => {

            clearInterval(
                processReplacementInterval
            );

            btn.disabled = true;

            text.innerText = "5";

            bar.style.width = "0%";
        },

        { once: true }
    );
}



// =====================================
// SUBMIT PROCESS
// =====================================

async function submitProcessReplacement() {

    try {

        const res =
            await fetch(

                `/api/outright-replacements/${currentProcessReplacementId}/process`,

                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            items:
                                processReplacementSelections
                        })
                }
            );



        // =====================================
        // SUCCESS
        // =====================================

        if (res.ok) {

            const data =
                await res.json();

            showToast(
                data.message ||
                "Replacement processed successfully.",
                "success"
            );

            setTimeout(() => {

                location.reload();

            }, 1200);

            return;
        }



        // =====================================
        // ERROR
        // =====================================

        let errMessage =
            "Process failed.";

        try {

            const err =
                await res.json();

            errMessage =
                err.message ||
                errMessage;
        }
        catch {

            errMessage =
                await res.text();
        }

        showToast(
            errMessage,
            "danger"
        );
    }
    catch (err) {

        console.error(err);

        showToast(
            "Error processing replacement.",
            "danger"
        );
    }
}



///////// SUBMIT POST  //////////

// =====================================
// SUBMIT PROCESS REPLACEMENT
// =====================================

async function submitProcessReplacement() {

    try {

        // =====================================
        // API REQUEST
        // =====================================

        const response =
            await fetch(

                `/api/outright-replacements/${currentProcessReplacementId}/process`,

                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            items:
                                processReplacementSelections.map(x => ({

                                    warrantyItemId:
                                        x.warrantyItemId,

                                    replacementInventoryId:
                                        x.replacementInventoryId
                                }))
                        })
                }
            );



        // =====================================
        // SUCCESS
        // =====================================

        if (response.ok) {

            const data =
                await response.json();

            showToast(
                data.message ||
                "Replacement request processed successfully.",
                "success"
            );



            // RELOAD AFTER SHORT DELAY

            setTimeout(() => {

                location.reload();

            }, 1200);

            return;
        }



        // =====================================
        // ERROR RESPONSE
        // =====================================

        let errorMessage =
            "Failed to process replacement request.";



        try {

            const err =
                await response.json();

            errorMessage =
                err.message ||
                errorMessage;
        }
        catch {

            errorMessage =
                await response.text();
        }



        showToast(
            errorMessage,
            "danger"
        );

    }
    catch (err) {

        console.error(err);

        showToast(
            "Error processing replacement request.",
            "danger"
        );
    }
}

///////////////////////////////////////////////////  FOR RELEASE   /////////////////////////////////////////////////////////


let currentReleaseReplacementId = null;

let releaseReplacementInterval = null;



// =====================================
// OPEN RELEASE MODAL
// =====================================

function openReleaseReplacementModal(id) {

    currentReleaseReplacementId = id;



    // RESET FIELDS

    document.getElementById(
        "releaseMethod"
    ).value = "";

    document.getElementById(
        "deliveryType"
    ).value = "";

    document.getElementById(
        "courierName"
    ).value = "";

    document.getElementById(
        "trackingNumber"
    ).value = "";

    document.getElementById(
        "deliveryDate"
    ).value = "";

    document.getElementById(
        "pickupDate"
    ).value = "";



    // HIDE CONDITIONAL FIELDS

    document.getElementById(
        "deliveryFields"
    ).style.display = "none";

    document.getElementById(
        "pickupFields"
    ).style.display = "none";

    document.getElementById(
        "courierFields"
    ).style.display = "none";



    // SHOW MODAL

    const modal =
        new bootstrap.Modal(
            document.getElementById(
                "releaseReplacementModal"
            )
        );

    modal.show();
}



// =====================================
// RELEASE METHOD CHANGE
// =====================================

document.getElementById(
    "releaseMethod"
).addEventListener("change", function () {

    const value = this.value;



    // RESET

    document.getElementById(
        "deliveryFields"
    ).style.display = "none";

    document.getElementById(
        "pickupFields"
    ).style.display = "none";

    document.getElementById(
        "courierFields"
    ).style.display = "none";



    // =====================================
    // STORE PICKUP
    // =====================================

    if (value === "STORE_PICKUP") {

        document.getElementById(
            "pickupFields"
        ).style.display = "block";
    }



    // =====================================
    // DELIVERY
    // =====================================

    if (value === "DELIVERY") {

        document.getElementById(
            "deliveryFields"
        ).style.display = "block";
    }
});



// =====================================
// DELIVERY TYPE CHANGE
// =====================================

document.getElementById(
    "deliveryType"
).addEventListener("change", function () {

    const value = this.value;



    document.getElementById(
        "courierFields"
    ).style.display =

        value === "COURIER"

            ? "block"

            : "none";
});



// =====================================
// NEXT BUTTON
// =====================================

document.getElementById(
    "proceedReleaseReplacementBtn"
).addEventListener("click", () => {

    const releaseMethod =
        document.getElementById(
            "releaseMethod"
        ).value;

    const deliveryType =
        document.getElementById(
            "deliveryType"
        ).value;

    const courierName =
        document.getElementById(
            "courierName"
        ).value;

    const trackingNumber =
        document.getElementById(
            "trackingNumber"
        ).value;

    const deliveryDate =
        document.getElementById(
            "deliveryDate"
        ).value;

    const pickupDate =
        document.getElementById(
            "pickupDate"
        ).value;



    // =====================================
    // VALIDATE RELEASE METHOD
    // =====================================

    if (!releaseMethod) {

        showToast(
            "Release method is required.",
            "warning"
        );

        return;
    }



    // =====================================
    // STORE PICKUP VALIDATION
    // =====================================

    if (
        releaseMethod === "STORE_PICKUP" &&
        !pickupDate
    ) {

        showToast(
            "Pickup date is required.",
            "warning"
        );

        return;
    }



    // =====================================
    // DELIVERY VALIDATION
    // =====================================

    if (releaseMethod === "DELIVERY") {

        if (!deliveryType) {

            showToast(
                "Delivery type is required.",
                "warning"
            );

            return;
        }

        if (!deliveryDate) {

            showToast(
                "Delivery date is required.",
                "warning"
            );

            return;
        }
    }



    // =====================================
    // COURIER VALIDATION
    // =====================================

    if (
        deliveryType === "COURIER" &&
        !courierName.trim()
    ) {

        showToast(
            "Courier name is required.",
            "warning"
        );

        return;
    }



    // =====================================
    // CLOSE FIRST MODAL
    // =====================================

    const modal1 =
        bootstrap.Modal.getInstance(
            document.getElementById(
                "releaseReplacementModal"
            )
        );

    modal1.hide();



    // =====================================
    // OPEN FINAL MODAL
    // =====================================

    showFinalReleaseReplacementModal();
});


// =====================================
// FINAL RELEASE CONFIRM MODAL
// =====================================

function showFinalReleaseReplacementModal() {

    let seconds = 5;

    const total = 5;

    const text =
        document.getElementById(
            "releaseReplacementCountdownText"
        );

    const bar =
        document.getElementById(
            "releaseReplacementCountdownBar"
        );

    const btn =
        document.getElementById(
            "confirmReleaseReplacementBtn"
        );

    const modalEl =
        document.getElementById(
            "finalReleaseReplacementModal"
        );

    const modal =
        new bootstrap.Modal(modalEl);



    // =====================================
    // GET VALUES
    // =====================================

    const releaseMethod =
        document.getElementById(
            "releaseMethod"
        ).value;

    const deliveryType =
        document.getElementById(
            "deliveryType"
        ).value;

    const courierName =
        document.getElementById(
            "courierName"
        ).value;



    // =====================================
    // BUILD CONFIRM LABEL
    // =====================================

    document.getElementById(
        "releaseReplacementConfirmLabel"
    ).innerHTML = `

        <div class="fw-semibold mb-3">

            Are you sure you want to release
            this replacement request?

        </div>

        <div class="small text-muted">

            Release Method:
            <strong>${releaseMethod}</strong>

        </div>

        ${deliveryType
            ? `
                <div class="small text-muted">

                    Delivery Type:
                    <strong>${deliveryType}</strong>

                </div>
            `
            : ""
        }

        ${courierName
            ? `
                <div class="small text-muted">

                    Courier:
                    <strong>${courierName}</strong>

                </div>
            `
            : ""
        }
    `;



    // =====================================
    // RESET
    // =====================================

    btn.disabled = true;

    text.innerText = seconds;

    bar.style.width = "0%";



    // SHOW MODAL

    modal.show();



    // CLEAR OLD INTERVAL

    if (releaseReplacementInterval) {

        clearInterval(
            releaseReplacementInterval
        );
    }



    // START COUNTDOWN

    releaseReplacementInterval =
        setInterval(() => {

            seconds--;

            text.innerText = seconds;

            bar.style.width =
                (
                    ((total - seconds) / total) * 100
                ) + "%";

            if (seconds <= 0) {

                clearInterval(
                    releaseReplacementInterval
                );

                btn.disabled = false;
            }

        }, 1000);



    // CONFIRM BUTTON

    btn.onclick = () => {

        modal.hide();

        submitReleaseReplacement();
    };



    // RESET ON CLOSE

    modalEl.addEventListener(

        "hidden.bs.modal",

        () => {

            clearInterval(
                releaseReplacementInterval
            );

            btn.disabled = true;

            text.innerText = "5";

            bar.style.width = "0%";
        },

        { once: true }
    );
}


// =====================================
// SUBMIT RELEASE
// =====================================

async function submitReleaseReplacement() {

    try {

        const response =
            await fetch(

                `/api/outright-replacements/${currentReleaseReplacementId}/release`,

                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            releaseMethod:
                                document.getElementById(
                                    "releaseMethod"
                                ).value || null,

                            deliveryType:
                                document.getElementById(
                                    "deliveryType"
                                ).value || null,

                            courierName:
                                document.getElementById(
                                    "courierName"
                                ).value || null,

                            trackingNumber:
                                document.getElementById(
                                    "trackingNumber"
                                ).value || null,

                            deliveryDate:
                                document.getElementById(
                                    "deliveryDate"
                                ).value || null,

                            pickupDate:
                                document.getElementById(
                                    "pickupDate"
                                ).value || null
                        })
                }
            );



        // =====================================
        // SUCCESS
        // =====================================

        if (response.ok) {

            const data =
                await response.json();

            showToast(
                data.message ||
                "Replacement released successfully.",
                "success"
            );

            setTimeout(() => {

                location.reload();

            }, 1200);

            return;
        }



        // =====================================
        // ERROR
        // =====================================

        let errMessage =
            "Failed to release replacement.";

        try {

            const err =
                await response.json();

            errMessage =
                err.message ||
                errMessage;
        }
        catch {

            errMessage =
                await response.text();
        }



        showToast(
            errMessage,
            "danger"
        );
    }
    catch (err) {

        console.error(err);

        showToast(
            "Error releasing replacement.",
            "danger"
        );
    }
}


///////////////////////////////////////////////////////  COMPLETE //////////////////////////////////////////////////////////////////

let currentCompleteReplacementId = null;

let completeReplacementInterval = null;



// =====================================
// OPEN COMPLETE MODAL
// =====================================

function openCompleteReplacementModal(id) {

    currentCompleteReplacementId = id;



    const modal =
        new bootstrap.Modal(
            document.getElementById(
                "completeReplacementModal"
            )
        );

    modal.show();



    startCompleteReplacementCountdown();
}



// =====================================
// COUNTDOWN
// =====================================

function startCompleteReplacementCountdown() {

    let seconds = 5;

    const total = 5;

    const text =
        document.getElementById(
            "completeReplacementCountdownText"
        );

    const bar =
        document.getElementById(
            "completeReplacementCountdownBar"
        );

    const btn =
        document.getElementById(
            "confirmCompleteReplacementBtn"
        );



    // RESET

    btn.disabled = true;

    text.innerText = seconds;

    bar.style.width = "0%";



    // CLEAR OLD

    if (completeReplacementInterval) {

        clearInterval(
            completeReplacementInterval
        );
    }



    // START

    completeReplacementInterval =
        setInterval(() => {

            seconds--;

            text.innerText = seconds;

            bar.style.width =
                (
                    ((total - seconds) / total) * 100
                ) + "%";

            if (seconds <= 0) {

                clearInterval(
                    completeReplacementInterval
                );

                btn.disabled = false;
            }

        }, 1000);
}



// =====================================
// CONFIRM COMPLETE
// =====================================

document.getElementById(
    "confirmCompleteReplacementBtn"
).addEventListener("click", async () => {

    try {

        const response =
            await fetch(

                `/api/outright-replacements/${currentCompleteReplacementId}/complete`,

                {
                    method: "POST"
                }
            );



        // SUCCESS

        if (response.ok) {

            const data =
                await response.json();

            showToast(
                data.message ||
                "Replacement completed successfully.",
                "success"
            );



            // CLOSE MODAL

            const modal =
                bootstrap.Modal.getInstance(
                    document.getElementById(
                        "completeReplacementModal"
                    )
                );

            modal.hide();



            // RELOAD

            setTimeout(() => {

                location.reload();

            }, 1200);

            return;
        }



        // ERROR

        let errMessage =
            "Failed to complete replacement.";

        try {

            const err =
                await response.json();

            errMessage =
                err.message ||
                errMessage;
        }
        catch {

            errMessage =
                await response.text();
        }



        showToast(
            errMessage,
            "danger"
        );
    }
    catch (err) {

        console.error(err);

        showToast(
            "Error completing replacement.",
            "danger"
        );
    }
});



// =====================================
// RESET ON MODAL CLOSE
// =====================================

document.getElementById(
    "completeReplacementModal"
).addEventListener(
    "hidden.bs.modal",

    () => {

        clearInterval(
            completeReplacementInterval
        );

        document.getElementById(
            "confirmCompleteReplacementBtn"
        ).disabled = true;

        document.getElementById(
            "completeReplacementCountdownText"
        ).innerText = "5";

        document.getElementById(
            "completeReplacementCountdownBar"
        ).style.width = "0%";
    }
);



////  TOAST    /////

function showToast(
    message,
    type = "success",
    delay = 6000
) {

    let container =
        document.getElementById(
            "toastContainer"
        );

    if (!container) {

        container =
            document.createElement("div");

        container.id =
            "toastContainer";

        container.className =
            "toast-container position-fixed top-0 end-0 p-3";

        container.style.zIndex =
            "99999";

        document.body.appendChild(
            container
        );
    }



    const bgClass = {

        success:
            "toast-success",

        danger:
            "toast-danger",

        warning:
            "toast-warning",

        info:
            "toast-info"

    }[type] || "toast-info";



    const toastEl =
        document.createElement("div");

    toastEl.className =
        `toast custom-toast align-items-center ${bgClass} border-0`;

    toastEl.role =
        "alert";

    toastEl.innerHTML = `

        <div class="d-flex align-items-center">

            <div class="toast-body">

                ${message}

            </div>

            <button type="button"
                    class="btn-close btn-close-white me-3"
                    data-bs-dismiss="toast">
            </button>

        </div>
    `;



    container.appendChild(
        toastEl
    );



    const toast =
        new bootstrap.Toast(
            toastEl,
            {
                delay: delay
            }
        );

    toast.show();



    toastEl.addEventListener(

        "hidden.bs.toast",

        () => {

            toastEl.remove();
        }
    );
}