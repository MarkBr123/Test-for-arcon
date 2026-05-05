using ARCon_Capstone_2.Data;
using ARCon_Capstone_2.DTOs;
using ARCon_Capstone_2.Models;
using Humanizer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Areas.Shop.Controllers;


[ApiController]
[Route("api/my-shop-services")]
public class Shop_ServicesApiController:ControllerBase
{
        public readonly ARCon_Capstone_2_DbContext _context;
    public Shop_ServicesApiController(ARCon_Capstone_2_DbContext context)
    { 
        _context = context;
    }


    //Get "For Confirmation Services
    [HttpGet("my-pending-services")]
    public async Task<IActionResult> GetMyPendingServices(
    int page = 1,
    int pageSize = 10,
    string sortBy = "latest"
)
    {
        var customerId = HttpContext.Session.GetInt32("UserId");
        var userType = HttpContext.Session.GetString("UserType");

        if (customerId == null || userType != "CUSTOMER")
        {
            return Unauthorized();
        }

        //  normalize inputs
        sortBy = sortBy?.ToLower();
        page = page < 1 ? 1 : page;
        pageSize = pageSize > 50 ? 50 : pageSize;

        var query = _context.service_bookings
            .Include(b => b.payment_transaction) //  join payment
            .Include(b => b.service_booking_items)
                .ThenInclude(i => i.services)
                    .ThenInclude(s => s.service_categories)
            .Include(b => b.service_booking_items)
                .ThenInclude(i => i.services)
                    .ThenInclude(s => s.service_aircon_type)
            .Where(b =>
                b.customer_id == customerId &&
                b.status == "PENDING"
            )
            .AsQueryable();

        //  SORTING (same as your frontend dropdown)
        query = sortBy switch
        {
            "priceasc" => query.OrderBy(b => b.total_amount),
            "pricedesc" => query.OrderByDescending(b => b.total_amount),
            "oldest" => query.OrderBy(b => b.created_at),
            _ => query.OrderByDescending(b => b.created_at) // latest
        };

        //  PAGINATION
        var totalCount = await query.CountAsync();

        var data = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(b => new
            {
                id = b.id,
                referenceCode = b.booking_ref_code,
                createdAt = b.created_at,
                status = b.status,

                scheduledDate = b.schedule_date,
                preferredTime = b.preferred_time,

                propertyType = b.property_type,
                businessName = b.business_name,

                // PAYMENT (proper logic)
                payment = new
                {
                    method = b.payment_transaction != null
                    ? b.payment_transaction.payment_method
                    : b.payment_method,

                                status = b.payment_status,
                                reference = b.payment_reference,

                                // NEW FIELD
                                paymongoStatus = b.payment_transaction != null &&
                                 b.payment_transaction.payment_method == "ONLINE_PAYMENT"
                    ? b.payment_transaction.paymongo_status
                    : null
                },

                totalAmount = b.total_amount,

                // ITEMS (preview like product UI)
                items = b.service_booking_items
                    .Select(i => new
                    {
                        serviceName = i.services != null && i.services.service_categories != null
                            ? i.services.service_categories.service_name
                            : null,

                        airconType = i.services != null && i.services.service_aircon_type != null
                            ? i.services.service_aircon_type.name
                            : null,

                        unitCount = i.unit_count,
                        price = i.price,
                        total = i.total_amount
                    })
                    .Take(2) // preview only
            })
            .ToListAsync();

        return Ok(new
        {
            totalCount,
            page,
            pageSize,
            data
        });
    }

