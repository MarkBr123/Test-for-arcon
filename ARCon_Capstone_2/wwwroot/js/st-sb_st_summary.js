async function loadFullSummary(transactionId) {
    try {
        const res = await fetch(`/api/service-transactions/stsummary/${transactionId}`);

        if (!res.ok) {
            throw new Error("Failed to fetch summary");
        }

        const data = await res.json();

        console.log("DATA:", data);

        renderSummary(data);

    } catch (err) {
        console.error(err);

        document.getElementById("summaryContainer").innerHTML = `
            <div class="alert alert-danger">
                ${err.message}
            </div>
        `;
    }
}

function renderSummary(data) {
    const techs = data.transaction.assignedTechnicians || [];

    document.getElementById("headerTransactionInfo").innerHTML = `
            <div>

                <h6 class="fw-bold mb-0">
                    ${data.transaction.referenceCode}
                </h6>

                <small class="text-muted">
                    Reference Code
                </small>

            </div>

            <div>

                <h6 class="fw-bold mb-0">
                    ${data.transaction.status}
                </h6>

                <small class="text-muted">
                    Status
                </small>

            </div>

            <div>

                <h6 class="fw-bold mb-0">
                    ${data.transaction.st_type}
                </h6>

                <small class="text-muted">
                    Transaction Type
                </small>

            </div>

            <div>

                <h6 class="fw-bold mb-0">
                    ${data.transaction.dateCompleted ?? "- - - - - - - - "}
                </h6>

                <small class="text-muted">
                    Date Completed
                </small>

            </div>

            `;

    // 🟡 TRANSACTION
    document.getElementById("transactionSection").innerHTML = `

    <!-- TOP ROW (IMPORTANT INFO) -->
    <div class="col-md-3">
        <label class="form-label">Technicians</label>
        <input class="form-control" value="${data.transaction.noTechnicians}" readonly>
    </div>

    <div class="col-md-3">
        <label class="form-label">Difficulty</label>
        <input class="form-control" value="${data.transaction.difficulty}" readonly>
    </div>

    <div class="col-md-3">
        <label class="form-label">Tries</label>
        <input class="form-control" value="${data.transaction.serviceTries}" readonly>
    </div>

    <div class="col-md-3">
        <label class="form-label">Re-Service Fee</label>
        <input class="form-control" value="₱${Number(data.transaction.reserviceFee).toLocaleString()}" readonly>
    </div>

    <!-- DIVIDER SPACE -->
    <div class="col-12"><hr class="my-2"></div>

    <!-- SCHEDULE -->
    <div class="col-md-3">
        <label class="form-label">Actual Work Date</label>
        <input class="form-control" value="${data.transaction.scheduledDate}" readonly>
    </div>

    <div class="col-md-3">
        <label class="form-label">Actual Work Time</label>
        <input class="form-control" value="${data.transaction.scheduledTime}" readonly>
    </div>

    <div class="col-md-3">
        <label class="form-label">Est. Completion Date</label>
        <input class="form-control" value="${data.transaction.estimatedCompletionDate}" readonly>
    </div>

    <div class="col-md-3">
        <label class="form-label">Est. Completion Time</label>
        <input class="form-control" value="${data.transaction.estimatedCompletionTime}" readonly>
    </div>

    <!-- DIVIDER -->
    <div class="col-12"><hr class="my-2"></div>

    <!-- MATERIALS -->
    <div class="col-md-6">
        <label class="form-label">Tools Needed</label>
        <textarea class="form-control" rows="2" readonly>${data.transaction.toolsNeeded ?? "-"}</textarea>
    </div>

    <div class="col-md-6">
        <label class="form-label">Parts Required</label>
        <textarea class="form-control" rows="2" readonly>${data.transaction.partsNeeded ?? "-"}</textarea>
    </div>

    <!-- NOTES -->
    <div class="col-12">
        <label class="form-label">Notes to Technicians</label>
        <textarea class="form-control" rows="2" readonly>${data.transaction.notes ?? "-"}</textarea>
    </div>
`;


    // 🔵 BOOKING
    document.getElementById("bookingSection").innerHTML = `
    <div class="col-md-3">
        <label class="form-label">Reference</label>
        <input class="form-control" value="${data.booking.referenceCode}" readonly>
    </div>

    <div class="col-md-3">
        <label class="form-label">Status</label>
        <input class="form-control" value="${data.booking.status}" readonly>
    </div>

    <div class="col-md-3">
        <label class="form-label">Property</label>
        <input class="form-control" value="${data.booking.propertyType}" readonly>
    </div>

    <div class="col-md-3">
        <label class="form-label">Failure Count</label>
        <input class="form-control" value="${data.booking.failure_count ?? 0}" readonly>
    </div>

    <div class="col-md-6">
        <label class="form-label">Preferred Date</label>
        <input class="form-control" value="${data.booking.scheduledDate}" readonly>
    </div>

    <div class="col-md-6">
        <label class="form-label">Preferred Time</label>
        <input class="form-control" value="${data.booking.preferredTime}" readonly>
    </div>

    <div class="col-12">
        <label class="form-label">Customer Note</label>
        <textarea class="form-control" rows="2" readonly>${data.booking.customerNote ?? "-"}</textarea>
    </div>
`;

    // 🟢 CUSTOMER + PAYMENT
    document.getElementById("customerSection").innerHTML = `
    <div class="col-md-4">
        <label class="form-label">Customer</label>
        <input class="form-control" value="${data.customer.name}" readonly>
    </div>

    <div class="col-md-4">
        <label class="form-label">Business</label>
        <input class="form-control" value="${data.booking.businessName ?? "-"}" readonly>
    </div>

    <div class="col-md-4">
        <label class="form-label">Contact</label>
        <input class="form-control" value="${data.customer.contact}" readonly>
    </div>

    <div class="col-md-4">
        <label class="form-label">Payment</label>
        <input class="form-control" value="${data.payment.method}" readonly>
    </div>

    <div class="col-md-4">
        <label class="form-label">Payment Status</label>
        <input class="form-control" value="${data.payment.status}" readonly>
    </div>

    <div class="col-md-4">
        <label class="form-label">Reference</label>
        <input class="form-control" value="${data.payment.reference ?? "-"}" readonly>
    </div>

    <div class="col-12">
        <label class="form-label">Address</label>
        <textarea class="form-control" rows="2" readonly>${data.deliveryAddress ?? "-"}</textarea>
    </div>

    `;
    document.getElementById("technicianSection").innerHTML = `
    <div class="col-12 mt-2">
    ${techs.length === 0
            ? `<div class="form-control text-muted">No technicians assigned</div>`
            : `
            <div class="form-control">
        
                <!-- HEADER -->
                <div class="row fw-semibold text-muted mb-1">
                    <div class="col-md-3">Name</div>
                    <div class="col-md-3">Contact</div>
                    <div class="col-md-4">Email</div>
                    <div class="col-md-2 text-end">Status</div>
                </div>

                <!-- DATA -->
                ${techs.map(t => `
                    <div class="row align-items-center mb-1">
                        <div class="col-md-3">${t.name}</div>
                        <div class="col-md-3">${t.contact}</div>
                        <div class="col-md-4 text-truncate">${t.email}</div>
                        <div class="col-md-2 text-end">
                            <small class="${t.isOnline ? 'text-success' : 'text-secondary'}">
                                ● ${t.isOnline ? 'Online' : 'Offline'}
                            </small>
                        </div>
                    </div>
                `).join("")}

            </div>
        `
        }
        </div>

 `;

    // 📦 ITEMS
    document.getElementById("itemsSection").innerHTML = `
    <table class="table table-sm">
        <thead>
            <tr>
                <th>Service</th>
                <th>Type</th>
                <th>Units</th>
                <th>Brand</th>
                <th>Capacity</th>
                <th class="text-end">Total</th>
            </tr>
        </thead>
        <tbody>
            ${data.items.map(i => `
                <tr>
                    <td>${i.serviceName}</td>
                    <td>${i.airconType}</td>
                    <td>${i.unitCount}</td>
                    <td>${i.brand}</td>
                    <td>${i.capacity}</td>
                    <td class="text-end">₱${Number(i.total).toLocaleString()}</td>
                </tr>
            `).join("")}
        </tbody>
    </table>

    <div class="text-end fw-bold mt-2">
        Total: ₱${Number(data.summary.totalAmount).toLocaleString()}
    </div>
`;

    const status = data.transaction.statusDetails || {};

    // ================= FAILED =================
    document.getElementById("failedSection").innerHTML = status.isFailed
        ? `
    <table class="table table-sm">
        <thead>
            <tr>
                <th>Status</th>
                <th>Reason</th>
                <th class="text-end">Date</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td class="text-danger fw-bold">FAILED</td>
                <td>${status.failReason ?? "-"}</td>
                <td class="text-end">${formatDateTime(status.failedAt)}</td>
            </tr>
        </tbody>
    </table>
`
        : `<div class="text-muted">No failed record</div>`;


    // ================= FAILED FOR REFUND =================
    document.getElementById("failedRefundSection").innerHTML = status.failedForRefund
        ? `
    <table class="table table-sm">
        <thead>
            <tr>
                <th>Status</th>
                <th>Reason</th>
                <th class="text-end">Date</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td class="text-warning fw-bold">FAILED (REFUND)</td>
                <td>${status.failReason ?? "-"}</td>
                <td class="text-end">${formatDateTime(status.failedAt)}</td>
            </tr>
        </tbody>
    </table>
`
        : `<div class="text-muted">No refunded failure record</div>`;


    // ================= PARTIAL =================
    document.getElementById("partialSection").innerHTML = status.isPartiallyCompleted
        ? `
    <table class="table table-sm">
        <thead>
            <tr>
                <th>Status</th>
                <th>Reason</th>
                <th class="text-end">Date</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td class="text-warning fw-bold">PARTIAL</td>
                <td>${status.partiallyReason ?? "-"}</td>
                <td class="text-end">${formatDateTime(status.partiallyAt)}</td>
            </tr>
        </tbody>
    </table>
`
        : `<div class="text-muted">No partial completion</div>`;
}

function formatDateTime(dateStr) {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return d.toLocaleString();
}