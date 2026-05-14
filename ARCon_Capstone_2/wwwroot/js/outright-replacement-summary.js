document.addEventListener("DOMContentLoaded", () => {

    loadOutrightReplacementSummary();

});



async function loadOutrightReplacementSummary() {

    try {

        // =========================================
        // GET ID FROM URL
        // =========================================

        const pathParts =
            window.location.pathname.split("/");

        const id =
            pathParts[pathParts.length - 1];

        if (!id) {

            alert(
                "Outright replacement ID is missing."
            );

            return;
        }



        // =========================================
        // FETCH SUMMARY
        // =========================================

        const response =
            await fetch(
                `/api/outright-replacements/summary/${id}`
            );

        if (!response.ok) {

            throw new Error(
                "Failed to load outright replacement summary."
            );
        }

        const data =
            await response.json();

        console.log(data);



        // =========================================
        // TRANSACTION DETAILS LINK
        // =========================================

        const transactionDetailsLink =
            document.getElementById(
                "transactionDetailsLink"
            );

        if (
            transactionDetailsLink &&
            data.customer_transaction?.id
        ) {

            transactionDetailsLink.href =
                `/Admin/Transaction/Customer_Transaction_Summary/${data.customer_transaction.id}`;
        }



        // =========================================
        // REPLACEMENT DETAILS
        // =========================================

        document.getElementById(
            "summaryWarrantyCode"
        ).textContent =
            data.warranty?.warranty_code ?? "-";



        document.getElementById(
            "summaryStatus"
        ).innerHTML =
            renderStatusBadge(
                data.warranty?.status
            );



        document.getElementById(
            "summaryReleaseMethod"
        ).textContent =
            data.warranty?.release_method ?? "-";



        document.getElementById(
            "summaryDeliveryType"
        ).textContent =
            data.warranty?.delivery_type ?? "-";



        document.getElementById(
            "summaryCourierName"
        ).textContent =
            data.warranty?.courier_name ?? "-";



        document.getElementById(
            "summaryTrackingNumber"
        ).textContent =
            data.warranty?.tracking_number ?? "-";



        document.getElementById(
            "summaryCreatedAt"
        ).textContent =
            formatDateTime(
                data.warranty?.created_at
            );



        document.getElementById(
            "summaryApprovedAt"
        ).textContent =
            formatDateTime(
                data.warranty?.approved_at
            );



        document.getElementById(
            "summaryRejectedAt"
        ).textContent =
            formatDateTime(
                data.warranty?.rejected_at
            );



        document.getElementById(
            "summaryReleasedAt"
        ).textContent =
            formatDateTime(
                data.warranty?.released_at
            );



        document.getElementById(
            "summaryReceivedAt"
        ).textContent =
            formatDateTime(
                data.warranty?.received_by_customer_at
            );



        document.getElementById(
            "summaryCustomerNotes"
        ).textContent =
            data.warranty?.customer_notes ?? "-";



        document.getElementById(
            "summaryAdminNotes"
        ).textContent =
            data.warranty?.admin_notes ?? "-";



        document.getElementById(
            "summaryRejectionReason"
        ).textContent =
            data.warranty?.rejection_reason ?? "-";



        // =========================================
        // CUSTOMER & TRANSACTION
        // =========================================

        document.getElementById(
            "summaryTransactionCode"
        ).textContent =
            data.customer_transaction
                ?.transaction_code ?? "-";



        document.getElementById(
            "summaryCustomerName"
        ).textContent =

            `${data.customer?.first_name ?? ""} ` +
            `${data.customer?.middle_name ?? ""} ` +
            `${data.customer?.last_name ?? ""}`;



        document.getElementById(
            "summaryCustomerEmail"
        ).textContent =
            data.customer?.email ?? "-";



        document.getElementById(
            "summaryContactNo"
        ).textContent =
            data.customer?.contact_no ?? "-";



        document.getElementById(
            "summaryDeliveryStatus"
        ).innerHTML =
            renderStatusBadge(
                data.delivery?.status
            );



        document.getElementById(
            "summaryDeliveryCode"
        ).textContent =
            data.delivery?.delivery_ref_code ?? "-";



        document.getElementById(
            "summaryCourier"
        ).textContent =
            data.delivery?.courier ?? "-";



        document.getElementById(
            "summaryDeliveredAt"
        ).textContent =
            formatDateTime(
                data.delivery?.delivered_at
            );



        document.getElementById(
            "summaryShippingMethod"
        ).textContent =
            data.customer_transaction
                ?.shipping_method ?? "-";



        document.getElementById(
            "summaryPaymentMethod"
        ).textContent =
            data.customer_transaction
                ?.payment_method ?? "-";



        document.getElementById(
            "summaryPaymentStatus"
        ).textContent =
            data.payment
                ?.paymentStatus ?? "-";



        document.getElementById(
            "summaryGrandTotal"
        ).textContent =
            formatCurrency(
                data.customer_transaction
                    ?.grand_total
            );



        document.getElementById(
            "summaryDeliveryAddress"
        ).textContent =
            data.delivery_address ?? "-";



        // =========================================
        // DEFECTIVE ITEMS
        // =========================================

        renderReplacementItems(
            data.items
        );

        // =========================================
        // REPLACEMENT UNITS
        // =========================================

        renderReplacementUnits(
            data.replacement_units
        );



        // =========================================
        // MEDIA
        // =========================================

        renderReplacementMedia(
            data.attachments
        );

    }
    catch (error) {

        console.error(error);

        alert(
            "Failed to load outright replacement summary."
        );
    }
}