    [HttpGet("my-processing-services")]
    public async Task<IActionResult> GetMyProcessingServices(
        int page = 1,
        int pageSize = 10,
        string sortBy = "latest"
    )
    {
        var customerId = HttpContext.Session.GetInt32("UserId");
        var userType = HttpContext.Session.GetString("UserType");

        if (customerId == null || userType != "CUSTOMER")
            return Unauthorized();

        // normalize inputs
        sortBy = sortBy?.ToLower();
        page = page < 1 ? 1 : page;
        pageSize = pageSize > 50 ? 50 : pageSize;

        var query = _context.service_bookings
            // ITEMS
            .Include(b => b.service_booking_items)
                .ThenInclude(i => i.services)
                    .ThenInclude(s => s.service_categories)
            .Include(b => b.service_booking_items)
                .ThenInclude(i => i.services)
                    .ThenInclude(s => s.service_aircon_type)

            // ADDRESS RELATIONS
            .Include(b => b.customer_addresses)
                .ThenInclude(a => a.barangay)
            .Include(b => b.customer_addresses)
                .ThenInclude(a => a.municipality)
            .Include(b => b.customer_addresses)
                .ThenInclude(a => a.province)
            .Include(b => b.customer_addresses)
                .ThenInclude(a => a.region)

            .Where(b =>
                b.customer_id == customerId &&
                b.status == "CONFIRMED"
            )
            .AsQueryable();

        // SORTING
        query = sortBy switch
        {
            "priceasc" => query.OrderBy(b => b.total_amount),
            "pricedesc" => query.OrderByDescending(b => b.total_amount),
            "oldest" => query.OrderBy(b => b.created_at),
            _ => query.OrderByDescending(b => b.created_at) // latest
        };

        // PAGINATION
        var totalCount = await query.CountAsync();

        var data = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(b => new
            {
                // BOOKING
                bookingId = b.id,
                bookingRefCode = b.booking_ref_code,
                createdAt = b.created_at,
                scheduledDate = b.schedule_date,
                preferredTime = b.preferred_time,
                bookingCreatedAt = b.created_at,
                status = b.status,
                totalAmount = b.total_amount,

                //  FULL ADDRESS (SAFE BUILD)
                address = b.customer_addresses != null
                    ? (b.customer_addresses.house_unit ?? "") + ", " +
                      (b.customer_addresses.street_name ?? "") + ", " +
                      (b.customer_addresses.barangay != null ? b.customer_addresses.barangay.barangay_name : "") + ", " +
                      (b.customer_addresses.municipality != null ? b.customer_addresses.municipality.municipality_name : "") + ", " +
                      (b.customer_addresses.province != null ? b.customer_addresses.province.province_name : "") + ", " +
                      (b.customer_addresses.region != null ? b.customer_addresses.region.region_name : "") + " " +
                      (b.customer_addresses.zip_code ?? "")
                    : null,

                //  SERVICES (BOOKED ITEMS)
                items = b.service_booking_items
                    .Select(i => new
                    {
                        serviceName = i.services != null && i.services.service_categories != null
                            ? i.services.service_categories.service_name
                            : null,

                        airconType = i.services != null && i.services.service_aircon_type != null
                            ? i.services.service_aircon_type.name
                            : null,

                        unitCount = i.unit_count,
                        price = i.price,
                        total = i.total_amount
                    })
                    .ToList()
            })
            .ToListAsync();

        return Ok(new
        {
            totalCount,
            page,
            pageSize,
            data
        });
    }



