let currentPage = 1;
let pageSize = 15;

let currentSearch = "";

let currentSortBy = "created_at";
let currentSortDirection = "desc";

let debounceTimer = null;

document.addEventListener("DOMContentLoaded", () => {

    loadServiceWarrantyBookings();

});

async function loadServiceWarrantyBookings(page = 1) {

    currentPage = page;

    try {

        const response = await fetch(

            `/api/warranties?page=${currentPage}` +
            `&pageSize=${pageSize}` +
            `&search=${encodeURIComponent(currentSearch)}` +
            `&sortBy=${currentSortBy}` +
            `&sortDirection=${currentSortDirection}`

        );

        if (!response.ok) {
            throw new Error("Failed to load warranty bookings.");
        }

        const data = await response.json();

        renderServiceWarrantyBookingsTable(data.items);

        renderPagination(
            data.page,
            data.totalPages
        );

        renderCountInfo(
            data.totalCount,
            data.page,
            data.pageSize
        );

    }
    catch (error) {

        console.error(error);

    }
}

function renderServiceWarrantyBookingsTable(items) {

    const tbody = document.getElementById(
        "serviceWarrantyBookingsTableBody"
    );

    tbody.innerHTML = "";

    if (!items || items.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="10" class="text-center text-muted py-4">
                    No warranty bookings found.
                </td>
            </tr>
        `;
        return;
    }

    items.forEach(item => {

        tbody.innerHTML += `
            <tr>

                <td>
                    ${item.swb_code ?? "-"}
                </td>

                <td>
                    ${item.booking_ref_code ?? "-"}
                </td>

                <td>
                    ${item.first_name ?? "-"}
                </td>

                <td>
                    ${item.last_name ?? "-"}
                </td>
                <td class="text-truncate"
                    style="max-width: 250px;"
                    title="${item.complaint ?? "-"}">
                    ${item.complaint ?? "-"}
                </td>
                <td>
                    ${formatDate(item.preferred_date)}
                </td>

                <td>
                    ${formatTime(item.preferred_time)}
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
                                        onclick="window.location.href='/Admin/Warranty/Warranty_Claim_Summary/${item.id}'">

                                    <i class="bi bi-eye me-2"></i>
                                    View

                                </button>

                            </li>



                            ${item.status === "PENDING_REVIEW"

                                ? `

                                <!-- APPROVE -->

                                <li>

                                    <button class="dropdown-item warranty-dropdown-item text-success"
                                            type="button"
                                            onclick="openApproveWarrantyModal(${item.id})">

                                        <i class="bi bi-check-circle me-2"></i>
                                        Approve

                                    </button>

                                </li>



                                <!-- REJECT -->

                                <li>

                                    <button class="dropdown-item warranty-dropdown-item text-danger"
                                            type="button"
                                            onclick="openRejectWarrantyModal(${item.id})">

                                        <i class="bi bi-x-circle me-2"></i>
                                        Reject

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

function searchServiceWarrantyBookings() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {

        currentSearch = document
            .getElementById("serviceWarrantyBookingSearchInput")
            .value
            .trim();

        loadServiceWarrantyBookings(1);
    }, 400);
}

function sortServiceWarrantyBookings(sortBy) {

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
    loadServiceWarrantyBookings(1);
}

function renderPagination(current, totalPages) {

    const pagination = document.getElementById("pagination");

    pagination.innerHTML = "";

    if (totalPages <= 1)
        return;
    for (let i = 1; i <= totalPages; i++) {

        pagination.innerHTML += `
            <li class="page-item ${i === current ? "active" : ""}">

                <button class="page-link"
                        onclick="loadServiceWarrantyBookings(${i})">

                    ${i}

                </button>

            </li>
        `;
    }
}

function renderCountInfo(totalCount, page, pageSize) {

    const info = document.getElementById("swbCountInfo");
    const start = ((page - 1) * pageSize) + 1;
    const end = Math.min(page * pageSize, totalCount);

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

function formatDate(dateString) {

    if (!dateString)
        return "-";

    return new Date(dateString)
        .toLocaleDateString();
}

function formatDateTime(dateString) {

    if (!dateString)
        return "-";

    return new Date(dateString)
        .toLocaleString();

}

function formatTime(timeString) {

    if (!timeString)
        return "-";

    return new Date(`1970-01-01T${timeString}`)
        .toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });
}








//////////////////////////////////////////////////////////////////    Approval of Service Warranty    //////////////////////////////////////////////////////////////////////////////////

let selectedWarrantyId = null;

async function openApproveWarrantyModal(id) {

    selectedWarrantyId = id;

    try {

        const response =
            await fetch(
                `/api/warranties/${id}`
            );

        if (!response.ok) {

            throw new Error(
                "Failed to load warranty details."
            );

        }

        const data =
            await response.json();


        document.getElementById(
            "approveBookingRef"
        ).innerText =
            data.service_booking.booking_ref_code ?? "-";


        document.getElementById(
            "approveBookingStatus"
        ).innerText =
            data.service_booking.status ?? "-";


        document.getElementById(
            "approveCustomerName"
        ).innerText =
            `${data.customer.first_name ?? ""} ${data.customer.last_name ?? ""}`;


        document.getElementById(
            "approveCustomerContact"
        ).innerText =
            data.customer.contact_no ?? "-";


        document.getElementById(
            "approvePaidAt"
        ).innerText =
            data.service_booking.paid_at ?? "-";


        document.getElementById(
            "approveBookingCreated"
        ).innerText =
            data.service_booking.created_at ?? "-";



        // =====================================
        // WARRANTY
        // =====================================

        document.getElementById(
            "approveWarrantyCode"
        ).innerText =
            data.warranty_booking.swb_code ?? "-";


        document.getElementById(
            "approveWarrantyStatus"
        ).innerText =
            data.warranty_booking.status ?? "-";


        document.getElementById(
            "approvePreferredDate"
        ).innerText =
            data.warranty_booking.preferred_date ?? "-";


        document.getElementById(
            "approvePreferredTime"
        ).innerText =
            data.warranty_booking.preferred_time ?? "-";


        document.getElementById(
            "approveWarrantyCreated"
        ).innerText =
            data.warranty_booking.created_at ?? "-";


        document.getElementById(
            "approveComplaint"
        ).innerText =
            data.warranty_booking.complaint ?? "-";



        // =====================================
        // OPEN MODAL
        // =====================================

        const modal =
            new bootstrap.Modal(
                document.getElementById(
                    "approveWarrantyModal"
                )
            );

        modal.show();

    }
    catch (error) {

        console.error(error);

        alert(
            "Failed to load warranty details."
        );

    }
}


function openApproveConfirmationModal() {

    // =====================================
    // GET VALUES
    // =====================================

    const technicians =
        document.getElementById(
            "approveTechnicians"
        ).value;

    const difficulty =
        document.getElementById(
            "approveDifficulty"
        ).value;

    const schedDate =
        document.getElementById(
            "approveSchedDate"
        ).value;

    const schedTime =
        document.getElementById(
            "approveSchedTime"
        ).value;

    const estDate =
        document.getElementById(
            "approveEstDate"
        ).value;

    const estTime =
        document.getElementById(
            "approveEstTime"
        ).value;

    const diagnosis =
        document.getElementById(
            "approveDiagnosisNotes"
        ).value;

    const repeatIssue =
        document.getElementById(
            "approveRepeatIssue"
        ).value;



    // =====================================
    // VALIDATION
    // =====================================

    if (!technicians ||
        Number(technicians) <= 0) {
        alert(
            "Number of technicians is required."
        );

        return;
    }

    if (!difficulty ||
        Number(difficulty) <= 0) {
        alert(
            "Difficulty rate is required."
        );

        return;
    }

    if (!schedDate) {

        alert(
            "Scheduled date is required."
        );

        return;
    }

    if (!schedTime) {

        alert(
            "Scheduled time is required."
        );

        return;
    }

    if (!estDate) {

        alert(
            "Estimated completion date is required."
        );

        return;
    }

    if (!estTime) {

        alert(
            "Estimated completion time is required."
        );

        return;
    }

    if (!diagnosis ||
        diagnosis.trim().length < 5) {
        alert(
            "Diagnosis notes must contain at least 5 characters."
        );

        return;
    }

    if (!repeatIssue) {

        alert(
            "Please specify if this is a repeat issue."
        );

        return;
    }



    // =====================================
    // OPEN CONFIRM MODAL
    // =====================================

    const confirmModal =
        new bootstrap.Modal(
            document.getElementById(
                "approveWarrantyConfirmModal"
            )
        );

    confirmModal.show();

    startApproveCountdown();

}


async function submitApproveWarranty() {

    try {

        // =====================================
        // BUILD DTO
        // =====================================

        const dto = {

            DiagnosisNotes:
                document.getElementById(
                    "approveDiagnosisNotes"
                ).value,

            TechnicianNotes:
                document.getElementById(
                    "approveTechnicianNotes"
                ).value,

            IsRepeatIssue:
                document.getElementById(
                    "approveRepeatIssue"
                ).value === "true",

            NoTechniciansReq:
                Number(
                    document.getElementById(
                        "approveTechnicians"
                    ).value
                ),

            DifficultyRate:
                parseFloat(
                    document.getElementById(
                        "approveDifficulty"
                    ).value
                ),

            ActualSchedDate:
                document.getElementById(
                    "approveSchedDate"
                ).value,

            ActualSchedTime:
                document.getElementById(
                    "approveSchedTime"
                ).value + ":00",

            EstimatedCompletionDate:
                document.getElementById(
                    "approveEstDate"
                ).value,

            EstimatedCompletionTime:
                document.getElementById(
                    "approveEstTime"
                ).value + ":00",

            ReserviceFee:
                parseFloat(
                    document.getElementById(
                        "approveFee"
                    )?.value || 0
                ),

            PartsNeeded:
                document.getElementById(
                    "approveParts"
                )?.value,

            ToolsNeeded:
                document.getElementById(
                    "approveTools"
                )?.value,

            NotesToTechnician:
                document.getElementById(
                    "approveNotesToTech"
                )?.value
        };



        // =====================================
        // SUBMIT
        // =====================================

        const response =
            await fetch(

                `${window.location.origin}/api/warranties/${selectedWarrantyId}/approve`,

                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(dto)
                }
            );



        // =====================================
        // HANDLE ERROR
        // =====================================

        if (!response.ok) {

            const err =
                await response.json();

            alert(
                err.message ||
                "Approval failed."
            );

            return;
        }



        // =====================================
        // SUCCESS
        // =====================================

        const result =
            await response.json();

        alert(
            "Warranty approved successfully."
        );

        showToast(
            "Warranty approved successfully.",
            "success"
        );

        location.reload();

    }
    catch (error) {

        console.error(error);

        alert(
            "An unexpected error occurred."
        );

    }
}










function startApproveCountdown() {

    let seconds = 5;

    const countdown =
        document.getElementById(
            "approveCountdown"
        );

    const approveBtn =
        document.getElementById(
            "approveSubmitBtn"
        );

    const cancelBtn =
        document.getElementById(
            "approveCancelBtn"
        );

    approveBtn.disabled = true;
    cancelBtn.disabled = true;

    countdown.innerText = seconds;

    const interval = setInterval(() => {

        seconds--;

        countdown.innerText = seconds;

        if (seconds <= 0) {

            clearInterval(interval);

            approveBtn.disabled = false;
            cancelBtn.disabled = false;

            countdown.innerText = "0";
        }

    }, 1000);

}


/////////////////////////////////////////////////             REJECT WARRANTY               /////////////////////////////////////////////////////////

let currentRejectWarrantyId = null;

let rejectInterval = null;



// =====================================
// OPEN FIRST MODAL
// =====================================

function openRejectWarrantyModal(id) {

    currentRejectWarrantyId = id;

    document.getElementById(
        "rejectReason"
    ).value = "";

    const modal =
        new bootstrap.Modal(
            document.getElementById(
                "rejectWarrantyModal"
            )
        );

    modal.show();
}



// =====================================
// NEXT BUTTON
// =====================================

document.getElementById(
    "proceedRejectBtn"
).addEventListener("click", () => {

    const reason =
        document.getElementById(
            "rejectReason"
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
                "rejectWarrantyModal"
            )
        );

    modal1.hide();

    // OPEN FINAL CONFIRM

    showFinalRejectModal(reason);
});



// =====================================
// FINAL CONFIRM
// =====================================

function showFinalRejectModal(reason) {

    let seconds = 5;

    const total = 5;

    const text =
        document.getElementById(
            "rejectCountdownText"
        );

    const bar =
        document.getElementById(
            "rejectCountdownBar"
        );

    const btn =
        document.getElementById(
            "confirmRejectBtn"
        );

    const modalEl =
        document.getElementById(
            "finalRejectModal"
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

    if (rejectInterval) {
        clearInterval(rejectInterval);
    }



    // START COUNTDOWN

    rejectInterval = setInterval(() => {

        seconds--;

        text.innerText = seconds;

        bar.style.width =
            (
                ((total - seconds) / total) * 100
            ) + "%";

        if (seconds <= 0) {
            clearInterval(rejectInterval);

            btn.disabled = false;
        }

    }, 1000);



    // CONFIRM

    btn.onclick = () => {

        modal.hide();

        submitRejectWarranty(reason);
    };



    // RESET WHEN CLOSED

    modalEl.addEventListener(

        "hidden.bs.modal",

        () => {

            clearInterval(rejectInterval);

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

async function submitRejectWarranty(reason) {

    try {

        const res =
            await fetch(

                `/api/warranties/${currentRejectWarrantyId}/reject`,

                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            rejection_reason: reason
                        })
                }
            );



        // SUCCESS

        if (res.ok) {
            const data =
                await res.json();

            showToast(
                data.message ||
                "Warranty claim rejected successfully.",
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
            "Error rejecting warranty claim.",
            "danger"
        );
    }
}








// =====================================
// GLOBAL TOAST FUNCTION
// =====================================

function showToast(
    message,
    type = "success",
    delay = 6000
) {

    let container =
        document.getElementById(
            "toastContainer"
        );



    // AUTO CREATE CONTAINER

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



    // BACKGROUND CLASS

    const bgClass = {

        success:
            "bg-success text-white",

        danger:
            "bg-danger text-white",

        warning:
            "bg-warning text-dark",

        info:
            "bg-info text-dark"

    }[type] || "bg-secondary text-white";



    // ICONS

    const icon = {

        success:
            `<i class="bi bi-check-circle-fill me-2"></i>`,

        danger:
            `<i class="bi bi-x-circle-fill me-2"></i>`,

        warning:
            `<i class="bi bi-exclamation-triangle-fill me-2"></i>`,

        info:
            `<i class="bi bi-info-circle-fill me-2"></i>`

    }[type] || "";



    // CREATE TOAST

    const toastEl =
        document.createElement("div");

    toastEl.className =
        `toast fade show align-items-center border-0 ${bgClass}`;

    toastEl.role =
        "alert";

    toastEl.setAttribute(
        "aria-live",
        "assertive"
    );

    toastEl.setAttribute(
        "aria-atomic",
        "true"
    );



    toastEl.innerHTML = `

        <div class="d-flex align-items-center">

            <div class="toast-body">

                ${icon}
                ${message}

            </div>

            <button type="button"
                    class="btn-close btn-close-white me-2 m-auto"
                    data-bs-dismiss="toast"
                    aria-label="Close">
            </button>

        </div>
    `;



    // APPEND

    container.appendChild(
        toastEl
    );



    // INIT TOAST

    const toast =
        new bootstrap.Toast(
            toastEl,
            {
                delay: delay
            }
        );

    toast.show();



    // REMOVE AFTER HIDDEN

    toastEl.addEventListener(

        "hidden.bs.toast",

        () => {

            toastEl.remove();
        }
    );
}