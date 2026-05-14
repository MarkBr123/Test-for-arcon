// =====================================
// GLOBALS
// =====================================

let supplierReturnPage = 1;

let supplierReturnSearch = "";

let supplierReturnSortBy =
    "created_at";

let supplierReturnSortOrder =
    "desc";



// =====================================
// INIT
// =====================================

document.addEventListener(
    "DOMContentLoaded",

    () => {

        loadSupplierReturns();
    }
);



// =====================================
// LOAD
// =====================================

async function loadSupplierReturns() {

    try {

        const response =
            await fetch(

                `/api/supplier-returns?` +

                `page=${supplierReturnPage}` +

                `&pageSize=24` +

                `&search=${encodeURIComponent(
                    supplierReturnSearch
                )}` +

                `&sortBy=${supplierReturnSortBy}` +

                `&sortOrder=${supplierReturnSortOrder}`
            );



        const data =
            await response.json();



        renderSupplierReturnsTable(
            data.items || []
        );

        renderPagination(
            data.currentPage,
            data.totalPages
        );



        document.getElementById(
            "supplierReturnCountInfo"
        ).innerHTML = `

            Showing
            ${data.items.length}
            of
            ${data.totalCount}
            supplier returns
        `;
    }
    catch (err) {

        console.error(err);

        alert(
            "Failed to load supplier returns."
        );
    }
}



// =====================================
// RENDER TABLE
// =====================================

function renderSupplierReturnsTable(
    items
) {

    const tbody =
        document.getElementById(
            "supplierReturnsTableBody"
        );

    tbody.innerHTML = "";



    // EMPTY

    if (!items || items.length === 0) {

        tbody.innerHTML = `

            <tr>

                <td colspan="12"
                    class="text-center text-muted py-4">

                    No supplier returns found.

                </td>

            </tr>
        `;

        return;
    }



    // ROWS

    items.forEach(item => {

        let actions = `

            <button class="dropdown-item"
                    onclick="downloadReturnOrderPdf(${item.id})">

                <i class="bi bi-file-earmark-pdf me-2"></i>

                Download PDF

            </button>
        `;



        if (item.status === "DRAFT") {

            actions += `

                <button class="dropdown-item text-primary"
                        onclick="markReturnAsSent(${item.id})">

                    <i class="bi bi-send me-2"></i>

                    Mark as SENT

                </button>
            `;
        }



        tbody.innerHTML += `

            <tr>

                <td>

                    ${item.return_number}

                </td>



                <td>

                    ${item.supplier_name}

                </td>



                <td>

                    ${item.return_method || "-"}

                </td>



                <td>

                    ${renderStatusBadge(
            item.status
        )}

                </td>



                <td>

                    ${item.courier_name || "-"}

                </td>



                <td>

                    ${item.pickup_date

                ? formatDate(
                    item.pickup_date
                )

                : "-"
            }

                </td>



                <td>

                    ${item.shipped_date

                ? formatDate(
                    item.shipped_date
                )

                : "-"
            }

                </td>



                <td>

                    ₱${formatPrice(
                item.shipping_cost || 0
            )}

                </td>



                <td class="text-center">

                    ${item.total_items || 0}

                </td>



                <td>

                    ₱${formatPrice(
                item.total_amount || 0
            )}

                </td>



                <td>

                    ${formatDate(
                item.created_at
            )}

                </td>



                <td class="text-center">

                    <div class="dropdown">

                        <button class="btn btn-sm btn-light border"
                                data-bs-toggle="dropdown">

                            <i class="bi bi-three-dots"></i>

                        </button>



                        <ul class="dropdown-menu dropdown-menu-end">

                            ${actions}

                        </ul>

                    </div>

                </td>

            </tr>
        `;
    });
}



// =====================================
// SEARCH
// =====================================

const searchSupplierReturns =
    debounce(() => {

        supplierReturnSearch =
            document.getElementById(
                "supplierReturnSearchInput"
            ).value;

        supplierReturnPage = 1;

        loadSupplierReturns();

    }, 400);



// =====================================
// SORT
// =====================================

function sortSupplierReturns(
    sortBy
) {

    if (
        supplierReturnSortBy === sortBy
    ) {

        supplierReturnSortOrder =

            supplierReturnSortOrder === "asc"

                ? "desc"

                : "asc";
    }
    else {

        supplierReturnSortBy =
            sortBy;

        supplierReturnSortOrder =
            "asc";
    }

    loadSupplierReturns();
}



// =====================================
// PAGINATION
// =====================================

function renderPagination(
    currentPage,
    totalPages
) {

    const pagination =
        document.getElementById(
            "supplierReturnsPagination"
        );

    pagination.innerHTML = "";



    for (
        let i = 1;
        i <= totalPages;
        i++
    ) {

        pagination.innerHTML += `

            <li class="page-item
                ${i === currentPage
                ? "active"
                : ""
            }">

                <button class="page-link"
                        onclick="goToPage(${i})">

                    ${i}

                </button>

            </li>
        `;
    }
}



function goToPage(page) {

    supplierReturnPage = page;

    loadSupplierReturns();
}



// =====================================
// MARK AS SENT
// =====================================

async function markReturnAsSent(
    id
) {

    if (
        !confirm(
            "Mark this return order as SENT?"
        )
    ) {
        return;
    }

    try {

        const response =
            await fetch(
                `/api/supplier-returns/${id}/mark-sent`,
                {
                    method: "POST"
                }
            );

        const result =
            await response.json();

        if (!response.ok) {

            alert(
                result.message ||
                "Failed to update."
            );

            return;
        }

        alert(
            result.message ||
            "Return order marked as SENT."
        );

        loadSupplierReturns();
    }
    catch (err) {

        console.error(err);

        alert(
            "Something went wrong."
        );
    }
}



// =====================================
// STATUS BADGE
// =====================================

function renderStatusBadge(
    status
) {

    let badgeClass =
        "bg-secondary";

    switch (status) {

        case "DRAFT":
            badgeClass =
                "bg-warning text-dark";
            break;

        case "SENT":
            badgeClass =
                "bg-primary";
            break;

        case "APPROVED":
            badgeClass =
                "bg-success";
            break;

        case "REJECTED":
            badgeClass =
                "bg-danger";
            break;

        case "COMPLETED":
            badgeClass =
                "bg-dark";
            break;
    }

    return `

        <span class="badge ${badgeClass}">

            ${status}

        </span>
    `;
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


///////////////////////////   PDF THING   ////////////////////////////////

function downloadReturnOrderPdf(id) {

    window.open(
        `/api/supplier-returns/${id}/pdf`,
        "_blank"
    );
}


/////////////////////////// Mark As Sent /////////////////////////////////

// =====================================
// MARK AS SENT
// =====================================

async function markReturnAsSent(id) {

    const confirmed =
        confirm(
            "Mark this supplier return as SENT?"
        );

    if (!confirmed)
        return;



    try {

        const response =
            await fetch(
                `/api/supplier-returns/${id}/mark-sent`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    }
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
                "Failed to mark return as SENT."
            );

            return;
        }



        // =====================================
        // SUCCESS
        // =====================================

        alert(
            result.message ||
            "Supplier return marked as SENT."
        );



        // =====================================
        // RELOAD
        // =====================================

        loadSupplierReturns();
    }
    catch (err) {

        console.error(err);

        alert(
            "Something went wrong."
        );
    }
}