    [HttpGet("my-scheduled-services")]
    public async Task<IActionResult> GetMyForTechAssignmentServices(
    int page = 1,
    int pageSize = 10,
    string sortBy = "latest"
)
    {
        var customerId = HttpContext.Session.GetInt32("UserId");
        var userType = HttpContext.Session.GetString("UserType");

        if (customerId == null || userType != "CUSTOMER")
            return Unauthorized();

        //  normalize
        sortBy = sortBy?.ToLower();
        page = page < 1 ? 1 : page;
        pageSize = pageSize > 50 ? 50 : pageSize;

        var query = _context.service_bookings
            .Include(b => b.service_transactions)

            //  ADDRESS RELATIONS
            .Include(b => b.customer_addresses)
                .ThenInclude(a => a.barangay)
            .Include(b => b.customer_addresses)
                .ThenInclude(a => a.municipality)
            .Include(b => b.customer_addresses)
                .ThenInclude(a => a.province)
            .Include(b => b.customer_addresses)
                .ThenInclude(a => a.region)

            .Where(b =>
                b.customer_id == customerId &&
                b.status == "PROCESSING" &&

                //  MUST HAVE transaction FOR_TECH_ASSIGNMENT
                b.service_transactions.Any(t => t.status == "SCHEDULED")
            )
            .AsQueryable();

        //  SORTING
        query = sortBy switch
        {
            "priceasc" => query.OrderBy(b => b.total_amount),
            "pricedesc" => query.OrderByDescending(b => b.total_amount),
            "oldest" => query.OrderBy(b => b.created_at),
            _ => query.OrderByDescending(b => b.created_at)
        };

        var totalCount = await query.CountAsync();

        var data = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(b => new
            {
                // 🔹 BOOKING
                bookingId = b.id,
                bookingRefCode = b.booking_ref_code,
                status = b.status,
                totalAmount = b.total_amount,

                //  FULL ADDRESS
                address = b.customer_addresses != null
                    ? (b.customer_addresses.house_unit ?? "") + ", " +
                      (b.customer_addresses.street_name ?? "") + ", " +
                      (b.customer_addresses.barangay != null ? b.customer_addresses.barangay.barangay_name : "") + ", " +
                      (b.customer_addresses.municipality != null ? b.customer_addresses.municipality.municipality_name : "") + ", " +
                      (b.customer_addresses.province != null ? b.customer_addresses.province.province_name : "") + ", " +
                      (b.customer_addresses.region != null ? b.customer_addresses.region.region_name : "") + " " +
                      (b.customer_addresses.zip_code ?? "")
                    : null,

                //  TRANSACTION (FOR TECH ASSIGNMENT ONLY)
                transaction = b.service_transactions
                    .Where(t => t.status == "SCHEDULED")
                    .OrderByDescending(t => t.id)
                    .Select(t => new
                    {
                        transactionId = t.id,
                        transactionRefCode = t.st_ref_code,

                        scheduledDate = t.actual_scheduled_date,
                        scheduledTime = t.actual_scheduled_time,

                        status = t.status,

                        //  TECHNICIANS (likely empty at this stage)
                        technicians = _context.service_transaction_technicians
                            .Where(stt => stt.service_transaction_id == t.id && stt.isactiveservicetransac)
                            .Join(_context.admin_users,
                                stt => stt.technician_id,
                                au => au.id,
                                (stt, au) => new
                                {
                                    name = au.first_name + " " + au.last_name,
                                    contact = au.contact_no
                                })
                            .ToList()
                    })
                    .FirstOrDefault()
            })
            .ToListAsync();

        return Ok(new
        {
            totalCount,
            page,
            pageSize,
            data
        });
    }

    [HttpGet("my-completed-services")]
    public async Task<IActionResult> GetMyCompletedServices(
        int page = 1,
        int pageSize = 10,
        string sortBy = "latest"
    )
    {
        var customerId = HttpContext.Session.GetInt32("UserId");
        var userType = HttpContext.Session.GetString("UserType");

        if (customerId == null || userType != "CUSTOMER")
            return Unauthorized();

        // normalize
        sortBy = sortBy?.ToLower();
        page = page < 1 ? 1 : page;
        pageSize = pageSize > 50 ? 50 : pageSize;

        var query = _context.service_bookings

            // 🔥 INCLUDE ratings
            .Include(b => b.service_ratings)

            // address
            .Include(b => b.customer_addresses)
                .ThenInclude(a => a.barangay)
            .Include(b => b.customer_addresses)
                .ThenInclude(a => a.municipality)
            .Include(b => b.customer_addresses)
                .ThenInclude(a => a.province)
            .Include(b => b.customer_addresses)
                .ThenInclude(a => a.region)

            // transactions (for completion info only)
            .Include(b => b.service_transactions)

            .Where(b =>
                b.customer_id == customerId &&
                b.status == "COMPLETED" &&
                b.service_transactions.Any(t => t.status == "COMPLETED")
            )
            .AsQueryable();

        // Sortation
        query = sortBy switch
        {
            "priceasc" => query.OrderBy(b => b.total_amount),
            "pricedesc" => query.OrderByDescending(b => b.total_amount),
            "oldest" => query.OrderBy(b => b.created_at),
            _ => query.OrderByDescending(b => b.created_at)
        };

        var totalCount = await query.CountAsync();

        var data = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(b => new
            {
                bookingId = b.id,
                bookingRefCode = b.booking_ref_code,
                status = b.status,
                totalAmount = b.total_amount,

                // 📍 Address
                address = b.customer_addresses != null
                    ? (b.customer_addresses.house_unit ?? "") + ", " +
                      (b.customer_addresses.street_name ?? "") + ", " +
                      (b.customer_addresses.barangay != null ? b.customer_addresses.barangay.barangay_name : "") + ", " +
                      (b.customer_addresses.municipality != null ? b.customer_addresses.municipality.municipality_name : "") + ", " +
                      (b.customer_addresses.province != null ? b.customer_addresses.province.province_name : "") + ", " +
                      (b.customer_addresses.region != null ? b.customer_addresses.region.region_name : "") + " " +
                      (b.customer_addresses.zip_code ?? "")
                    : null,

                // ✅ Completed transaction info
                transaction = b.service_transactions
                    .Where(t => t.status == "COMPLETED")
                    .OrderByDescending(t => t.id)
                    .Select(t => new
                    {
                        transactionId = t.id,
                        transactionRefCode = t.st_ref_code,
                        completedDate = t.date_completed,
                        completedTime = t.time_completed,
                        status = t.status
                    })
                    .FirstOrDefault(),

                // ⭐ Rating (FROM BOOKING)
                rating = b.service_ratings
                    .Select(r => new
                    {
                        rating = r.rating,
                        comment = r.comment
                    })
                    .FirstOrDefault(),

                // 🔥 Simple flag for frontend
                isRated = b.service_ratings.Any()
            })
            .ToListAsync();

        return Ok(new
        {
            totalCount,
            page,
            pageSize,
            data
        });
    }