// =========================================
// RENDER REPLACEMENT UNITS
// =========================================

function renderReplacementUnits(units) {

    const tbody =
        document.getElementById(
            "replacementUnitsTableBody"
        );

    if (!tbody)
        return;



    // EMPTY

    tbody.innerHTML = "";



    // NO DATA

    if (!units || units.length === 0) {

        tbody.innerHTML = `

            <tr>

                <td colspan="4"
                    class="text-center text-muted py-4">

                    No replacement units assigned.

                </td>

            </tr>
        `;

        return;
    }



    // RENDER

    units.forEach(item => {

        tbody.innerHTML += `

            <tr>

                <td>

                    <div class="fw-semibold">

                        ${item.product_name ?? "-"}

                    </div>

                    <div class="small text-muted">

                        ${item.sku ?? "-"}

                    </div>

                </td>



                <td>

                    ${item.replacement_serial_number ?? "-"}

                </td>



                <td>

                    ${item.defective_serial_number ?? "-"}

                </td>



                <td>

                    ${renderStatusBadge(
            item.replacement_status
        )}

                </td>

            </tr>
        `;
    });
}



function renderReplacementItems(items) {

    const tbody =
        document.getElementById(
            "replacementItemsTableBody"
        );

    if (!tbody)
        return;

    tbody.innerHTML = "";



    // =========================================
    // EMPTY
    // =========================================

    if (!items ||
        items.length === 0) {

        tbody.innerHTML = `
            <tr>

                <td colspan="3"
                    class="text-center text-muted py-4">

                    No product product of concern found.

                </td>

            </tr>
        `;

        return;
    }



    // =========================================
    // RENDER ITEMS
    // =========================================

    items.forEach(item => {

        tbody.innerHTML += `

            <tr>

                <td>

                    <div class="fw-semibold">

                        ${item.product_name ?? "-"}

                    </div>

                    <div class="small text-muted">

                        SKU:
                        ${item.sku ?? "-"}

                    </div>

                </td>

                <td>

                    ${item.serial_number ?? "-"}

                </td>

                <td class="text-truncate"
                    style="max-width: 350px;"
                    title="${item.complaint ?? "-"}">

                    ${item.complaint ?? "-"}

                </td>

            </tr>

        `;
    });

}



function renderReplacementMedia(attachments) {

    const container =
        document.getElementById(
            "replacementMediaContainer"
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



function formatDateTime(dateString) {

    if (!dateString)
        return "-";

    return new Date(dateString)
        .toLocaleString();

}


function formatCurrency(value) {

    if (value == null)
        return "-";

    return new Intl.NumberFormat(
        "en-PH",
        {
            style: "currency",
            currency: "PHP"
        }
    ).format(value);
}