document.addEventListener("DOMContentLoaded", () => {

    loadWarrantySummary();

});



async function loadWarrantySummary() {

    try {



        // =========================================
        // GET ID FROM URL
        // =========================================

        const pathParts =
            window.location.pathname.split("/");

        const id =
            pathParts[pathParts.length - 1];

        if (!id) {

            alert("Warranty ID is missing.");

            return;

        }



        // =========================================
        // FETCH SUMMARY
        // =========================================

        const response =
            await fetch(`/api/warranties/${id}`);

        if (!response.ok) {

            throw new Error(
                "Failed to load warranty summary."
            );

        }

        const data = await response.json();

        const bookingDetailsLink =
            document.getElementById(
                "bookingDetailsLink"
            );

        if (bookingDetailsLink) {

            bookingDetailsLink.href =
                `/Admin/Services/SBooking_Summary/${data.service_booking.id}`;

        }



        // =========================================
        // WARRANTY DETAILS
        // =========================================

        setText(
            "summarySwbCode",
            data.warranty_booking.swb_code
        );

        setHtml(
            "summaryStatus",
            renderStatusBadge(
                data.warranty_booking.status
            )
        );

        setText(
            "summaryPreferredDate",
            formatDate(
                data.warranty_booking.preferred_date
            )
        );

        setText(
            "summaryPreferredTime",
            formatTime(
                data.warranty_booking.preferred_time
            )
        );

        setText(
            "summaryComplaint",
            data.warranty_booking.complaint
        );

        setText(
            "summaryDiagnosisNotes",
            data.warranty_booking.diagnosis_notes
        );

        setText(
            "summaryTechnicianNotes",
            data.warranty_booking.technician_notes
        );

        setHtml(
            "summaryRepeatIssue",

            data.warranty_booking.is_repeat_issue

                ? `
                    <span class="badge bg-danger">
                        Yes
                    </span>
                `

                : `
                    <span class="badge bg-success">
                        No
                    </span>
                `
        );

        setText(
            "summaryCreatedAt",
            formatDateTime(
                data.warranty_booking.created_at
            )
        );



        // =========================================
        // CUSTOMER & BOOKING
        // =========================================

        setText(
            "summaryBookingRef",
            data.service_booking.booking_ref_code
        );

        setHtml(
            "summaryBookingStatus",
            renderStatusBadge(
                data.service_booking.status
            )
        );

        setText(
            "summaryCustomerName",

            `${data.customer.first_name ?? ""} ` +
            `${data.customer.middle_name ?? ""} ` +
            `${data.customer.last_name ?? ""}`
        );

        setText(
            "summaryContactNo",
            data.customer.contact_no
        );

        setText(
            "summaryEmail",
            data.customer.email
        );

        setText(
            "summaryPaidAt",
            formatDateTime(
                data.service_booking.paid_at
            )
        );

        setText(
            "summaryBookingCreatedAt",
            formatDateTime(
                data.service_booking.created_at
            )
        );

        setText(
            "summaryCustomerNote",
            data.service_booking.customer_note
        );






        // =========================================
        // MEDIA
        // =========================================

        renderWarrantyMedia(
            data.attachments
        );

    }
    catch (error) {

        console.error(error);

        alert(
            "Failed to load warranty summary."
        );

    }

}



function renderWarrantyMedia(attachments) {

    const container =
        document.getElementById(
            "warrantyMediaContainer"
        );

    if (!container)
        return;

    container.innerHTML = "";



    // =========================================
    // EMPTY
    // =========================================

    if (!attachments ||
        attachments.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted py-5 w-100">

                <i class="bi bi-images fs-1 d-block mb-3"></i>

                No attachments uploaded.

            </div>
        `;

        return;
    }



    // =========================================
    // RENDER MEDIA
    // =========================================

    attachments.forEach(item => {

        const isImage =
            item.file_path?.match(
                /\.(jpg|jpeg|png|gif|webp)$/i
            );

        const isVideo =
            item.file_path?.match(
                /\.(mp4|webm|ogg|mov)$/i
            );



        container.innerHTML += `

            <div>

                <div class="card media-card shadow-sm border-0">

                    <div class="media-preview-wrapper">

                        ${isImage

                ? `
                                    <img src="${item.file_path}"
                                         class="media-preview-image"
                                         onclick="
                                            openMediaPreview(
                                                '${item.file_path}'
                                            )
                                         ">
                                `

                : isVideo

                    ? `
                                        <video controls
                                               class="media-preview-video">

                                            <source src="${item.file_path}">

                                        </video>
                                    `

                    : `
                                        <div class="media-placeholder">

                                            <div class="text-center text-muted">

                                                <i class="bi bi-file-earmark fs-1"></i>

                                                <div class="small mt-2">
                                                    Preview not available
                                                </div>

                                            </div>

                                        </div>
                                    `
            }

                    </div>

                    <div class="card-body py-2 px-3">

                        <div class="small text-muted text-truncate">

                            ${item.file_name ?? "-"}

                        </div>

                    </div>

                </div>

            </div>
        `;

    });

}

function openMediaPreview(src) {

    const modal =
        new bootstrap.Modal(
            document.getElementById(
                "mediaPreviewModal"
            )
        );

    document.getElementById(
        "mediaPreviewImage"
    ).src = src;

    modal.show();

}



function renderStatusBadge(status) {

    switch (status) {

        case "PENDING_REVIEW":

            return `
                <span class="badge bg-warning text-dark">
                    Pending Review
                </span>
            `;

        case "APPROVED":

            return `
                <span class="badge bg-primary">
                    Approved
                </span>
            `;

        case "REJECTED":

            return `
                <span class="badge bg-danger">
                    Rejected
                </span>
            `;

        case "RESOLVED":

            return `
                <span class="badge bg-success">
                    Resolved
                </span>
            `;

        default:

            return `
                <span class="badge bg-secondary">
                    ${status ?? "-"}
                </span>
            `;
    }

}



function setText(id, value) {

    const el =
        document.getElementById(id);

    if (!el)
        return;

    el.textContent =
        value ?? "-";

}



function setHtml(id, value) {

    const el =
        document.getElementById(id);

    if (!el)
        return;

    el.innerHTML =
        value ?? "-";

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


const bookingDetailsLink =
    document.getElementById(
        "bookingDetailsLink"
    );

if (bookingDetailsLink) {

    bookingDetailsLink.href =
        `/Admin/Services/SBooking_Summary/${data.service_booking.id}`;

}