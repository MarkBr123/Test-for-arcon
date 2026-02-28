document.addEventListener("DOMContentLoaded", async () => {
    loadTransactionSummary();
    const pathParts = window.location.pathname.split("/");
    const transactionId = pathParts[pathParts.length - 1];

    const response = await fetch(`/api/transaction/${transactionId}/summary`);
    const data = await response.json();

    renderSummary(data);
});

function renderSummary(data) {
    loadTransactionSummary();
    document.getElementById("summaryTransactionCode").innerText = data.transactionCode;
    document.getElementById("summaryCreatedAt").innerText = formatDate(data.createdAt);
    document.getElementById("summaryStatus").innerHTML = getStatusBadge(data.status);

    document.getElementById("summaryCustomerName").innerText = data.customerName;
    document.getElementById("summaryCustomerContactNumber").innerText = data.customerNo;
    document.getElementById("summaryCustomerDelAddress").innerText = data.deliveryAddress;

    document.getElementById("summaryPaymentMethod").innerText = data.paymentMethod ?? "N/A";
    document.getElementById("summaryPaymentStatus").innerText = data.paymentStatus ?? "N/A";

    document.getElementById("summaryDeliveryCost").innerText =
        `₱${Number(data.deliveryCost).toFixed(2)}`;

    document.getElementById("summaryGrandTotal").innerText =
        `₱${Number(data.grandTotal).toFixed(2)}`;

    const tbody = document.getElementById("summaryItemsTableBody");
    tbody.innerHTML = "";

    data.items.forEach(item => {

        tbody.innerHTML += `
            <tr>
                <td>
                    ${item.productManufacturer ?? ""} 
                    ${item.productSeries ?? ""} 
                    ${item.productModel ?? ""} 
                    ${item.productSku ?? ""}
                </td>
                <td class="text-center">${item.qty}</td>
                <td class="text-end">₱${Number(item.productPrice).toFixed(2)}</td>
                <td class="text-end">₱${Number(item.stdInstallationPrice ?? 0).toFixed(2)}</td>
                <td class="text-end">₱${Number(item.additionalInstallationPrice ?? 0).toFixed(2)}</td>
                <td class="text-end fw-semibold">
                    ₱${Number(item.totalItemAmount).toFixed(2)}
                </td>
            </tr>
        `;
    });
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleString();
}

function getStatusBadge(status) {
    switch (status) {
        case "PENDING_CONFIRMATION":
            return `<span class="badge bg-warning text-dark">${status}</span>`;
        case "CONFIRMED":
            return `<span class="badge bg-success">${status}</span>`;
        case "REJECTED":
            return `<span class="badge bg-danger">${status}</span>`;
        default:
            return `<span class="badge bg-secondary">${status}</span>`;
    }
}

let pendingAction = null;
let pendingId = null;

function confirmOrder(id) {
    loadTransactionSummary()
    if (!confirm("Are you sure you want to CONFIRM this order?"))
        return;

    openFinalModal("Confirm this order?", "confirm", id);
   
}

function rejectOrder(id) {
    loadTransactionSummary()
    if (!confirm("Are you sure you want to REJECT this order?"))
        return;

    openFinalModal("Reject this order?", "reject", id);

}

function openFinalModal(message, action, id) {

    pendingAction = action;
    pendingId = id;

    document.getElementById("confirmMessage").innerText = message;

    const finalBtn = document.getElementById("finalConfirmBtn");
    finalBtn.disabled = true;

    const modal = new bootstrap.Modal(document.getElementById("finalConfirmModal"));
    modal.show();

    // ⏳ Enable after 3 seconds
    setTimeout(() => {
        finalBtn.disabled = false;
    }, 3000);
    
    
}

document.getElementById("finalConfirmBtn")
    .addEventListener("click", async function () {

        const url = pendingAction === "confirm"
            ? `/api/transaction/${pendingId}/confirm`
            : `/api/transaction/${pendingId}/reject`;

        const response = await fetch(url, {
            method: "PUT"

        });

        if (!response.ok) {
            alert("Action failed.");
            return;
        }

        // ✅ Redirect cleanly to Index
        window.location.replace("/Admin/Transactions/Index");
    });


async function loadTransactionSummary() {

    const response = await fetch(`/api/transaction/${transactionId}/summary`);
    const data = await response.json();

    // existing display logic...

    // 🔒 Disable buttons if not pending
    if (data.id == null) {

        const confirmBtn = document.getElementById("confirmBtn");
        const rejectBtn = document.getElementById("rejectBtn");

        confirmBtn.disabled = false;
        rejectBtn.disabled = false;

        confirmBtn.classList.remove("btn-success");
        confirmBtn.classList.add("btn-secondary");

        rejectBtn.classList.remove("btn-danger");
        rejectBtn.classList.add("btn-secondary");
       
    }
}


    ////////////////  NOTIFICATION CODE HERE! /////////////////////