
document.addEventListener(
    "DOMContentLoaded",

    async () => {

        await loadCustomerTransactionCounts();
        await loadInventoryStatusCounts();
        await loadServiceBookingStatusCounts();
    }
);



// =====================================
// CUSTOMER TRANSACTION COUNTS
// =====================================

async function loadCustomerTransactionCounts() {

    try {

        const response =
            await fetch(
                "/api/dashboard/dashboard/customer-transaction-counts"
            );



        const data =
            await response.json();



        // TOTAL

        document.getElementById(
            "totalTransactions"
        ).innerText =
            data.total ?? 0;



        // PENDING CONFIRMATION

        document.getElementById(
            "pendingConfirmation"
        ).innerText =
            data.pendingConfirmation ?? 0;



        // CONFIRMED

        document.getElementById(
            "confirmedTransactions"
        ).innerText =
            data.confirmed ?? 0;



        // PROCESSED

        document.getElementById(
            "processedTransactions"
        ).innerText =
            data.processed ?? 0;



        // PENDING REPROCESS

        document.getElementById(
            "pendingReprocess"
        ).innerText =
            data.pendingReprocess ?? 0;



        // COMPLETED

        document.getElementById(
            "completedTransactions"
        ).innerText =
            data.completed ?? 0;



        // REJECTED

        document.getElementById(
            "rejectedTransactions"
        ).innerText =
            data.rejected ?? 0;



        // REJECTED FOR REFUND

        document.getElementById(
            "rejectedRefundTransactions"
        ).innerText =
            data.rejectedForRefund ?? 0;



        // CANCELLED

        document.getElementById(
            "cancelledTransactions"
        ).innerText =
            data.cancelled ?? 0;



        // CANCELLED FOR REFUND

        document.getElementById(
            "cancelledRefundTransactions"
        ).innerText =
            data.cancelledForRefund ?? 0;
    }
    catch (err) {

        console.error(
            "Dashboard load failed:",
            err
        );
    }
}


// =====================================
// INVENTORY STATUS COUNTS
// =====================================

async function loadInventoryStatusCounts() {

    try {

        const response =
            await fetch(
                "/api/dashboard/inventory-status-counts"
            );



        const data =
            await response.json();



        // TOTAL

        document.getElementById(
            "totalInventory"
        ).innerText =
            data.total ?? 0;



        // GOOD STOCK

        document.getElementById(
            "goodStock"
        ).innerText =
            data.goodStock ?? 0;



        // RESERVED

        document.getElementById(
            "reservedForDelivery"
        ).innerText =
            data.reservedForDelivery ?? 0;



        // SOLD

        document.getElementById(
            "soldInventory"
        ).innerText =
            data.sold ?? 0;



        // AS REPLACEMENT

        document.getElementById(
            "asReplacement"
        ).innerText =
            data.asReplacement ?? 0;



        // RETURNED TO SUPPLIER

        document.getElementById(
            "returnedToSupplier"
        ).innerText =
            data.returnedToSupplier ?? 0;
    }
    catch (err) {

        console.error(
            "Inventory dashboard load failed:",
            err
        );
    }
}

// =====================================
// SERVICE BOOKING STATUS COUNTS
// =====================================

async function loadServiceBookingStatusCounts() {

    try {

        const response =
            await fetch(
                "/api/dashboard/service-booking-status-counts"
            );



        const data =
            await response.json();



        // TOTAL

        document.getElementById(
            "serviceTotal"
        ).innerText =
            data.total ?? 0;



        // PENDING

        document.getElementById(
            "servicePending"
        ).innerText =
            data.pending ?? 0;



        // CONFIRMED

        document.getElementById(
            "serviceConfirmed"
        ).innerText =
            data.confirmed ?? 0;



        // PROCESSING

        document.getElementById(
            "serviceProcessing"
        ).innerText =
            data.processing ?? 0;



        // COMPLETED

        document.getElementById(
            "serviceCompleted"
        ).innerText =
            data.completed ?? 0;



        // PARTIALLY COMPLETED

        document.getElementById(
            "servicePartiallyCompleted"
        ).innerText =
            data.partiallyCompleted ?? 0;



        // WARRANTY APPROVED

        document.getElementById(
            "serviceWarrantyApproved"
        ).innerText =
            data.warrantyApproved ?? 0;



        // FAILED

        document.getElementById(
            "serviceFailed"
        ).innerText =
            data.failed ?? 0;



        // FAILED FOR REFUND

        document.getElementById(
            "serviceFailedRefund"
        ).innerText =
            data.failedForRefund ?? 0;



        // CANCELLED

        document.getElementById(
            "serviceCancelled"
        ).innerText =
            data.cancelled ?? 0;



        // REJECTED

        document.getElementById(
            "serviceRejected"
        ).innerText =
            data.rejected ?? 0;
    }
    catch (err) {

        console.error(
            "Service dashboard load failed:",
            err
        );
    }
}