    //Partially Completed

    [HttpGet("my-partially-completed-services")]
    public async Task<IActionResult> GetMyPartiallyCompletedServices(
        int page = 1,
        int pageSize = 10,
        string sortBy = "latest"
    )
    {
        var customerId = HttpContext.Session.GetInt32("UserId");
        var userType = HttpContext.Session.GetString("UserType");

        if (customerId == null || userType != "CUSTOMER")
            return Unauthorized();

        // normalize
        sortBy = sortBy?.ToLower();
        page = page < 1 ? 1 : page;
        pageSize = pageSize > 50 ? 50 : pageSize;

        var query = _context.service_bookings
            .Include(b => b.service_transactions)

            // address
            .Include(b => b.customer_addresses)
                .ThenInclude(a => a.barangay)
            .Include(b => b.customer_addresses)
                .ThenInclude(a => a.municipality)
            .Include(b => b.customer_addresses)
                .ThenInclude(a => a.province)
            .Include(b => b.customer_addresses)
                .ThenInclude(a => a.region)

            .Where(b =>
                b.customer_id == customerId &&
                b.status == "PARTIALLY_COMPLETED" &&
                b.service_transactions.Any(t => t.status == "PARTIALLY_COMPLETED")
            )
            .AsQueryable();

        // Sorting
        query = sortBy switch
        {
            "priceasc" => query.OrderBy(b => b.total_amount),
            "pricedesc" => query.OrderByDescending(b => b.total_amount),
            "oldest" => query.OrderBy(b => b.created_at),
            _ => query.OrderByDescending(b => b.created_at)
        };

        var totalCount = await query.CountAsync();

        var data = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(b => new
            {
                bookingId = b.id,
                bookingRefCode = b.booking_ref_code,
                status = b.status,
                totalAmount = b.total_amount,

                // Address
                address = b.customer_addresses != null
                    ? (b.customer_addresses.house_unit ?? "") + ", " +
                      (b.customer_addresses.street_name ?? "") + ", " +
                      (b.customer_addresses.barangay != null ? b.customer_addresses.barangay.barangay_name : "") + ", " +
                      (b.customer_addresses.municipality != null ? b.customer_addresses.municipality.municipality_name : "") + ", " +
                      (b.customer_addresses.province != null ? b.customer_addresses.province.province_name : "") + ", " +
                      (b.customer_addresses.region != null ? b.customer_addresses.region.region_name : "") + " " +
                      (b.customer_addresses.zip_code ?? "")
                    : null,

                // Partially Completed Transaction
                transaction = b.service_transactions
                    .Where(t => t.status == "PARTIALLY_COMPLETED")
                    .OrderByDescending(t => t.partially_at)
                    .Select(t => new
                    {
                        transactionId = t.id,
                        transactionRefCode = t.st_ref_code,

                        // Split datetime properly
                        partiallyCompletedDate = t.partially_at,
                        partiallyCompletedTime = t.partially_at,

                        status = t.status,

                        //  YOUR ACTUAL FIELDS
                        reason = t.partially_completed_reason
                                 ?? "No reason provided"
                    })
                    .FirstOrDefault()
            })
            .ToListAsync();

        return Ok(new
        {
            totalCount,
            page,
            pageSize,
            data
        });
    }


