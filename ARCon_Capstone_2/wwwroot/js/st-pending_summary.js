
async function loadSummary() {
    try {
        const res = await fetch(`/api/service-transactions/pending-summary/${bookingId}`);

            

        // 🔥 CHECK RESPONSE FIRST
        if (!res.ok) {
            const text = await res.text();
            console.error("API ERROR RESPONSE:", text);
            throw new Error("API failed: " + res.status);
        }

        const data = await res.json();

        const statusEl = document.getElementById("summaryPaymentStatus");
        statusEl.innerText = data.payment.status || "N/A";
        statusEl.className = "badge bg-success";

        // HEADER
        document.getElementById("summaryRefCode").innerText = data.referenceCode;
        document.getElementById("summaryFailureCount").innerText = data.failure_count ?? " - ";
        document.getElementById("summaryCreatedAt").innerText = formatDateTime(data.createdAt);
        document.getElementById("summaryStatus").innerText = data.status;
        document.getElementById("summaryDate").innerText = formatDate(data.scheduledDate);
        document.getElementById("summaryTime").innerText = formatTime(data.preferredTime);
        document.getElementById("summaryPropertyType").innerText = data.propertyType;
        document.getElementById("summaryPaymentMethod").innerText = data.payment.method;
        document.getElementById("summaryPaymentStatus").innerText = data.payment.status;    

        // CUSTOMER
        document.getElementById("summaryCustomerName").innerText = data.customer.name;
        document.getElementById("summaryBusinessName").innerText = data.businessName;
        document.getElementById("summaryCustomerContact").innerText = data.customer.contact ?? "-";
        document.getElementById("summaryAddress").innerText = data.deliveryAddress ?? "-";
        document.getElementById("summaryCustomerNote").innerText = data.customerNote;

        // ITEMS
        const tbody = document.getElementById("summaryItemsBody");
        tbody.innerHTML = "";

        data.items.forEach(i => {
            tbody.innerHTML += `
                <tr>
                    <td>${i.serviceName}</td>
                    <td class="text-center">${i.unit ?? ""}</td>
                    <td class="text-center">${i.capacity ?? ""}</td>
                    <td class="text-center">${i.brand ?? ""}</td>
                    <td class="text-center">${i.unitCount}</td>
                    <td class="text-end">₱ ${formatMoney(i.price)}</td>
                    <td class="text-end">₱ ${formatMoney(i.total)}</td>
                </tr>
            `;
        });

        // SUMMARY
        document.getElementById("summaryTotalServices").innerText = data.summary.totalServices;
        document.getElementById("summaryTotalUnits").innerText = data.summary.totalUnits;
        document.getElementById("summaryTotalAmount").innerText = "₱ " + formatMoney(data.summary.totalAmount);

        // 🔥 ADD THIS (SERVICE HISTORY)
        renderServiceTransactions(data.serviceTransactions);
    }
    catch (err) {
        console.error("Load summary error:", err);
        alert("Failed to load summary. Check console.");
    }
}

//Service Transaction, if there is any

function renderServiceTransactions(list) {
    const tbody = document.getElementById("serviceTransactionHistoryBody");
    tbody.innerHTML = "";

    if (!list || list.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted py-3">
                    No service history yet
                </td>
            </tr>
        `;
        return;
    }

    list.forEach((t, index) => {

        const highlight = index === 0 ? "table-primary" : "";

        // 🔥 FIXED RESULT TIME (clean + short)
        let resultTime = "-";

        if (t.completedDate) {
            resultTime = formatDateTime(
                new Date(t.completedDate + "T" + (t.completedTime ?? "00:00"))
            );
        } else if (t.failedAt) {
            resultTime = formatDateTime(t.failedAt);
        } else if (t.partiallyAt) {
            resultTime = formatDateTime(t.partiallyAt);
        }

        tbody.innerHTML += `
            <tr class="${highlight}">
                <td class="fw-semibold text-truncate" style="max-width:120px;">
                    ${t.referenceCode}
                </td>

                <td class="text-center">
                    ${t.serviceTry ?? "-"}
                </td>

                <td class="text-center">
                    ${formatStatus(t.status)}
                </td>

                <td class="text-center small">
                    ${formatDateTime(t.createdAt)}
                </td>

                <td class="text-center small">
                    ${resultTime}
                </td>
            </tr>
        `;
    });
}

// Format Status

function formatStatus(status) {
    switch (status) {
        case "COMPLETED":
            return `<span class="badge bg-success">Completed</span>`;
        case "FAILED":
            return `<span class="badge bg-danger">Failed</span>`;
        case "FAILED_FOR_REFUND":
            return `<span class="badge bg-warning text-dark">Refund</span>`;
        case "PARTIALLY_COMPLETED":
            return `<span class="badge bg-secondary">Partial</span>`;
        case "CANCELLED":
            return `<span class="badge bg-dark">Cancelled</span>`;
        default:
            return `<span class="badge bg-light text-dark">${status}</span>`;
    }
}




    // ================= HELPERS =================
    function formatDate(d) {
    if (!d) return "";
    return new Date(d).toLocaleDateString();
}

    function formatTime(t) {
    if (!t) return "";
    return t.substring(0,5);
}

    function formatDateTime(dt) {
    if (!dt) return "";
    return new Date(dt).toLocaleString();
}

    function formatMoney(n) {
    return Number(n || 0).toLocaleString(undefined, {minimumFractionDigits: 2 });
}

    // ================= ACTIONS =================
    async function confirmBooking(id) {
        await fetch(`/api/service_booking/confirm/${id}`, { method: "POST" });
    alert("Booking confirmed!");
    window.location.href = "/Admin/Services/Processing";
}

    async function rejectBooking(id) {
        await fetch(`/api/service_booking/reject/${id}`, { method: "POST" });
    alert("Booking rejected!");
    window.location.href = "/Admin/Services/Rejected";
}

    // INIT
    document.addEventListener("DOMContentLoaded", loadSummary);
