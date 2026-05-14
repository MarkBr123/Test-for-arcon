document.addEventListener("DOMContentLoaded", () => {

    loadWarrantySummary();

});



async function loadWarrantySummary() {

    try {

        // =========================================
        // GET WARRANTY ID
        // =========================================

        const pathParts =
            window.location.pathname.split("/");

        const id =
            pathParts[pathParts.length - 1];

        if (!id) {

            alert(
                "Warranty ID is missing."
            );

            return;
        }



        // =========================================
        // FETCH WARRANTY SUMMARY
        // =========================================

        const response =
            await fetch(
                `/api/warranties/${id}`
            );

        if (!response.ok) {

            throw new Error(
                "Failed to load warranty summary."
            );
        }

        const data =
            await response.json();

        console.log(data);


        // =========================================
        // WARRANTY DETAILS
        // =========================================

        document.getElementById(
            "summaryWarrantyCode"
        ).textContent =
            data.warranty.warranty_code ?? "-";



        document.getElementById(
            "summaryStatus"
        ).innerHTML =
            renderStatusBadge(
                data.warranty.status
            );



        document.getElementById(
            "summaryReleaseMethod"
        ).textContent =
            data.warranty.release_method ?? "-";



        document.getElementById(
            "summaryDeliveryType"
        ).textContent =
            data.warranty.delivery_type ?? "-";



        document.getElementById(
            "summaryCourierName"
        ).textContent =
            data.warranty.courier_name ?? "-";



        document.getElementById(
            "summaryTrackingNumber"
        ).textContent =
            data.warranty.tracking_number ?? "-";



        document.getElementById(
            "summaryCreatedAt"
        ).textContent =
            formatDateTime(
                data.warranty.created_at
            );



        document.getElementById(
            "summaryApprovedAt"
        ).textContent =
            formatDateTime(
                data.warranty.approved_at
            );



        document.getElementById(
            "summaryRejectedAt"
        ).textContent =
            formatDateTime(
                data.warranty.rejected_at
            );



        document.getElementById(
            "summaryReleasedAt"
        ).textContent =
            formatDateTime(
                data.warranty.released_at
            );



        document.getElementById(
            "summaryReceivedAt"
        ).textContent =
            formatDateTime(
                data.warranty.received_by_customer_at
            );



        document.getElementById(
            "summaryCustomerNotes"
        ).textContent =
            data.warranty.customer_notes ?? "-";



        document.getElementById(
            "summaryAdminNotes"
        ).textContent =
            data.warranty.admin_notes ?? "-";



        document.getElementById(
            "summaryRejectionReason"
        ).textContent =
            data.warranty.rejection_reason ?? "-";




        // =========================================
        // CUSTOMER
        // =========================================

        if (data.customer) {

            document.getElementById(
                "summaryCustomerName"
            ).textContent =

                `${data.customer.first_name ?? ""} ` +
                `${data.customer.middle_name ?? ""} ` +
                `${data.customer.last_name ?? ""}`;



            document.getElementById(
                "summaryContactNo"
            ).textContent =
                data.customer.contact_no ?? "-";



            document.getElementById(
                "summaryEmail"
            ).textContent =
                data.customer.email ?? "-";
        }



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