    //Failed Service Transaction
    [HttpGet("my-failed-services")]
    public async Task<IActionResult> GetMyFailedServices(
        int page = 1,
        int pageSize = 10,
        string sortBy = "latest"
    )
    {
        var customerId = HttpContext.Session.GetInt32("UserId");
        var userType = HttpContext.Session.GetString("UserType");

        if (customerId == null || userType != "CUSTOMER")
            return Unauthorized();

        sortBy = sortBy?.ToLower();
        page = page < 1 ? 1 : page;
        pageSize = pageSize > 50 ? 50 : pageSize;

        var query = _context.service_bookings
            .Include(b => b.service_transactions)

            // address
            .Include(b => b.customer_addresses).ThenInclude(a => a.barangay)
            .Include(b => b.customer_addresses).ThenInclude(a => a.municipality)
            .Include(b => b.customer_addresses).ThenInclude(a => a.province)
            .Include(b => b.customer_addresses).ThenInclude(a => a.region)

            .Where(b =>
                b.customer_id == customerId &&
                (
                    b.status == "FAILED" ||
                    b.status == "FAILED_FOR_REFUND"
                ) &&
                b.service_transactions.Any(t =>
                    t.status == "FAILED" ||
                    t.status == "FAILED_FOR_REFUND"
                )
            )
            .AsQueryable();

        query = sortBy switch
        {
            "priceasc" => query.OrderBy(b => b.total_amount),
            "pricedesc" => query.OrderByDescending(b => b.total_amount),
            "oldest" => query.OrderBy(b => b.created_at),
            _ => query.OrderByDescending(b => b.created_at)
        };

        var totalCount = await query.CountAsync();

        var data = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(b => new
            {
                bookingId = b.id,
                bookingRefCode = b.booking_ref_code,
                status = b.status,
                totalAmount = b.total_amount,

                address = b.customer_addresses != null
                    ? (b.customer_addresses.house_unit ?? "") + ", " +
                      (b.customer_addresses.street_name ?? "") + ", " +
                      (b.customer_addresses.barangay != null ? b.customer_addresses.barangay.barangay_name : "") + ", " +
                      (b.customer_addresses.municipality != null ? b.customer_addresses.municipality.municipality_name : "") + ", " +
                      (b.customer_addresses.province != null ? b.customer_addresses.province.province_name : "") + ", " +
                      (b.customer_addresses.region != null ? b.customer_addresses.region.region_name : "") + " " +
                      (b.customer_addresses.zip_code ?? "")
                    : null,

                transaction = b.service_transactions
                    .Where(t =>
                        t.status == "FAILED" ||
                        t.status == "FAILED_FOR_REFUND"
                    )
                    .OrderByDescending(t => t.failed_at)
                    .Select(t => new
                    {
                        transactionId = t.id,
                        transactionRefCode = t.st_ref_code,

                        failedDate = t.failed_at,
                        failedTime = t.failed_at,

                        status = t.status,

                        reason = t.fail_reason ?? "No failure reason provided",

                        //  ADD THIS so frontend can detect refund
                        isRefund = t.status == "FAILED_FOR_REFUND"
                    })
                    .FirstOrDefault()
            })
            .ToListAsync();

        return Ok(new
        {
            totalCount,
            page,
            pageSize,
            data
        });
    }

