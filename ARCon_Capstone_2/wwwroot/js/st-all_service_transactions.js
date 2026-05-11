let currentPage = 1;
let pageSize = 24;

let currentSearch = "";
let currentSort = "createdAt";
let currentDirection = "desc";

async function loadAllServicesTransaction() {
    const spinner = document.getElementById("loadingSpinner");
    spinner.style.display = "block";

    const statuses = getSelectedStatuses(); // 👈 ADD THIS

    let url = `/api/service-transactions/all-transactions?page=${currentPage}&pageSize=${pageSize}&search=${currentSearch}&sortBy=${currentSort}&sortDir=${currentDirection}`;

    if (statuses.length > 0) {
        url += `&statuses=${statuses.join(",")}`; // 👈 ADD THIS
    }

    const res = await fetch(url);
    const result = await res.json();

    renderTable(result.data);
    renderPagination(result.totalCount);

    spinner.style.display = "none";
}

let debounceTimer;

document.getElementById("historySearchInput")
    .addEventListener("input", function () {

        clearTimeout(debounceTimer);

        debounceTimer = setTimeout(() => {
            currentSearch = this.value;
            currentPage = 1;
            loadAllServicesTransaction();
        }, 400);
    });

function sort(column) {

    if (currentSort === column) {
        currentDirection = currentDirection === "asc" ? "desc" : "asc";
    } else {
        currentSort = column;
        currentDirection = "asc";
    }

    currentPage = 1;
    loadAllServicesTransaction();
}

function renderPagination(totalRecords) {
    const totalPages = Math.ceil(totalRecords / pageSize);
    const container = document.getElementById("pagination");

    container.innerHTML = "";

    for (let i = 1; i <= totalPages; i++) {
        container.innerHTML += `
            <li class="page-item ${i === currentPage ? "active" : ""}">
                <button class="page-link" onclick="goToPage(${i})">${i}</button>
            </li>
        `;
    }
}

function goToPage(page) {
    if (page < 1) return;
    currentPage = page;
    loadAllServicesTransaction();
}

function renderTable(data) {
    const tbody = document.getElementById("servicesHistoryTableBody");

    tbody.innerHTML = "";

    if (!data || data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="15" class="text-center text-muted">No data found</td>
            </tr>
        `;
        return;
    }

    data.forEach(item => {
        const scheduleLabel = getScheduleLabel(item.actualScheduledDate);
        tbody.innerHTML += `
            <tr>
                <td></td>
                <td class="text-center">${item.stRefCode ?? ""}</td>
                <td class="text-center">${item.bookingRefCode ?? ""}</td>
                <td class="text-center">${item.customerName ?? ""}</td>
                <td class="text-center fw-semibold">${scheduleLabel}</td>
                <td class="text-center">${formatDate(item.actualScheduledDate)}</td>
                <td class="text-center">${formatTime(item.actualScheduledTime)}</td>
                <td class="text-center">${formatDate(item.estimatedCompletionDate)}</td>
                <td class="text-center">${formatTime(item.estimatedCompletionTime)}</td>
                <td class="text-center">${item.techniciansRequired ?? 0}</td>
               <!-- WORK DIFFICULTY -->
                    <td class="text-center">
                        ${item.difficultyRate ?? ""}
                    </td>

                    <!-- ST CREATE DATE -->
                    <td class="text-center">
                        ${formatDateTime(item.createdAt)}
                    </td>

                    <!-- TRANSACTION TYPE -->
                    <td class="text-center">
                        ${item.stType ?? ""}
                    </td>

                    <!-- STATUS -->
                    <td class="text-center">
                        ${item.status ?? ""}
                    </td>
                            <td class="text-center">
                                <div class="dropdown">


                                    <button class="btn btn-sm btn-outline-secondary"
                                            type="button"
                                            data-bs-toggle="dropdown"
                                            aria-expanded="false">
                                        ⋮
                                    </button>

                                    <ul class="dropdown-menu shadow-sm border-0 rounded-3 p-2">
                                        <!-- VIEW -->
                                        <li>
                                            <a class="dropdown-item d-flex align-items-center gap-2 py-2 rounded action-hover"
                                               href="/Admin/Services/SB_ST_Summary/${item.id}">
                                                <i class="bi bi-receipt text-info"></i>
                                                <span class="fw-medium">View Transaction</span>
                                            </a>
                                        </li>
                                    </ul>
                        </div>
                    </td>
            </tr>
        `;
    });


}

function getScheduleLabel(dateStr) {
    if (!dateStr) return "-";

    const today = new Date();
    const sched = new Date(dateStr);

    // remove time part
    today.setHours(0, 0, 0, 0);
    sched.setHours(0, 0, 0, 0);

    const diffTime = sched - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Missed";
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";

    return `In ${diffDays} days`;
}



function formatDate(date) {
    if (!date) return "";
    return new Date(date).toLocaleDateString();
}

function formatTime(time) {
    if (!time) return "";
    return time.substring(0, 5); // HH:mm
}

function formatDateTime(dt) {
    if (!dt) return "";
    return new Date(dt).toLocaleString();
}

document.addEventListener("DOMContentLoaded", () => {
    loadAllServicesTransaction();
});

document.querySelectorAll(".sortable").forEach(th => {
    th.addEventListener("click", function () {
        const column = this.dataset.column;
        sort(column);
    });
});

function getSelectedStatuses() {
    return Array.from(document.querySelectorAll(".status-filter:checked"))
        .map(cb => cb.value);
}

document.querySelectorAll(".status-filter").forEach(cb => {
    cb.addEventListener("change", () => {
        currentPage = 1;
        loadAllServicesTransaction();
    });
});