async function loadTechnicianCalendar() {

    try {

        // =========================
        // INJECT CSS
        // =========================
        if (!document.getElementById("techCalendarStyles")) {

            const style = document.createElement("style");

            style.id = "techCalendarStyles";

            style.innerHTML = `

                body {
                    background: #f4f7fb;
                    font-family: 'Segoe UI', sans-serif;
                    color: #1e293b;
                }

                .calendar-container {
                    max-width: 950px;
                    margin: 40px auto;
                    padding: 10px;
                }

                .calendar-day {
                    position: relative;
                    margin-bottom: 35px;
                }

                .calendar-date-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;

                    background: linear-gradient(
                        135deg,
                        #2563eb,
                        #1d4ed8
                    );

                    color: white;

                    padding: 20px 25px;

                    border-radius: 18px;

                    box-shadow:
                        0 8px 20px rgba(37, 99, 235, 0.18);
                }

                .date-left {
                    display: flex;
                    align-items: center;
                    gap: 18px;
                }

                .day-number {
                    width: 70px;
                    height: 70px;

                    background: rgba(255,255,255,0.18);

                    border: 2px solid rgba(255,255,255,0.2);

                    border-radius: 20px;

                    display: flex;
                    align-items: center;
                    justify-content: center;

                    font-size: 30px;
                    font-weight: 700;

                    backdrop-filter: blur(10px);
                }

                .date-info {
                    display: flex;
                    flex-direction: column;
                }

                .day-name {
                    font-size: 22px;
                    font-weight: 700;
                }

                .full-date {
                    font-size: 14px;
                    opacity: 0.9;
                    margin-top: 4px;
                }

                .booking-count {
                    background: rgba(255,255,255,0.15);

                    padding: 10px 16px;

                    border-radius: 999px;

                    font-size: 14px;
                    font-weight: 600;

                    backdrop-filter: blur(10px);
                }

                .booking-item {
                    display: flex;
                    gap: 25px;

                    position: relative;

                    padding: 28px 10px 0 10px;
                }

                .booking-time {
                    min-width: 90px;

                    font-size: 14px;
                    font-weight: 700;

                    color: #2563eb;

                    padding-top: 10px;
                }

                .booking-line {
                    width: 4px;
                    background: linear-gradient(
                        to bottom,
                        #2563eb,
                        #60a5fa
                    );

                    border-radius: 999px;

                    position: relative;
                }

                .booking-line::before {
                    content: "";

                    position: absolute;

                    top: 8px;
                    left: 50%;

                    transform: translateX(-50%);

                    width: 16px;
                    height: 16px;

                    background: #2563eb;

                    border: 4px solid white;

                    border-radius: 50%;

                    box-shadow:
                        0 0 0 4px rgba(37,99,235,0.15);
                }

                .booking-card {
                    flex: 1;

                    background: white;

                    border-radius: 20px;

                    padding: 22px;

                    box-shadow:
                        0 8px 20px rgba(15, 23, 42, 0.06);

                    transition: all 0.25s ease;

                    border: 1px solid #e5e7eb;
                }

                .booking-card:hover {
                    transform: translateY(-3px);

                    box-shadow:
                        0 12px 28px rgba(15, 23, 42, 0.12);
                }

                .booking-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;

                    margin-bottom: 18px;
                }

                .transaction-code {
                    font-size: 20px;
                    font-weight: 700;
                    color: #0f172a;
                }

                .customer-name {
                    margin-top: 5px;

                    color: #64748b;

                    font-size: 14px;
                }

                .status-badge {
                    background: #dbeafe;
                    color: #1d4ed8;

                    padding: 8px 14px;

                    border-radius: 999px;

                    font-size: 12px;
                    font-weight: 700;

                    letter-spacing: 0.5px;
                }

                .booking-details {
                    display: flex;
                    gap: 25px;
                    flex-wrap: wrap;

                    font-size: 14px;

                    color: #334155;

                    margin-bottom: 15px;
                }

                .booking-notes {
                    background: #f8fafc;

                    border-left: 4px solid #2563eb;

                    padding: 14px 16px;

                    border-radius: 12px;

                    color: #475569;

                    font-size: 14px;

                    line-height: 1.5;
                }

            `;

            document.head.appendChild(style);
        }

        // 🔹 Backend gets technician from session
        const response = await fetch(
            `/api/tech-calendar/technician/0/calendar-bookings`
        );

        if (!response.ok) {
            throw new Error("Failed to fetch calendar");
        }

        const result = await response.json();

        const container =
            document.getElementById("calendarContainer");

        container.innerHTML = "";

        if (!result.data || result.data.length === 0) {

            container.innerHTML = `
                <div class="text-center py-5">

                    <h4>No Schedule Found</h4>

                    <p class="text-muted">
                        No assigned bookings yet.
                    </p>

                </div>
            `;

            return;
        }

        const grouped = {};

        result.data.forEach(item => {

            const rawDate = new Date(item.start);

            const key =
                rawDate.toISOString().split("T")[0];

            if (!grouped[key]) {
                grouped[key] = [];
            }

            grouped[key].push(item);

        });

        const sortedDates =
            Object.keys(grouped).sort();

        sortedDates.forEach(dateKey => {

            const bookings = grouped[dateKey];

            const dateObj = new Date(dateKey);

            const dayNumber =
                dateObj.getDate();

            const dayName =
                dateObj.toLocaleDateString("en-US", {
                    weekday: "long"
                });

            const fullDate =
                dateObj.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                });

            let bookingItems = "";

            bookings.sort((a, b) =>
                new Date(a.start) - new Date(b.start)
            );

            bookings.forEach(item => {

                const start =
                    new Date(item.start);

                const end =
                    new Date(item.end);

                const startTime =
                    start.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                    });

                const endTime =
                    end.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                    });

                bookingItems += `

                    <div class="booking-item">

                        <div class="booking-time">
                            ${startTime}
                        </div>

                        <div class="booking-line"></div>

                        <div class="booking-card">

                            <div class="booking-top">

                                <div>

                                    <div class="transaction-code">
                                        ${item.transaction_code ?? 'N/A'}
                                    </div>

                                    <div class="customer-name">
                                        ${item.customer_name ?? 'Unknown Customer'}
                                    </div>

                                </div>

                                <span class="status-badge">
                                    ${item.transaction_status ?? 'UNKNOWN'}
                                </span>

                            </div>

                            <div class="booking-details">

                                <div>
                                    <strong>Difficulty:</strong>
                                    ${item.difficulty ?? '-'}
                                </div>

                                <div>
                                    <strong>Estimated End:</strong>
                                    ${endTime}
                                </div>

                            </div>

                            ${item.notes
                        ? `
                                        <div class="booking-notes">
                                            ${item.notes}
                                        </div>
                                    `
                        : ""
                    }

                        </div>

                    </div>

                `;
            });

            container.innerHTML += `

                <div class="calendar-day">

                    <div class="calendar-date-header">

                        <div class="date-left">

                            <div class="day-number">
                                ${dayNumber}
                            </div>

                            <div class="date-info">

                                <div class="day-name">
                                    ${dayName}
                                </div>

                                <div class="full-date">
                                    ${fullDate}
                                </div>

                            </div>

                        </div>

                        <div class="booking-count">
                            ${bookings.length} Booking(s)
                        </div>

                    </div>

                    ${bookingItems}

                </div>

            `;
        });

    }
    catch (err) {

        console.error("Calendar Error:", err);

        document.getElementById("calendarContainer").innerHTML = `

            <div class="alert alert-danger">

                Failed to load technician calendar.

            </div>

        `;
    }
}

loadTechnicianCalendar();