    //cancelled
    [HttpGet("my-cancelled-services")]
    public async Task<IActionResult> GetMyCancelledServices(
    int page = 1,
    int pageSize = 10,
    string sortBy = "latest"
)
    {
        var customerId = HttpContext.Session.GetInt32("UserId");
        var userType = HttpContext.Session.GetString("UserType");

        if (customerId == null || userType != "CUSTOMER")
            return Unauthorized();

        sortBy = sortBy?.ToLower();
        page = page < 1 ? 1 : page;
        pageSize = pageSize > 50 ? 50 : pageSize;

        var query = _context.service_bookings
            .Include(b => b.service_transactions)

            // address
            .Include(b => b.customer_addresses).ThenInclude(a => a.barangay)
            .Include(b => b.customer_addresses).ThenInclude(a => a.municipality)
            .Include(b => b.customer_addresses).ThenInclude(a => a.province)
            .Include(b => b.customer_addresses).ThenInclude(a => a.region)

            .Where(b =>
                b.customer_id == customerId &&
                b.status == "CANCELLED" &&
                b.service_transactions.Any(t => t.status == "CANCELLED")
            )
            .AsQueryable();

        // same sorting pattern
        query = sortBy switch
        {
            "priceasc" => query.OrderBy(b => b.total_amount),
            "pricedesc" => query.OrderByDescending(b => b.total_amount),
            "oldest" => query.OrderBy(b => b.created_at),
            _ => query.OrderByDescending(b => b.created_at)
        };

        var totalCount = await query.CountAsync();

        var data = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(b => new
            {
                bookingId = b.id,
                bookingRefCode = b.booking_ref_code,
                status = b.status,
                totalAmount = b.total_amount,

                address = b.customer_addresses != null
                    ? (b.customer_addresses.house_unit ?? "") + ", " +
                      (b.customer_addresses.street_name ?? "") + ", " +
                      (b.customer_addresses.barangay != null ? b.customer_addresses.barangay.barangay_name : "") + ", " +
                      (b.customer_addresses.municipality != null ? b.customer_addresses.municipality.municipality_name : "") + ", " +
                      (b.customer_addresses.province != null ? b.customer_addresses.province.province_name : "") + ", " +
                      (b.customer_addresses.region != null ? b.customer_addresses.region.region_name : "") + " " +
                      (b.customer_addresses.zip_code ?? "")
                    : null,

                transaction = b.service_transactions
                    .Where(t => t.status == "CANCELLED")
                    .OrderByDescending(t => t.date_cancelled)
                    .Select(t => new
                    {
                        transactionId = t.id,
                        transactionRefCode = t.st_ref_code,

                        // REQUIRED FIELDS
                        cancelledDate = t.date_cancelled,
                        cancelledTime = t.date_cancelled,

                        status = t.status,

                        // REQUIRED FIELD
                        reason = t.cancellation_reason ?? "No cancellation reason provided"
                    })
                    .FirstOrDefault()
            })
            .ToListAsync();

        return Ok(new
        {
            totalCount,
            page,
            pageSize,
            data
        });
    }

