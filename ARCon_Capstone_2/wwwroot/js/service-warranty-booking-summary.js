document.addEventListener("DOMContentLoaded", () => {

    loadWarrantySummary();

});



async function loadWarrantySummary() {

    try {

        const warrantyId = window.warrantyBookingId;

        showWarrantyLoading();

        const response = await fetch(`/api/warranties/${warrantyId}`);

        if (!response.ok) {
            throw new Error("Failed to load warranty summary.");
        }

        const data = await response.json();

        console.log("Warranty Summary:", data);

        populateWarrantySummary(data);

    }
    catch (err) {

        console.error(err);

        showToast("error", err.message || "Something went wrong.");

    }
    finally {

        hideWarrantyLoading();

    }

}



function populateWarrantySummary(data) {

    const warranty = data.warranty_booking;
    const customer = data.customer;
    const booking = data.service_booking;
    const attachments = data.attachments || [];



    // =========================================================
    // WARRANTY DETAILS
    // =========================================================

    setText("summarySwbCode", warranty.swb_code);

    setStatusBadge(
        "summaryStatus",
        warranty.status
    );

    setText(
        "summaryPreferredDate",
        formatDate(warranty.preferred_date)
    );

    setText(
        "summaryPreferredTime",
        formatTime(warranty.preferred_time)
    );

    setText(
        "summaryComplaint",
        warranty.complaint || "-"
    );



    // =========================================================
    // CUSTOMER & BOOKING
    // =========================================================

    setText(
        "summaryBookingRef",
        booking.booking_ref_code
    );

    setStatusBadge(
        "summaryBookingStatus",
        booking.status
    );

    const fullName = [
        customer.first_name,
        customer.middle_name,
        customer.last_name
    ]
        .filter(Boolean)
        .join(" ");

    setText(
        "summaryCustomerName",
        fullName
    );

    setText(
        "summaryContactNo",
        customer.contact_no || "-"
    );

    setText(
        "summaryCustomerNote",
        booking.customer_note || "-"
    );



    // =========================================================
    // BOOKING DETAILS LINK
    // =========================================================

    const bookingLink = document.getElementById("bookingDetailsLink");

    if (bookingLink) {

        bookingLink.href =
            `/Admin/ServiceBookings/Details/${booking.id}`;

    }



    // =========================================================
    // MEDIA
    // =========================================================

    renderWarrantyMedia(attachments);

}



function renderWarrantyMedia(attachments) {

    const container = document.getElementById("warrantyMediaContainer");

    if (!container) return;

    container.innerHTML = "";



    if (attachments.length === 0) {

        container.innerHTML = `
            <div class="empty-media-state">

                <i class="bi bi-images"></i>

                <div class="mt-3">
                    No uploaded media found.
                </div>

            </div>
        `;

        return;

    }



    attachments.forEach(file => {

        const card = document.createElement("div");

        card.className = "media-card";

        card.innerHTML = `
            <img src="${file.file_path}"
                 alt="${file.file_name}"
                 class="media-image">

            <div class="media-overlay">

                <button class="btn btn-light btn-sm preview-btn">

                    <i class="bi bi-zoom-in me-1"></i>
                    Preview

                </button>

            </div>
        `;

        card.querySelector(".preview-btn")
            .addEventListener("click", () => {

                openMediaPreview(file.file_path);

            });

        container.appendChild(card);

    });

}



function openMediaPreview(imagePath) {

    const image = document.getElementById("mediaPreviewImage");

    image.src = imagePath;

    const modal = new bootstrap.Modal(
        document.getElementById("mediaPreviewModal")
    );

    modal.show();

}



function setText(id, value) {

    const el = document.getElementById(id);

    if (!el) return;

    el.textContent = value || "-";

}



function setStatusBadge(id, status) {

    const el = document.getElementById(id);

    if (!el) return;

    const badgeClass = getStatusBadgeClass(status);

    el.innerHTML = `
        <span class="badge ${badgeClass}">
            ${formatStatus(status)}
        </span>
    `;

}



function getStatusBadgeClass(status) {

    switch ((status || "").toUpperCase()) {

        case "PENDING":
            return "bg-warning text-dark";

        case "APPROVED":
            return "bg-primary";

        case "INSPECTING":
            return "bg-info text-dark";

        case "RESOLVED":
            return "bg-success";

        case "REJECTED":
            return "bg-danger";

        case "CANCELLED":
            return "bg-secondary";

        default:
            return "bg-dark";
    }

}



function formatStatus(status) {

    if (!status) return "-";

    return status
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, l => l.toUpperCase());

}



function formatDate(dateString) {

    if (!dateString) return "-";

    return new Date(dateString)
        .toLocaleDateString("en-PH", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });

}



function formatTime(timeString) {

    if (!timeString) return "-";

    const [hour, minute] = timeString.split(":");

    const date = new Date();

    date.setHours(hour);
    date.setMinutes(minute);

    return date.toLocaleTimeString("en-PH", {
        hour: "numeric",
        minute: "2-digit"
    });

}



function showWarrantyLoading() {

    console.log("Loading warranty summary...");

}



function hideWarrantyLoading() {

    console.log("Warranty summary loaded.");

}