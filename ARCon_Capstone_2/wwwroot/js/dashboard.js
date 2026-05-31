// =====================================
// DASHBOARD LOAD
// =====================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        await loadTransactionAnalytics();
        await loadInventoryAnalytics();
        await loadServiceBookingAnalytics();
    }
);


// =====================================
// TRANSACTION ANALYTICS
// =====================================


///// CHART for transaction //////

function renderTransactionCharts(data) {

    // ==========================
    // TRANSACTIONS PER MONTH
    // ==========================

    const transactionLabels =
        data.transactionsPerMonth.map(x =>
            `${x.month}/${x.year}`
        );

    const transactionValues =
        data.transactionsPerMonth.map(x =>
            x.transactionCount
        );

    new Chart(
        document.getElementById(
            "transactionsPerMonthChart"
        ),
        {
            type: "line",

            data: {
                labels: transactionLabels,

                datasets: [
                    {
                        label: "Transactions",
                        data: transactionValues,
                        tension: 0.3
                    }
                ]
            }
        }
    );



    // ==========================
    // REVENUE PER MONTH
    // ==========================

    const revenueLabels =
        data.revenuePerMonth.map(x =>
            `${x.month}/${x.year}`
        );

    const revenueValues =
        data.revenuePerMonth.map(x =>
            x.revenue
        );

    new Chart(
        document.getElementById(
            "revenuePerMonthChart"
        ),
        {
            type: "bar",

            data: {
                labels: revenueLabels,

                datasets: [
                    {
                        label: "Revenue",
                        data: revenueValues
                    }
                ]
            }
        }
    );



    // ==========================
    // PAYMENT METHODS
    // ==========================

        const paymentLabels =
            data.paymentMethods.map(x =>
                x.paymentMethod
            );

        const paymentValues =
            data.paymentMethods.map(x =>
                x.count
            );

    new Chart(
        document.getElementById("paymentMethodChart"),
        {
            type: "doughnut",

            data: {
                labels: paymentLabels,

                datasets: [
                    {
                        data: paymentValues
                    }
                ]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: "70%"
            }
        }
    );



    // ==========================
    // STATUS DISTRIBUTION
    // ==========================

    const statusLabels =
        data.statusDistribution.map(x =>
            x.status
        );

    const statusValues =
        data.statusDistribution.map(x =>
            x.count
        );

    new Chart(
        document.getElementById(
            "statusDistributionChart"
        ),
        {
            type: "bar",

            data: {
                labels: statusLabels,

                datasets: [
                    {
                        label: "Transactions",
                        data: statusValues
                    }
                ]
            },

            options: {
                indexAxis: "y"
            }
        }
    );
}







//// Service Booking Chart  ////


