document.addEventListener("DOMContentLoaded", async () => {
    const pathParts = window.location.pathname.split("/");
    const transactionId = pathParts[pathParts.length - 1];

    const response = await fetch(`/api/transaction/${transactionId}/details`);
    const data = await response.json();

    renderSummary(data);
});

function renderSummary(data) {

    document.getElementById("summaryTransactionCode").innerText = data.transactionCode;
    document.getElementById("summaryCreatedAt").innerText = formatDate(data.createdAt);
    document.getElementById("summaryStatus").innerHTML = getStatusBadge(data.status);
    document.getElementById("summaryShippingMethod").innerHTML = getStatusBadge(data.shippingMethod);

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


    ////////////////  NOTIFICATION CODE HERE! /////////////////////