    ///Customer Cancellation of service_bookings
    [HttpPut("customer/cancel/{id}")]
    public async Task<IActionResult> CustomerCancelBooking(int id, [FromBody] Customer_CancelBookingDto dto)
    {
        var customerId = HttpContext.Session.GetInt32("UserId");
        var userType = HttpContext.Session.GetString("UserType");

        if (customerId == null || userType != "CUSTOMER")
            return Unauthorized();

        var booking = await _context.service_bookings
            .FirstOrDefaultAsync(b => b.id == id && b.customer_id == customerId);

        if (booking == null)
            return NotFound(new { message = "Booking not found" });

        // ❌ already cancelled
        if (booking.status == "CANCELLED")
            return BadRequest(new { message = "Booking already cancelled" });

        // ❌ prevent cancelling completed/failed
        if (booking.status == "COMPLETED" || booking.status == "FAILED")
            return BadRequest(new { message = "This booking can no longer be cancelled" });

        // 🔥 PAYMENT RULE
        if (booking.payment_method == "ONLINE_PAYMENT" && booking.payment_status == "PAID")
        {
            booking.payment_status = "REFUND_PENDING";
        }

        // ✅ UPDATE
        booking.status = "CANCELLED";
        booking.date_cancelled = DateTime.UtcNow;
        booking.updated_at = DateTime.UtcNow;

        // ✅ TRACK WHO
        booking.cancelled_by = "CUSTOMER";
        booking.cancellation_reason = dto?.reason;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Booking cancelled successfully"
        });
    }


    [HttpGet("customer/stsummary/{bookingId}")]
    public async Task<IActionResult> GetCustomerServiceTransactionSummary(int bookingId)
    {
        var customerId = HttpContext.Session.GetInt32("UserId");
        var userType = HttpContext.Session.GetString("UserType");

        if (customerId == null || userType != "CUSTOMER")
            return Unauthorized();

        // ================= BOOKING =================
        var booking = await _context.service_bookings
            .Include(b => b.customer)
            .Include(b => b.payment_transaction)
            .Include(b => b.customer_addresses)
                .ThenInclude(a => a.barangay)
            .Include(b => b.customer_addresses)
                .ThenInclude(a => a.municipality)
            .Include(b => b.customer_addresses)
                .ThenInclude(a => a.province)
            .Include(b => b.customer_addresses)
                .ThenInclude(a => a.region)
            .Include(b => b.service_booking_items)
                .ThenInclude(i => i.services)
                    .ThenInclude(s => s.service_categories)
            .Include(b => b.service_booking_items)
                .ThenInclude(i => i.services)
                    .ThenInclude(s => s.service_aircon_type)
            .FirstOrDefaultAsync(b =>
                b.id == bookingId &&
                b.customer_id == customerId
            );

        if (booking == null)
            return NotFound(new { message = "Booking not found" });

        // ================= TRANSACTIONS =================
        var transactions = await _context.service_transactions
            .Where(t => t.service_booking.id == bookingId)
            .OrderBy(t => t.created_at)
            .Select(t => new
            {
                id = t.id,
                referenceCode = t.st_ref_code,
                status = t.status,
                createdAt = t.created_at,

                // 🔥 ADDED
                scheduledDate = t.actual_scheduled_date,
                scheduledTime = t.actual_scheduled_time,

                estimatedCompletionDate = t.estimated_completion_date,
                estimatedCompletionTime = t.estimated_completion_time,

                completedDate = t.date_completed,
                completedTime = t.time_completed,

                rating = t.service_rating,
                reserviceFee = t.reservice_fee,

                statusDetails = new
                {
                    isFailed = t.status == "FAILED",
                    failReason = t.fail_reason,
                    failedAt = t.failed_at,

                    isPartiallyCompleted = t.status == "PARTIALLY_COMPLETED",
                    partiallyReason = t.partially_completed_reason,
                    partiallyAt = t.partially_at,

                    isCancelled = t.status == "CANCELLED",
                    cancellationReason = t.cancellation_reason,
                    cancelledAt = t.date_cancelled,

                    isRefund = t.status == "FAILED_FOR_REFUND"
                }
            })
            .ToListAsync();

        // ================= ADDRESS =================
        var address = booking.customer_addresses != null
            ? $"{booking.customer_addresses.house_unit}, " +
              $"{booking.customer_addresses.street_name}, " +
              $"{booking.customer_addresses.barangay?.barangay_name}, " +
              $"{booking.customer_addresses.municipality?.municipality_name}, " +
              $"{booking.customer_addresses.province?.province_name}, " +
              $"{booking.customer_addresses.region?.region_name} " +
              $"{booking.customer_addresses.zip_code}"
            : null;

        // ================= RESPONSE =================
        var result = new
        {
            // 🔹 BOOKING
            booking = new
            {
                id = booking.id,
                referenceCode = booking.booking_ref_code,
                status = booking.status,
                createdAt = booking.created_at,

                scheduledDate = booking.schedule_date,
                preferredTime = booking.preferred_time,

                // 🔥 ADDED
                propertyType = booking.property_type,
                customerNote = booking.customer_note,
                businessName = booking.business_name,

                failureCount = booking.failure_count,
                partialCount = booking.partial_complete_count
            },

            // 🔹 CUSTOMER (🔥 ADDED)
            customer = new
            {
                name = (booking.customer.first_name ?? "") + " " +
                       (booking.customer.last_name ?? ""),
                contact = booking.customer.contact_no
            },

            // 🔹 PAYMENT
            payment = new
            {
                method = booking.payment_transaction != null
                    ? booking.payment_transaction.payment_method
                    : booking.payment_method,

                status = booking.payment_status
            },

            // 🔹 ADDRESS
            address,

            // 🔹 SUMMARY
            summary = new
            {
                totalServices = booking.service_booking_items.Count,
                totalUnits = booking.service_booking_items.Sum(i => i.unit_count),
                totalAmount = booking.service_booking_items.Sum(i => i.total_amount),

                totalReserviceFees = transactions.Sum(t => t.reserviceFee ?? 0)
            },

            // 🔹 ITEMS
            items = booking.service_booking_items.Select(i => new
            {
                serviceName = i.services.service_categories.service_name,
                airconType = i.services.service_aircon_type.name,
                unitCount = i.unit_count,
                price = i.price,
                total = i.total_amount
            }),

            // 🔥 FULL HISTORY
            transactions = transactions,

            // 🔥 LATEST
            latestTransaction = transactions
                .OrderByDescending(t => t.createdAt)
                .FirstOrDefault()
        };

        return Ok(result);
    }

    
}

