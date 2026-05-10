let currentPage = 1;
let pageSize = 2;

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

                                <li>
                                    <button class="dropdown-item warranty-dropdown-item"
                                            type="button"
                                            onclick="window.location.href='/Admin/Warranty/Warranty_Claim_Summary/${item.id}'">

                                        <i class="bi bi-eye me-2"></i>
                                        View

                                    </button>
                                </li>

                               <li>
                                    <button class="dropdown-item warranty-dropdown-item text-success"
                                            type="button"
                                            onclick="openApproveWarrantyModal(${item.id})">

                                        <i class="bi bi-check-circle me-2"></i>
                                        Approve

                                    </button>
                                </li>
                                <li>
                                    <button class="dropdown-item warranty-dropdown-item text-danger"
                                            type="button">

                                        <i class="bi bi-x-circle me-2"></i>
                                        Reject

                                    </button>
                                </li>
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

//////// Approval of Service Warranty //////////

let selectedWarrantyId = null;

function openApproveWarrantyModal(id) {

    selectedWarrantyId = id;

    const modal =
        new bootstrap.Modal(
            document.getElementById(
                "approveWarrantyModal"
            )
        );

    modal.show();

}