function renderServiceBookingCharts(data) {

    // ==========================
    // BOOKINGS PER MONTH
    // ==========================

    const bookingLabels =
        data.serviceBookingPerMonth.map(x =>
            `${x.month}/${x.year}`
        );

    const bookingValues =
        data.serviceBookingPerMonth.map(x =>
            x.serviceBookingCount
        );

    new Chart(
        document.getElementById(
            "serviceBookingPerMonthChart"
        ),
        {
            type: "line",
            data: {
                labels: bookingLabels,
                datasets: [{
                    label: "Bookings",
                    data: bookingValues
                }]
            }
        }
    );



    // ==========================
    // REVENUE PER MONTH
    // ==========================

    const monthNames = [
        "Jan", "Feb", "Mar", "Apr",
        "May", "Jun", "Jul", "Aug",
        "Sep", "Oct", "Nov", "Dec"
    ];

    const revenueLabels =
        data.serviceRevenuePerMonth.map(x =>
            `${monthNames[x.month - 1]} ${x.year}`
        );

    const revenueValues =
        data.serviceRevenuePerMonth.map(x =>
            x.revenue
        );

    new Chart(
        document.getElementById(
            "serviceRevenuePerMonthChart"
        ),
        {
            type: "bar",
            data: {
                labels: revenueLabels,
                datasets: [{
                    label: "Revenue",
                    data: revenueValues
                }]
            }
        }
    );



    // ==========================
    // PAYMENT METHODS
    // ==========================

    const paymentLabels =
        data.paymentMethods.map(x =>
            x.paymentMethod
        );

    const paymentValues =
        data.paymentMethods.map(x =>
            x.count
        );

    new Chart(
        document.getElementById(
            "servicePaymentMethodChart"
        ),
        {
            type: "doughnut",
            data: {
                labels: paymentLabels,
                datasets: [{
                    data: paymentValues
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: "70%"
            }
        }
    );



    // ==========================
    // STATUS DISTRIBUTION
    // ==========================

    const statusLabels =
        data.statusDistribution.map(x =>
            x.status
        );

    const statusValues =
        data.statusDistribution.map(x =>
            x.count
        );

    new Chart(
        document.getElementById(
            "serviceStatusDistributionChart"
        ),
        {
            type: "bar",
            data: {
                labels: statusLabels,
                datasets: [{
                    label: "Bookings",
                    data: statusValues
                }]
            },
            options: {
                indexAxis: "y"
            }
        }
    );
}


/////// INVENTORY AND PRODUCT CHART   /////////


function renderInventoryCharts(data) {

    // ==========================
    // STATUS DISTRIBUTION
    // ==========================

    const statusLabels =
        data.statusDistribution.map(x =>
            x.status.replaceAll("_", " ")
        );

    const statusValues =
        data.statusDistribution.map(x =>
            x.count
        );

    const inventoryStatusCanvas =
        document.getElementById(
            "inventoryStatusChart"
        );

    if (
        Chart.getChart(
            inventoryStatusCanvas
        )
    ) {
        Chart.getChart(
            inventoryStatusCanvas
        ).destroy();
    }

    new Chart(
        inventoryStatusCanvas,
        {
            type: "doughnut",

            data: {
                labels: statusLabels,

                datasets: [
                    {
                        label: "Inventory Units",
                        data: statusValues
                    }
                ]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: "70%",

                plugins: {
                    legend: {
                        position: "bottom"
                    }
                }
            }
        }
    );



    // ==========================
    // TOP 20 PRODUCTS
    // ==========================

    const productLabels =
        data.topProducts.map(x =>
            `${x.productModel} (${x.sku})`
        );

    const productValues =
        data.topProducts.map(x =>
            x.soldCount
        );



    // Make chart taller
    const topProductsCanvas =
        document.getElementById(
            "topProductsChart"
        );

    const container =
        topProductsCanvas.parentElement;

    container.style.height =
        `${Math.max(
            500,
            productLabels.length * 40
        )}px`;



    if (
        Chart.getChart(
            topProductsCanvas
        )
    ) {
        Chart.getChart(
            topProductsCanvas
        ).destroy();
    }



    new Chart(
        topProductsCanvas,
        {
            type: "bar",

            data: {
                labels: productLabels,

                datasets: [
                    {
                        label: "Units Sold",
                        data: productValues
                    }
                ]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,

                indexAxis: "y",

                plugins: {
                    legend: {
                        display: false
                    },

                    title: {
                        display: true,
                        text:
                            "Top Best Selling Products"
                    }
                },

                scales: {
                    x: {
                        beginAtZero: true
                    }
                }
            }
        }
    );



    // ==========================
    // NEWEST PRODUCTS
    // ==========================

    const newestProductsList =
        document.getElementById(
            "newestProductsList"
        );

    if (newestProductsList) {

        newestProductsList.innerHTML = "";

        data.newestProducts.forEach(product => {

            const date =
                new Date(
                    product.created_at
                );

            newestProductsList.innerHTML += `
                <div class="dashboard-detail-row">

                    <div class="dashboard-detail-left">

                        <i class="bi bi-box-seam text-primary"></i>

                        <div>

                            <div>
                                ${product.productName}
                            </div>

                            <small class="text-muted">
                                ${product.sku}
                            </small>

                        </div>

                    </div>

                    <div class="dashboard-detail-value">

                        ${date.toLocaleDateString()}

                    </div>

                </div>
            `;
        });
    }
}



async function loadTransactionAnalytics() {

    try {

        const response =
            await fetch(
                "/api/dashboard/transaction-analytics"
            );

        const data =
            await response.json();



        // ==========================
        // KPI CARDS
        // ==========================

        document.getElementById(
            "totalTransactions"
        ).innerText =
            data.summary.totalTransactions ?? 0;



        document.getElementById(
            "totalRevenue"
        ).innerText =
            "₱ " +
            Number(
                data.summary.totalRevenue ?? 0
            ).toLocaleString();



        document.getElementById(
            "averageOrderValue"
        ).innerText =
            "₱ " +
            Number(
                data.summary.averageOrderValue ?? 0
            ).toLocaleString();



        // ==========================
        // CHART DATA
        // ==========================

        window.transactionAnalytics = data;
        renderTransactionCharts(data);
        console.log(
            "Transaction Analytics Loaded",
            data
        );

    }
    catch (err) {

        console.error(
            "Analytics load failed:",
            err
        );
    }
}




// =====================================
// INVENTORY ANALYTICS
// =====================================

async function loadInventoryAnalytics() {

    try {

        const response =
            await fetch(
                "/api/dashboard/inventory-analytics"
            );

        const data =
            await response.json();



        // ==========================
        // KPI CARDS
        // ==========================

        document.getElementById(
            "totalSkus"
        ).innerText =
            data.summary.totalSkus ?? 0;



        document.getElementById(
            "totalUnits"
        ).innerText =
            data.summary.totalUnits ?? 0;



        document.getElementById(
            "activeProducts"
        ).innerText =
            data.summary.activeProducts ?? 0;

        document.getElementById(
            "archivedProducts"
        ).innerText =
            data.summary.archivedProducts ?? 0;




        document.getElementById(
            "discountedProducts"
        ).innerText =
            data.summary.discountedProducts ?? 0;



        document.getElementById(
            "lowStockProducts"
        ).innerText =
            data.summary.lowStockProducts ?? 0;



        document.getElementById(
            "outOfStockProducts"
        ).innerText =
            data.summary.outOfStockProducts ?? 0;



        document.getElementById(
            "unitsSold"
        ).innerText =
            data.summary.unitsSold ?? 0;



        // ==========================
        // CHARTS
        // ==========================

        renderInventoryCharts(data);



        // ==========================
        // NEWEST PRODUCTS
        // ==========================

        const newestProductsList =
            document.getElementById(
                "newestProductsList"
            );

        newestProductsList.innerHTML = "";



        data.newestProducts.forEach(product => {

            const date =
                new Date(product.created_at);

            newestProductsList.innerHTML += `
        <div class="dashboard-detail-row">

            <div class="dashboard-detail-left">

                <i class="bi bi-box-seam text-primary"></i>

                <div>

                    <div>
                        <strong>
                            ${product.productName}
                        </strong>
                    </div>

                    <small class="text-muted">

                        ${product.manufacturerName}
                        •
                        ${product.sku}

                    </small>

                </div>

            </div>

            <div class="dashboard-detail-value">

                ${date.toLocaleDateString()}

            </div>

        </div>
    `;
        });
    }
    catch (err) {

        console.error(
            "Inventory analytics load failed:",
            err
        );
    }
}




// =====================================
// SERVICE BOOKING ANALYTICS
// =====================================

async function loadServiceBookingAnalytics() {

    try {

        const response =
            await fetch(
                "/api/dashboard/service-booking-analytics"
            );

        const data =
            await response.json();



        // ==========================
        // KPI CARDS
        // ==========================

        document.getElementById(
            "serviceTotal"
        ).innerText =
            data.summary.totalServiceBooking ?? 0;



        document.getElementById(
            "serviceTotalRevenue"
        ).innerText =
            "₱ " +
            Number(
                data.summary.totalServiceRevenue ?? 0
            ).toLocaleString();



        document.getElementById(
            "averageServiceValue"
        ).innerText =
            "₱ " +
            Number(
                data.summary.averageServiceValue ?? 0
            ).toLocaleString();



        // ==========================
        // CHARTS
        // ==========================

        renderServiceBookingCharts(data);

    }
    catch (err) {

        console.error(
            "Service analytics load failed:",
            err
        );
    }
}