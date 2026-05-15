using ARCon_Capstone_2.Data;
using ARCon_Capstone_2.DTOs;
using ARCon_Capstone_2.Models;
using ARCon_Capstone_2.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ARCon_Capstone_2.Services;
using Humanizer;
using System.Text.Json;
using System.Reflection.Metadata;
using System.Security.Cryptography;
using System.Text;
using System.Net.Http.Headers;
using System.Text.Json.Nodes;
using ARCon_Capstone_2.Helpers.LalamoveHelpers;
using System.Data;
using NuGet.Protocol.Plugins;
using static System.Runtime.InteropServices.JavaScript.JSType;
namespace ARCon_Capstone_2.Areas.Admin.Controllers;


[ApiController]
[Route("api/service-transactions")]
public class ServiceTransactionApiController : ControllerBase
{
    public readonly ARCon_Capstone_2_DbContext _context;

    public ServiceTransactionApiController(ARCon_Capstone_2_DbContext context)
    {
        _context = context;
    }


    //Parent Row
    ///Display status = Pending
    [HttpGet("for-confimation-services")]

    public async Task<IActionResult> GetForConfirmationServices(int page = 1, int pageSize = 24, string sortBy = "createdAt", string sortDir = "desc", string? search = null)
    {
        var query = _context.service_bookings
            .Include(b => b.customer)
            .AsQueryable();

        query = query.Where(b => b.status == "PENDING" || b.status == "PARTIALLY_COMPLETED" || b.status == "FAILED" || b.status == "FAILED_FOR_REFUND");

        //Search

        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.Trim().ToLower();

            query = query.Where(b =>
                 EF.Functions.ILike(b.booking_ref_code ?? "", $"%{search}%") ||
                 EF.Functions.ILike(b.customer.first_name ?? "", $"%{search}%") ||
                EF.Functions.ILike(b.customer.last_name ?? "", $"%{search}%")
            );
        }

        bool asc = sortDir.ToLower() == "asc";
        query = sortBy switch
        {
            "referenceCode" => asc
                ? query.OrderBy(b => b.booking_ref_code)
                : query.OrderByDescending(b => b.booking_ref_code),

            "customerName" => asc
                ? query.OrderBy(b => b.customer.first_name)
                : query.OrderByDescending(b => b.customer.first_name),
            "businessName" => asc
               ? query.OrderBy(b => b.business_name)
               : query.OrderByDescending(b => b.business_name),

            "scheduledDate" => asc
                ? query.OrderBy(b => b.schedule_date)
                : query.OrderByDescending(b => b.schedule_date),

            "preferredTime" => asc
                ? query.OrderBy(b => b.preferred_time)
                : query.OrderByDescending(b => b.preferred_time),

            "paymentMethod" => asc
                ? query.OrderBy(b => b.payment_method)
                : query.OrderByDescending(b => b.payment_method),

            "totalAmount" => asc
                ? query.OrderBy(b => b.total_amount)
                : query.OrderByDescending(b => b.total_amount),

            "propertyType" => asc
                ? query.OrderBy(b => b.property_type)
                : query.OrderByDescending(b => b.property_type),

            _ => asc
                ? query.OrderBy(b => b.created_at)
                : query.OrderByDescending(b => b.created_at)
        };

        // 📄 Pagination
        var totalCount = await query.CountAsync();

        var data = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(b => new
            {
                id = b.id,
                failure_count = b.failure_count,
                referenceCode = b.booking_ref_code,
                customerName = b.customer.first_name + " " + b.customer.last_name,
                businessName = b.business_name,
                scheduledDate = b.schedule_date,
                preferredTime = b.preferred_time,
                paymentMethod = b.payment_method,
                totalAmount = b.total_amount,
                propertyType = b.property_type,
                placedAt = b.created_at,
                status = b.status
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

    // Child Row
    [HttpGet("{bookingId}/items")]
    public async Task<IActionResult> GetBookingItems(int bookingId)
    {
        var items = await _context.service_booking_items
            .Where(x => x.service_bookings_id == bookingId)
            .Include(x => x.services)
            .Select(x => new
            {
                serviceName = x.services.service_categories.service_name,
                acType = x.services.service_aircon_type.name,
                unitCount = x.unit_count,
                unit = x.unit,
                brand = x.unit_brand,
                capacity = x.capacity_range,
                price = x.price,
                total = x.total_amount
            })
            .ToListAsync();

        return Ok(items);
    }


    ///pending-summary
    [HttpGet("pending-summary/{id}")]
    public async Task<IActionResult> GetPendingSummary(int id)
    {
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
            .FirstOrDefaultAsync(b => b.id == id);

        if (booking == null)
            return NotFound("Booking not found");

        try
        {
            // ADDRESS 
            var address = booking.customer_addresses != null
                ? $"{booking.customer_addresses.house_unit}, " +
                  $"{booking.customer_addresses.street_name}, " +
                  $"{booking.customer_addresses.barangay?.barangay_name}, " +
                  $"{booking.customer_addresses.municipality?.municipality_name}, " +
                  $"{booking.customer_addresses.province?.province_name}, " +
                  $"{booking.customer_addresses.region?.region_name} " +
                  $"{booking.customer_addresses.zip_code}"
                : null;

            // SERVICE TRANSACTIONS (ALL) 
            var serviceTransactions = await _context.service_transactions
                .Where(t => t.service_booking_id == id)
                .OrderByDescending(t => t.created_at)
                .Select(t => new
                {
                    id = t.id,
                    referenceCode = t.st_ref_code,
                    status = t.status,
                    createdAt = t.created_at,
                    serviceTry = t.service_tries,

                    // optional (very useful for UI)
                    failedAt = t.failed_at,
                    partiallyAt = t.partially_at,
                    completedDate = t.date_completed,
                    completedTime = t.time_completed
                })
                .ToListAsync();

            //  RESULT 
            var result = new
            {
                id = booking.id,
                failure_count = booking.failure_count,
                referenceCode = booking.booking_ref_code,
                createdAt = booking.created_at,
                status = booking.status,
                scheduledDate = booking.schedule_date,
                preferredTime = booking.preferred_time,
                propertyType = booking.property_type,
                customerNote = booking.customer_note,
                businessName = booking.business_name,

                // ALL SERVICE TRANSACTIONS, if there is any
                serviceTransactions = serviceTransactions,

                payment = new
                {
                    method = booking.payment_transaction != null
                        ? booking.payment_transaction.payment_method
                        : booking.payment_method,

                    status = booking.payment_status,
                    reference = booking.payment_reference
                },

                customer = new
                {
                    name = (booking.customer?.first_name ?? "") + " " +
                           (booking.customer?.last_name ?? ""),
                    contact = booking.customer?.contact_no
                },

                deliveryAddress = address,

                summary = new
                {
                    totalServices = booking.service_booking_items?.Count ?? 0,
                    totalUnits = booking.service_booking_items?.Sum(i => i.unit_count) ?? 0,
                    totalAmount = booking.service_booking_items?.Sum(i => i.total_amount) ?? 0
                },

                items = booking.service_booking_items?.Select(i => new
                {
                    id = i.id,
                    serviceName = i.services?.service_categories.service_name,
                    airconType = i.services?.service_aircon_type?.name,
                    unitCount = i.unit_count,
                    unit = i.unit,
                    capacity = i.capacity_range,
                    brand = i.unit_brand,
                    price = i.price,
                    total = i.total_amount
                })
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            var fullError = ex.InnerException?.Message ?? ex.Message;

            Console.WriteLine("========== FULL ERROR ==========");
            Console.WriteLine(ex.ToString());
            Console.WriteLine("================================");

            return StatusCode(500, new
            {
                message = fullError,
                error = ex.Message
            });
        }
    }

    /// Confirm For_Confirmation Service Transaction
    [HttpPut("confirm/{id}")]
    public async Task<IActionResult> ConfirmBooking(int id)
    {
        var booking = await _context.service_bookings
            .FirstOrDefaultAsync(b => b.id == id);

        if (booking == null)
            return NotFound(new { message = "Booking not found" });

        // BUSINESS RULE
        //if online payment, payment is required before confirming
        if (booking.payment_method == "ONLINE_PAYMENT" && booking.payment_status != "PAID")
        {
            return BadRequest(new
            {
                message = "Cannot confirm unpaid online booking"
            });
        }

        //prevent double confirm
        if (booking.status == "CONFIRMED")
            return BadRequest(new { message = "Already confirmed" });

        //update status
        booking.status = "CONFIRMED";
        booking.date_confirmed = DateTime.UtcNow;
        booking.updated_at = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Booking confirmed successfully",
            bookingId = booking.id
        });
    }

    /// Rejected Booking
    [HttpPut("reject/{id}")]
    public async Task<IActionResult> RejectBooking(int id)
    {
        var booking = await _context.service_bookings
            .FirstOrDefaultAsync(b => b.id == id);

        if (booking == null)
            return NotFound(new { message = "Booking not found" });

        // Optional: mark refund needed
        if (booking.payment_method == "ONLINE_PAYMENT" && booking.payment_status == "PAID")
        {
            booking.payment_status = "REFUND_PENDING";
        }

        if (booking.status == "REJECTED")
        {
            return BadRequest(new { message = "Booking already rejected" });
        }

        booking.status = "REJECTED";
        booking.date_rejected = DateTime.UtcNow;
        booking.updated_at = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Booking rejected successfully"
        });
    }



    /// Cancelled Booking
    [HttpPut("cancel/{id}")]
    public async Task<IActionResult> CancelBooking(int id)
    {
        var booking = await _context.service_bookings
            .FirstOrDefaultAsync(b => b.id == id);

        if (booking == null)
            return NotFound(new { message = "Booking not found" });

        // BLOCK REJECTION IF PAID ONLINE
        if (booking.payment_method == "ONLINE_PAYMENT" && booking.payment_status == "PAID")
        {
            booking.payment_status = "REFUND_PENDING";
        }


        if (booking.status == "CANCELLED")
        {
            return BadRequest(new { message = "Booking already cancelled" });
        }

        booking.status = "CANCELLED";
        booking.date_cancelled = DateTime.UtcNow;
        booking.cancelled_by = "ADMIN";
        booking.updated_at = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Booking cancelled successfully"
        });
    }




    ///Display status = Confirmed
    [HttpGet("processing-services")]

    public async Task<IActionResult> GetProcessingServices(int page = 1, int pageSize = 24, string sortBy = "createdAt", string sortDir = "desc", string? search = null)
    {
        var query = _context.service_bookings
            .Include(b => b.customer)
            .AsQueryable();

        query = query.Where(b => b.status == "CONFIRMED" || b.status == "APPROVED_FOR_WARRANTY");

        //Search

        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.Trim().ToLower();

            query = query.Where(b =>
                 EF.Functions.ILike(b.booking_ref_code ?? "", $"%{search}%") ||
                 EF.Functions.ILike(b.customer.first_name ?? "", $"%{search}%") ||
                EF.Functions.ILike(b.customer.last_name ?? "", $"%{search}%")
            );
        }

        bool asc = sortDir.ToLower() == "asc";
        query = sortBy switch
        {
            "referenceCode" => asc
                ? query.OrderBy(b => b.booking_ref_code)
                : query.OrderByDescending(b => b.booking_ref_code),

            "customerName" => asc
                ? query.OrderBy(b => b.customer.first_name)
                : query.OrderByDescending(b => b.customer.first_name),
            "businessName" => asc
               ? query.OrderBy(b => b.business_name)
               : query.OrderByDescending(b => b.business_name),

            "scheduledDate" => asc
                ? query.OrderBy(b => b.schedule_date)
                : query.OrderByDescending(b => b.schedule_date),

            "preferredTime" => asc
                ? query.OrderBy(b => b.preferred_time)
                : query.OrderByDescending(b => b.preferred_time),

            "paymentMethod" => asc
                ? query.OrderBy(b => b.payment_method)
                : query.OrderByDescending(b => b.payment_method),

            "totalAmount" => asc
                ? query.OrderBy(b => b.total_amount)
                : query.OrderByDescending(b => b.total_amount),

            "propertyType" => asc
                ? query.OrderBy(b => b.property_type)
                : query.OrderByDescending(b => b.property_type),

            "confirmedAt" => asc
               ? query.OrderBy(b => b.date_confirmed)
               : query.OrderByDescending(b => b.date_confirmed),

            _ => asc
                ? query.OrderBy(b => b.created_at)
                : query.OrderByDescending(b => b.created_at),


        };

        // 📄 Pagination
        var totalCount = await query.CountAsync();

        var data = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(b => new
            {
                id = b.id,
                failure_count = b.failure_count,
                referenceCode = b.booking_ref_code,
                customerName = b.customer.first_name + " " + b.customer.last_name,
                businessName = b.business_name,
                scheduledDate = b.schedule_date,
                preferredTime = b.preferred_time,
                contactNo = b.customer.contact_no,
                paymentMethod = b.payment_method,
                totalAmount = b.total_amount,
                propertyType = b.property_type,
                placedAt = b.created_at,
                confirmedAt = b.date_confirmed,
                status = b.status
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


    /// This is the create service_transaction
    [HttpPost("create-service-transaction")]

    public async Task<IActionResult> CreateServiceTransaction([FromBody] AddServiceTransactionDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);


        // 🔹 Combine scheduled date + time
        var scheduled = dto.ActualSchedDate.ToDateTime(
            TimeOnly.FromTimeSpan(dto.ActualSchedTime)
        );

        var now = DateTime.Now;

        // 🔹 1. Check if scheduled is in the past
        if (scheduled < now)
        {
            return BadRequest("Scheduled date/time cannot be in the past.");
        }
        else
        {
            // 🔹 2. Check estimated ONLY if both provided
            var estimated = dto.EstimatedCompletionDate.ToDateTime(
                TimeOnly.FromTimeSpan(dto.EstimatedCompletionTime)
            );

            if (estimated <= scheduled)
            {
                return BadRequest("Estimated completion must be after scheduled time.");
            }
        }

        if (dto.ReserviceFee < 0)
        {
            return BadRequest("Reservice fee must be equal or greater than 0.");
        }

        // 🔹 Remove duplicates (optional but recommended)
        var itemIds = dto.Items
            .Select(i => i.ServiceBookingItemsId)
            .Distinct()
            .ToList();

        // 🔹 Check if items belong to the booking
        var validItemIds = await _context.service_booking_items
            .Where(i => i.service_bookings_id == dto.ServiceBookingId)
            .Select(i => i.id)
            .ToListAsync();

        var invalidItems = itemIds
            .Where(id => !validItemIds.Contains(id))
            .ToList();

        if (invalidItems.Any())
            return BadRequest("Some items do not belong to this booking.");

        //3. BEGIN DB TRANSACTION       
        using var tx = await _context.Database.BeginTransactionAsync();

        try
        {

            //this will count the number or service_transaction tries for this service_bookings
            var tries = await _context.service_transactions
                    .CountAsync(t => t.service_booking_id == dto.ServiceBookingId);

            //this will generate reference code
            var serviceTransac_RefCode = GenerateServiceTransactionRefCode();



            // 4. CREATE TRANSACTION

            var transaction = new service_transaction
            {
                service_booking_id = dto.ServiceBookingId,
                st_ref_code = serviceTransac_RefCode,

                no_technicians_req = dto.NumTechniciansReq,
                difficulty_rate = dto.DifficultyRate,

                parts_needed = dto.PartsNeeded,
                tools_need = dto.ToolsNeeded,

                actual_scheduled_date = dto.ActualSchedDate,
                actual_scheduled_time = dto.ActualSchedTime,
                service_tries = tries + 1,
                estimated_completion_date = dto.EstimatedCompletionDate,
                estimated_completion_time = dto.EstimatedCompletionTime,

                reservice_fee = dto.ReserviceFee,
                notes_to_technicians = dto.NoteToTechnicians,

                status = "FOR_TECH_ASSIGNMENT".ToUpper(),
                st_type = "NORMAL"

            };

            _context.service_transactions.Add(transaction);
            await _context.SaveChangesAsync();

            //CREATE ITEMS

            var items = itemIds.Select(id => new service_transaction_item
            {
                service_transaction_id = transaction.id,
                service_booking_items_id = id,
            }).ToList();

            _context.service_transaction_items.AddRange(items);
            await _context.SaveChangesAsync();

            /// CHANGE THE SERVICe_Booking status to "PROCESSING"
            /// UPDATE BOOKING STATUS
            /// 
            var booking = await _context.service_bookings
                .FirstOrDefaultAsync(b => b.id == dto.ServiceBookingId);

            if (booking != null)
            {
                booking.status = "PROCESSING".ToUpper();
                booking.updated_at = DateTime.UtcNow;
                _context.service_bookings.Update(booking);
                await _context.SaveChangesAsync();
            }

            await tx.CommitAsync();

            return Ok(new
            {
                message = "Service transaction created successfully.",
                transactionId = transaction.id,
                referenceCode = transaction.st_ref_code
            });
        }
        catch (Exception ex)
        {
            await tx.RollbackAsync();
            var fullError = ex.InnerException?.Message ?? ex.Message;

            Console.WriteLine("========== FULL ERROR ==========");
            Console.WriteLine(ex.ToString());
            Console.WriteLine("================================");

            return StatusCode(500, new
            {
                message = fullError,
                error = ex.Message
            });
        }
    }

    //// Get The Service_Transaction with status = FOR_TECH_ASSIGNMENT
    [HttpGet("tech-assign-services")]
    public async Task<IActionResult> GetTechAssignServices(
        int page = 1,
        int pageSize = 24,
        string sortBy = "createdAt",
        string sortDir = "desc",
        string? search = null)
    {
        var query = _context.service_transactions
            .AsNoTracking()
            .Include(st => st.service_booking)
                .ThenInclude(sb => sb.customer)
            .Include(st => st.service_transaction_technicians)
            .Where(st => st.status == "FOR_TECH_ASSIGNMENT")
            .AsQueryable();

        // 🔍 SEARCH
        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.Trim();

            query = query.Where(st =>
                EF.Functions.ILike(st.st_ref_code ?? "", $"%{search}%") ||
                EF.Functions.ILike(st.service_booking.booking_ref_code ?? "", $"%{search}%") ||
                EF.Functions.ILike(st.service_booking.customer.first_name ?? "", $"%{search}%") ||
                EF.Functions.ILike(st.service_booking.customer.last_name ?? "", $"%{search}%")
            );
        }

        // 🔽 SORTING
        bool asc = sortDir == "asc";

        query = sortBy switch
        {
            "stRefCode" => asc
                ? query.OrderBy(st => st.st_ref_code)
                : query.OrderByDescending(st => st.st_ref_code),

            "serviceBookingRefCode" => asc
            ? query.OrderBy(st => st.service_booking.booking_ref_code)
            : query.OrderByDescending(st => st.service_booking.booking_ref_code),

            "customerName" => asc
                ? query.OrderBy(st => st.service_booking.customer.first_name)
                    .ThenBy(st => st.service_booking.customer.last_name)
                : query.OrderByDescending(st => st.service_booking.customer.first_name)
                    .ThenByDescending(st => st.service_booking.customer.last_name),

            "actualScheduledDate" => asc
                ? query.OrderBy(st => st.actual_scheduled_date)
                : query.OrderByDescending(st => st.actual_scheduled_date),

            "actualScheduledTime" => asc
                ? query.OrderBy(st => st.actual_scheduled_time)
                : query.OrderByDescending(st => st.actual_scheduled_time),

            "estimatedCompletionDate" => asc
                ? query.OrderBy(st => st.estimated_completion_date)
                : query.OrderByDescending(st => st.estimated_completion_date),

            "estimatedCompletionTime" => asc
                ? query.OrderBy(st => st.estimated_completion_date)
                : query.OrderByDescending(st => st.estimated_completion_time),

            "noOfTechnicians" => asc
                ? query.OrderBy(st => st.no_technicians_req)
                : query.OrderByDescending(st => st.no_technicians_req),

            "difficultyRate" => asc
                ? query.OrderBy(st => st.difficulty_rate)
                : query.OrderByDescending(st => st.difficulty_rate),

            _ => asc
                ? query.OrderBy(st => st.created_at)
                : query.OrderByDescending(st => st.created_at)
        };

        // 📄 PAGINATION
        var totalCount = await query.CountAsync();

        var data = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(st => new
            {
                bookingId = st.service_booking_id,
                id = st.id,
                stRefCode = st.st_ref_code,

                bookingRefCode = st.service_booking.booking_ref_code,
                customerName = st.service_booking.customer.first_name + " " + st.service_booking.customer.last_name,
                businessName = st.service_booking.business_name,

                actualScheduledDate = st.actual_scheduled_date,
                actualScheduledTime = st.actual_scheduled_time,

                estimatedCompletionDate = st.estimated_completion_date,
                estimatedCompletionTime = st.estimated_completion_time,

                techniciansRequired = st.no_technicians_req,
                assignedTechnicians = st.service_transaction_technicians.Count(),

                difficultyRate = st.difficulty_rate,
                propertyType = st.service_booking.property_type,

                createdAt = st.created_at,
                status = st.status
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


    ///// Get service_transaction status = SCHEDULED
    [HttpGet("scheduled")]
    public async Task<IActionResult> GetScheduledServices(
        int page = 1,
        int pageSize = 24,
        string sortBy = "createdAt",
        string sortDir = "desc",
        string? search = null)
    {
        var query = _context.service_transactions
            .AsNoTracking()
            .Include(st => st.service_booking)
                .ThenInclude(sb => sb.customer)
            .Include(st => st.service_transaction_technicians)
            .Where(st => st.status == "SCHEDULED".ToUpper() || st.status == "ONGOING".ToUpper())
            .AsQueryable();

        // 🔍 SEARCH
        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.Trim();

            query = query.Where(st =>
                EF.Functions.ILike(st.st_ref_code ?? "", $"%{search}%") ||
                EF.Functions.ILike(st.service_booking.booking_ref_code ?? "", $"%{search}%") ||
                EF.Functions.ILike(st.service_booking.customer.first_name ?? "", $"%{search}%") ||
                EF.Functions.ILike(st.service_booking.customer.last_name ?? "", $"%{search}%")
            );
        }

        // 🔽 SORTING
        bool asc = sortDir == "asc";

        query = sortBy switch
        {
            "stRefCode" => asc
                ? query.OrderBy(st => st.st_ref_code)
                : query.OrderByDescending(st => st.st_ref_code),

            "serviceBookingRefCode" => asc
            ? query.OrderBy(st => st.service_booking.booking_ref_code)
            : query.OrderByDescending(st => st.service_booking.booking_ref_code),

            "customerName" => asc
                ? query.OrderBy(st => st.service_booking.customer.first_name)
                    .ThenBy(st => st.service_booking.customer.last_name)
                : query.OrderByDescending(st => st.service_booking.customer.first_name)
                    .ThenByDescending(st => st.service_booking.customer.last_name),

            "actualScheduledDate" => asc
                ? query.OrderBy(st => st.actual_scheduled_date)
                : query.OrderByDescending(st => st.actual_scheduled_date),

            "actualScheduledTime" => asc
                ? query.OrderBy(st => st.actual_scheduled_time)
                : query.OrderByDescending(st => st.actual_scheduled_time),

            "estimatedCompletionDate" => asc
                ? query.OrderBy(st => st.estimated_completion_date)
                : query.OrderByDescending(st => st.estimated_completion_date),

            "estimatedCompletionTime" => asc
                ? query.OrderBy(st => st.estimated_completion_time)
                : query.OrderByDescending(st => st.estimated_completion_time),

            "noOfTechnicians" => asc
                ? query.OrderBy(st => st.no_technicians_req)
                : query.OrderByDescending(st => st.no_technicians_req),

            "difficultyRate" => asc
                ? query.OrderBy(st => st.difficulty_rate)
                : query.OrderByDescending(st => st.difficulty_rate),

            _ => asc
                ? query.OrderBy(st => st.created_at)
                : query.OrderByDescending(st => st.created_at)
        };

        //PAGINATION
        var totalCount = await query.CountAsync();

        var data = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(st => new
            {
                bookingId = st.service_booking_id,
                id = st.id,
                stRefCode = st.st_ref_code,
                paymentMethod = st.service_booking.payment_method,
                paymentStatus = st.service_booking.payment_status,
                bookingRefCode = st.service_booking.booking_ref_code,
                customerName = st.service_booking.customer.first_name + " " + st.service_booking.customer.last_name,
                businessName = st.service_booking.business_name,
                totalAmount = st.service_booking.total_amount,
                actualScheduledDate = st.actual_scheduled_date,
                actualScheduledTime = st.actual_scheduled_time,

                estimatedCompletionDate = st.estimated_completion_date,
                estimatedCompletionTime = st.estimated_completion_time,

                techniciansRequired = st.no_technicians_req,
                assignedTechnicians = st.service_transaction_technicians.Count(),

                difficultyRate = st.difficulty_rate,
                propertyType = st.service_booking.property_type,

                createdAt = st.created_at,
                status = st.status
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



    ////////////////////////////////////////////////////////// This is the Service Booking and Service Transaction Master Summary /////////////////////////////////////////////////
    ///service-transaction-summary/{id}
    [HttpGet("stsummary/{id}")]
    public async Task<IActionResult> GetServiceTransactionSummary(int id)
    {
        var transaction = await _context.service_transactions
            .Include(t => t.service_booking)
                .ThenInclude(b => b.customer)
            .Include(t => t.service_booking)
                .ThenInclude(b => b.payment_transaction)
            .Include(t => t.service_booking)
                .ThenInclude(b => b.customer_addresses)
                    .ThenInclude(a => a.barangay)
            .Include(t => t.service_booking)
                .ThenInclude(b => b.customer_addresses)
                    .ThenInclude(a => a.municipality)
            .Include(t => t.service_booking)
                .ThenInclude(b => b.customer_addresses)
                    .ThenInclude(a => a.province)
            .Include(t => t.service_booking)
                .ThenInclude(b => b.customer_addresses)
                    .ThenInclude(a => a.region)
            .Include(t => t.service_booking)
                .ThenInclude(b => b.service_booking_items)
                    .ThenInclude(i => i.services)
                        .ThenInclude(s => s.service_categories)
            .Include(t => t.service_booking)
                .ThenInclude(b => b.service_booking_items)
                    .ThenInclude(i => i.services)
                        .ThenInclude(s => s.service_aircon_type)
            .FirstOrDefaultAsync(t => t.id == id);

        if (transaction == null)
            return NotFound(new { message = "Service transaction not found" });

        try
        {
            var booking = transaction.service_booking;

            var address = booking?.customer_addresses != null
                ? $"{booking.customer_addresses.house_unit}, " +
                  $"{booking.customer_addresses.street_name}, " +
                  $"{booking.customer_addresses.barangay?.barangay_name}, " +
                  $"{booking.customer_addresses.municipality?.municipality_name}, " +
                  $"{booking.customer_addresses.province?.province_name}, " +
                  $"{booking.customer_addresses.region?.region_name} " +
                  $"{booking.customer_addresses.zip_code}"
                : null;

            var result = new
            {
                // ================= TRANSACTION =================
                transaction = new
                {
                    id = transaction.id,
                    referenceCode = transaction.st_ref_code,
                    status = transaction.status,
                    createdAt = transaction.created_at,

                    noTechnicians = transaction.no_technicians_req,
                    difficulty = transaction.difficulty_rate,

                    scheduledDate = transaction.actual_scheduled_date,
                    scheduledTime = transaction.actual_scheduled_time,

                    estimatedCompletionDate = transaction.estimated_completion_date,
                    estimatedCompletionTime = transaction.estimated_completion_time,

                    completedDate = transaction.date_completed,
                    completedTime = transaction.time_completed,

                    partsNeeded = transaction.parts_needed,
                    toolsNeeded = transaction.tools_need,

                    rating = transaction.service_rating,
                    isCustomerAgreed = transaction.iscustomeragreed,
                    notes = transaction.notes_to_technicians,
                    st_type = transaction.st_type,
                    dateCompleted = transaction.date_completed,


                    // ================= CANCEL =================
                    cancelledAt = transaction.date_cancelled,
                    cancellationReason = transaction.cancellation_reason,

                    // ================= 🔥 STATUS DETAILS (ADDED) =================
                    statusDetails = new
                    {
                        isFailed = transaction.status == "FAILED",
                        failReason = transaction.fail_reason,
                        failedAt = transaction.failed_at,

                        isPartiallyCompleted = transaction.status == "PARTIALLY_COMPLETED",
                        partiallyReason = transaction.partially_completed_reason,
                        partiallyAt = transaction.partially_at,


                        failedForRefund = transaction.status == "FAILED_FOR_REFUND",
                    },

                    // ================= REBOOK =================
                    isRebooked = transaction.isrebooked,
                    rebookingReason = transaction.rebooking_reason,
                    rebookedAt = transaction.rebooked_at,

                    serviceTries = transaction.service_tries,
                    reserviceFee = transaction.reservice_fee,

                    // ================= TECHNICIANS =================
                    assignedTechnicians = _context.service_transaction_technicians
                        .Where(stt => stt.service_transaction_id == transaction.id && stt.isactiveservicetransac)
                        .Join(_context.admin_users,
                            stt => stt.technician_id,
                            au => au.id,
                            (stt, au) => new
                            {
                                technicianId = au.id,
                                name = au.first_name + " " + au.last_name,
                                contact = au.contact_no,
                                email = au.email_address,
                                isOnline = au.is_online
                            })
                        .ToList()
                },

                // ================= BOOKING =================
                booking = new
                {
                    id = booking?.id,
                    referenceCode = booking?.booking_ref_code,
                    createdAt = booking?.created_at,
                    status = booking?.status,

                    failureCount = booking?.failure_count,
                    partialCount = booking?.partial_complete_count,

                    scheduledDate = booking?.schedule_date,
                    preferredTime = booking?.preferred_time,

                    propertyType = booking?.property_type,
                    customerNote = booking?.customer_note,
                    businessName = booking?.business_name
                },

                // ================= PAYMENT =================
                payment = new
                {
                    method = booking?.payment_transaction != null
                        ? booking.payment_transaction.payment_method
                        : booking?.payment_method,

                    status = booking?.payment_status,
                    reference = booking?.payment_reference
                },

                // ================= CUSTOMER =================
                customer = new
                {
                    name = (booking?.customer?.first_name ?? "") + " " +
                           (booking?.customer?.last_name ?? ""),
                    contact = booking?.customer?.contact_no
                },

                // ================= ADDRESS =================
                deliveryAddress = address,

                // ================= SUMMARY =================
                summary = new
                {
                    totalServices = booking?.service_booking_items?.Count ?? 0,
                    totalUnits = booking?.service_booking_items?.Sum(i => i.unit_count) ?? 0,
                    totalAmount = booking?.service_booking_items?.Sum(i => i.total_amount) ?? 0
                },

                // ================= ITEMS =================
                items = booking?.service_booking_items?.Select(i => new
                {
                    id = i.id,
                    serviceName = i.services?.service_categories.service_name,
                    airconType = i.services?.service_aircon_type?.name,
                    unitCount = i.unit_count,
                    unit = i.unit,
                    capacity = i.capacity_range,
                    brand = i.unit_brand,
                    price = i.price,
                    total = i.total_amount
                })
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            var fullError = ex.InnerException?.Message ?? ex.Message;

            Console.WriteLine("========== FULL ERROR ==========");
            Console.WriteLine(ex.ToString());
            Console.WriteLine("================================");

            return StatusCode(500, new
            {
                message = "Error retrieving service transaction summary",
                error = fullError
            });
        }
    }

    ////////////////////////////////////////////////////////// (END)  This is the Service Booking and Service Transaction Master Summary /////////////////////////////////////////////////
    ///
    /// 
    /// 
    /// 
    /// 
    /// Get list of suitable technicians to be assigned

    [HttpGet("{id}/available-technicians")]
    public async Task<IActionResult> GetAvailableTechnicians(int id)
    {
        var st = await _context.service_transactions
            .FirstOrDefaultAsync(x => x.id == id);

        if (st == null)
            return NotFound("Service transaction not found");

        // Combine start + end datetime
        var start = st.actual_scheduled_date
            .ToDateTime(TimeOnly.FromTimeSpan(st.actual_scheduled_time));

        var end = st.estimated_completion_date
            .ToDateTime(TimeOnly.FromTimeSpan(st.estimated_completion_time));

        var dayName = start.ToString("dddd").ToLower().Trim();

        var technicians = await _context.admin_users
            .Where(au =>
                au.status == "ACTIVE" &&

                // ✅ Only AIRCON TECHNICIAN
                au.user_roles.Any(ur => ur.Role.role_name == "AIRCON_TECHNICIAN") &&

                // ✅ WORK SCHEDULE CHECK (LOGIN / LOGOUT)
                au.work_scheduleemployees.Any(ws =>
                    ws.day_of_week.ToLower().Trim() == dayName &&
                    ws.is_restday == false &&

                    (
                        // 🔵 Normal shift (08:00–17:00)
                        (ws.login_time <= ws.logout_time &&
                            st.actual_scheduled_time >= ws.login_time &&
                            st.estimated_completion_time <= ws.logout_time
                        )

                        ||

                        // 🌙 Night shift (22:00–06:00)
                        (ws.login_time > ws.logout_time &&
                            (
                                st.actual_scheduled_time >= ws.login_time ||
                                st.estimated_completion_time <= ws.logout_time
                            )
                        )
                    )
                ) &&

                // ❌ NO OVERLAPPING BOOKINGS (CRITICAL FIX)
                !_context.service_transaction_technicians.Any(stt =>
                    stt.technician_id == au.id &&
                    stt.isactiveservicetransac == true &&
                    stt.service_transaction_id != id &&
                    stt.service_transaction != null &&

                    (
                        // ✅ Proper overlap logic
                        start <
                            stt.service_transaction.estimated_completion_date
                                .ToDateTime(TimeOnly.FromTimeSpan(
                                    stt.service_transaction.estimated_completion_time))

                        &&

                        end >
                            stt.service_transaction.actual_scheduled_date
                                .ToDateTime(TimeOnly.FromTimeSpan(
                                    stt.service_transaction.actual_scheduled_time))
                    )
                )
            )
            .Select(au => new
            {
                au.id,
                au.user_name,
                au.contact_no,
                au.email_address,
                au.is_online,
                Name = au.first_name + " " + au.last_name
            })
            .ToListAsync();

        return Ok(new
        {
            requiredTechnicians = st.no_technicians_req,
            technicians = technicians
        });
    }


    //////////////////////////// Assigned Technician Post ////////////////////////////////


    [HttpPost("{id}/assign-technicians")]
    public async Task<IActionResult> AssignTechnicians(int id, [FromBody] AssignTechniciansDto dto)
    {
        using var tx = await _context.Database.BeginTransactionAsync();

        try
        {
            var serviceTransaction = await _context.service_transactions
                .FirstOrDefaultAsync(st => st.id == id);

            if (serviceTransaction == null)
            {
                return NotFound(new { message = "Service transaction not found" });
            }

            //Prevent duplicates
            var existingTechIds = await _context.service_transaction_technicians
                .Where(x => x.service_transaction_id == id)
                .Select(x => x.technician_id)
                .ToListAsync();

            var newTechIds = dto.TechnicianIds
                .Where(t => !existingTechIds.Contains(t))
                .ToList();

            if (!newTechIds.Any())
            {
                return BadRequest(new { message = "No new technicians to assign" });
            }

            //Insert new assignments
            var newAssignments = newTechIds.Select(techId => new service_transaction_technician
            {
                service_transaction_id = id,
                technician_id = techId,
                isactiveservicetransac = true,
            }).ToList();

            await _context.service_transaction_technicians.AddRangeAsync(newAssignments);

            //Save first (so count includes new records)
            await _context.SaveChangesAsync();

            //Recalculate actual assigned technicians (ACCURATE)
            var actualCount = await _context.service_transaction_technicians
                .CountAsync(x => x.service_transaction_id == id && x.isactiveservicetransac);

            serviceTransaction.actual_assigned_technicians = actualCount;

            // ✅ Update status
            serviceTransaction.status = "SCHEDULED";

            await _context.SaveChangesAsync();
            await tx.CommitAsync();

            return Ok(new
            {
                message = "Technicians assigned successfully",
                assigned = newAssignments.Count,
                totalAssigned = actualCount
            });
        }
        catch (Exception ex)
        {
            await tx.RollbackAsync();
            return StatusCode(500, new
            {
                message = "An error occurred",
                error = ex.Message
            });
        }
    }

    [HttpPut("{id}/cancel")]
    public async Task<IActionResult> CancelServiceTransaction(int id, [FromBody] CancelServiceTransactionDto dto)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            //Get service transaction
            var st = await _context.service_transactions
                .Include(x => x.service_booking)
                .FirstOrDefaultAsync(x => x.id == id);

            if (st == null)
            {
                return NotFound(new { message = "Service transaction not found" });
            }

            //Prevent double cancel
            if (st.status == "CANCELLED")
            {
                return BadRequest(new { message = "Already cancelled" });
            }

            //Require reason
            if (string.IsNullOrWhiteSpace(dto.CancellationReason))
            {
                return BadRequest(new { message = "Cancellation reason is required" });
            }

            //Update Service Transaction
            st.status = "CANCELLED";
            st.date_cancelled = DateTime.UtcNow;
            st.cancellation_reason = dto.CancellationReason;
            st.updated_at = DateTime.UtcNow;

            // ✅ Deactivate technicians
            var technicians = await _context.service_transaction_technicians
                .Where(x => x.service_transaction_id == id && x.isactiveservicetransac)
                .ToListAsync();

            foreach (var tech in technicians)
            {
                tech.isactiveservicetransac = false;
                tech.updated_at = DateTime.UtcNow;
            }

            //Update booking
            var booking = st.service_booking;

            if (booking != null)
            {
                booking.status = "CANCELLED";
                booking.updated_at = DateTime.UtcNow;
            }

            //Payment handling
            string? paymentMessage = null;

            if (booking != null &&
                booking.payment_method == "ONLINE_PAYMENT")
            {
                if (booking.payment_status == "PAID")
                {
                    // ✅ Mark as refund pending
                    booking.payment_status = "REFUND_PENDING";
                    booking.updated_at = DateTime.UtcNow;

                    paymentMessage = "Payment received online. Refund is now marked as pending.";
                }
                else if (booking.payment_status == "REFUND_PENDING")
                {
                    paymentMessage = "Refund is already pending for this transaction.";
                }
                else if (booking.payment_status == "REFUNDED")
                {
                    paymentMessage = "This transaction has already been refunded.";
                }
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            //(Optional) Trigger notifications here

            return Ok(new
            {
                message = "Service transaction cancelled successfully",
                paymentWarning = paymentMessage
            });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, new
            {
                message = "Error cancelling transaction",
                error = ex.Message
            });
        }
    }


    ////////////////////////////// make set status to ongoing ////////////////////////////////////

    [HttpPut("{id}/ongoing")]
    public async Task<IActionResult> MarkAsOngoing(int id)
    {
        try
        {
            var st = await _context.service_transactions
                .FirstOrDefaultAsync(x => x.id == id);

            if (st == null)
                return NotFound(new { message = "Service transaction not found" });

            // ❌ Only allow if currently SCHEDULED
            if (st.status != "SCHEDULED")
            {
                return BadRequest(new
                {
                    message = "Only scheduled transactions can be marked as ongoing"
                });
            }

            // 🔥 ✅ NEW VALIDATION: must have assigned technicians
            var hasTech = await _context.service_transaction_technicians
                .AnyAsync(x =>
                    x.service_transaction_id == id &&
                    x.isactiveservicetransac == true);

            if (!hasTech)
            {
                return BadRequest(new
                {
                    message = "Cannot start service without assigned technicians"
                });
            }

            // ✅ Update status
            st.status = "ONGOING";
            st.started_at = DateTime.UtcNow;
            st.updated_at = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Service marked as ongoing"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = "Error updating status",
                error = ex.Message
            });
        }
    }


    /////////////////////////            Failed Service_Transaction             //////////////////////
    [HttpPut("{id}/failed")]
    public async Task<IActionResult> MarkAsFailed(
     int id,

     [FromBody]
    FailedServiceTransactionDto dto)
    {
        try
        {
            // =====================================
            // VALIDATE INPUT
            // =====================================

            if (string.IsNullOrWhiteSpace(
                    dto.failure_reason))
            {
                return BadRequest(new
                {
                    message =
                        "Failure reason is required"
                });
            }



            // =====================================
            // GET SERVICE TRANSACTION
            // =====================================

            var st =
                await _context.service_transactions

                .Include(x => x.service_booking)

                .Include(x => x.service_transaction_technicians)

                .FirstOrDefaultAsync(x => x.id == id);

            if (st == null)
            {
                return NotFound(new
                {
                    message =
                        "Service transaction not found"
                });
            }



            // =====================================
            // VALIDATE STATUS
            // =====================================

            if (st.status != "ONGOING")
            {
                return BadRequest(new
                {
                    message =
                        "Only ongoing transactions can be marked as failed"
                });
            }

            var now =
                DateTime.UtcNow;

            var sb =
                st.service_booking;



            // =====================================
            // NORMAL TRANSACTION LOGIC
            // =====================================

            if (st.st_type == "NORMAL")
            {
                // ONLINE PAYMENT CHECK

                var isOnlinePayment =
                    sb?.payment_method ==
                        "ONLINE_PAYMENT";



                // SERVICE TRANSACTION

                st.status =
                    isOnlinePayment
                        ? "FAILED_FOR_REFUND"
                        : "FAILED";

                st.failed =
                    true;

                st.fail_reason =
                    dto.failure_reason;

                st.failed_at =
                    now;

                st.updated_at =
                    now;



                // SERVICE BOOKING

                if (sb != null)
                {
                    sb.status =
                        st.status;

                    sb.failure_count =
                        (sb.failure_count ?? 0) + 1;

                    sb.updated_at =
                        now;
                }



                // RESPONSE MESSAGE

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message =
                        isOnlinePayment
                            ? "Service marked as failed and queued for refund"
                            : "Service marked as failed"
                });
            }



            // =====================================
            // SERVICE WARRANTY LOGIC
            // =====================================

            else if (st.st_type == "SERVICE_WARRANTY")
            {
                // SERVICE TRANSACTION

                st.status =
                    "FAILED";

                st.failed =
                    true;

                st.fail_reason =
                    dto.failure_reason;

                st.failed_at =
                    now;

                st.updated_at =
                    now;



                // SERVICE BOOKING

                if (sb != null)
                {
                    // Keep booking completed
                    // so customer can file
                    // another warranty claim

                    sb.status =
                        "COMPLETED";

                    sb.updated_at =
                        now;
                }



                // WARRANTY CLAIM

                var warranty =
                    await _context
                    .service_warranty_bookings

                    .FirstOrDefaultAsync(x =>

                        x.linked_service_transaction_id ==
                            st.id
                    );

                if (warranty != null)
                {
                    warranty.status =
                        "FAILED";

                    warranty.isactiveclaim =
                        false;
                }



                // FREE TECHNICIANS

                foreach (var tech in
                    st.service_transaction_technicians)
                {
                    tech.isactiveservicetransac =
                        false;

                    tech.updated_at =
                        now;
                }



                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message =
                        "Warranty service marked as failed"
                });
            }



            // =====================================
            // UNKNOWN TYPE
            // =====================================

            return BadRequest(new
            {
                message =
                    "Unsupported service transaction type"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message =
                    "Error updating status",

                error =
                    ex.Message
            });
        }
    }

    /// Mark as partially completed


    [HttpPut("{id}/partially_completed")]
    public async Task<IActionResult> MarkAsPartiallyComplete(
     int id,

     [FromBody]
    PartialServiceTransactionDto dto)
    {
        try
        {
            // VALIDATE INPUT


            if (string.IsNullOrWhiteSpace(
                    dto.partially_completed_reason))
            {
                return BadRequest(new
                {
                    message =
                        "Please indicate the reason why for its partiality."
                });
            }

            // GET SERVICE TRANSACTION

            var st =
                await _context.service_transactions

                .Include(x => x.service_booking)

                .Include(x => x.service_transaction_technicians)

                .FirstOrDefaultAsync(x => x.id == id);

            if (st == null)
            {
                return NotFound(new
                {
                    message =
                        "Service transaction not found"
                });
            }

            // VALIDATE STATUS

            if (st.status != "ONGOING")
            {
                return BadRequest(new
                {
                    message =
                        "Only ongoing service can be marked as 'Partially Complete'"
                });
            }

            var now =
                DateTime.UtcNow;

            var sb =
                st.service_booking;

            // NORMAL TRANSACTION LOGIC
            if (st.st_type == "NORMAL")
            {
                // SERVICE TRANSACTION

                st.status =
                    "PARTIALLY_COMPLETED";

                st.ispartiallycompleted =
                    true;

                st.partially_completed_reason =
                    dto.partially_completed_reason;

                st.partially_at =
                    now;

                st.updated_at =
                    now;

                // SERVICE BOOKING

                if (sb != null)
                {
                    sb.status =
                        "PARTIALLY_COMPLETED";

                    sb.partial_complete_count =
                        (sb.partial_complete_count ?? 0) + 1;

                    sb.updated_at =
                        now;
                }

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message =
                        "Service marked as partially complete"
                });
            }

            // SERVICE WARRANTY LOGIC

            else if (st.st_type == "SERVICE_WARRANTY")
            {
                // SERVICE TRANSACTION

                st.status =
                    "PARTIALLY_COMPLETED";

                st.ispartiallycompleted =
                    true;

                st.partially_completed_reason =
                    dto.partially_completed_reason;

                st.partially_at =
                    now;

                st.updated_at =
                    now;

                // SERVICE BOOKING

                if (sb != null)
                {
                    // Keep booking completed
                    // so customer can file
                    // another warranty claim

                    sb.status =
                        "COMPLETED";

                    sb.updated_at =
                        now;
                }

                // WARRANTY CLAIM

                var warranty =
                    await _context
                    .service_warranty_bookings

                    .FirstOrDefaultAsync(x =>

                        x.linked_service_transaction_id ==
                            st.id
                    );

                if (warranty != null)
                {
                    warranty.status =
                        "PARTIALLY_COMPLETED";

                    warranty.isactiveclaim =
                        false;
                }



                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message =
                        "Warranty service marked as partially completed"
                });
            }

            // UNKNOWN TYPE

            return BadRequest(new
            {
                message =
                    "Unsupported service transaction type"
            });
        }
        catch (Exception ex)
        {
            var fullError =
                ex.InnerException?.Message ??
                ex.Message;

            Console.WriteLine(
                "========== FULL ERROR =========="
            );

            Console.WriteLine(
                ex.ToString()
            );

            Console.WriteLine(
                "================================"
            );

            return StatusCode(500, new
            {
                message =
                    fullError,

                error =
                    ex.Message
            });
        }
    }

    //Completed Service Transaction

    [HttpPut("{id}/completed")]
    public async Task<IActionResult> CompetedServiceTransaction(int id)
    {
        await using var transaction =
            await _context.Database.BeginTransactionAsync();

        try
        {
            var st =
                await _context.service_transactions

                .Include(x => x.service_booking)
                    .ThenInclude(sb => sb.payment_transaction)

                .FirstOrDefaultAsync(x => x.id == id);

            if (st == null)
            {
                return NotFound(new
                {
                    message =
                        "Service transaction not found"
                });
            }

            if (st.status != "ONGOING")
            {
                return BadRequest(new
                {
                    message =
                        "Only ongoing transactions can be marked as completed"
                });
            }

            var sb = st.service_booking;

            if (sb == null)
            {
                return BadRequest(new
                {
                    message =
                        "Service booking not found"
                });
            }

            var now =
                DateTime.UtcNow;



            // =====================================
            // PAYMENT
            // =====================================

            if (sb.payment_method == "AFTER_SERVICE")
            {
                sb.payment_status =
                    "PAID";

                sb.paid_at =
                    now;

                sb.updated_at =
                    now;

                if (sb.payment_transaction != null)
                {
                    sb.payment_transaction.paid_at =
                        now;

                    sb.payment_transaction.after_service_status =
                        "PAID";
                }
            }
            else if (sb.payment_method == "ONLINE_PAYMENT")
            {
                if (sb.payment_transaction == null ||

                    sb.payment_transaction.paymongo_status !=
                        "PAID")
                {
                    return BadRequest(new
                    {
                        message =
                            "ONLINE_PAYMENT not yet paid"
                    });
                }

                sb.paid_at =
                    now;

                sb.updated_at =
                    now;

                sb.payment_transaction.paid_at =
                    now;
            }



            // =====================================
            // COMPLETION
            // =====================================

            sb.status =
                "COMPLETED";

            sb.updated_at =
                now;

            st.status =
                "COMPLETED";

            st.date_completed =
                DateOnly.FromDateTime(now);

            st.time_completed =
                TimeOnly.FromTimeSpan(
                    now.TimeOfDay
                );

            st.updated_at =
                now;



            /*
            // =====================================
            // FREE TECHNICIANS
            // =====================================

            // Commented out so that
            // technician assignment history
            // remains visible after completion

            var techs =
                await _context
                .service_transaction_technicians

                .Where(x =>

                    x.service_transaction_id == id &&

                    x.isactiveservicetransac
                )

                .ToListAsync();

            foreach (var t in techs)
            {
                t.isactiveservicetransac =
                    false;

                t.updated_at =
                    now;
            }
            */



            // =====================================
            // RESOLVE WARRANTY CLAIM
            // =====================================

            if (st.st_type != "NORMAL")
            {
                var warranty =
                    await _context
                    .service_warranty_bookings

                    .FirstOrDefaultAsync(x =>

                        x.linked_service_transaction_id ==
                            st.id
                    );

                if (warranty != null)
                {
                    warranty.resolved_at =
                        DateTime.UtcNow;

                    warranty.status =
                        "RESOLVED";

                    warranty.isactiveclaim =
                        false;
                }
            }



            // =====================================
            // SAVE + COMMIT
            // =====================================

            await _context.SaveChangesAsync();

            await transaction.CommitAsync();



            return Ok(new
            {
                message =
                    "Service completed successfully"
            });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();

            var fullError =
                ex.InnerException?.Message ??
                ex.Message;

            Console.WriteLine(
                "========== FULL ERROR =========="
            );

            Console.WriteLine(
                ex.ToString()
            );

            Console.WriteLine(
                "================================"
            );

            return StatusCode(500, new
            {
                message =
                    fullError,

                error =
                    ex.Message
            });
        }
    }

    ///////////////////////////////////////////////////       All Service Transactions Get      ////////////////////////////////////////////////////////////////////
    ///
    [HttpGet("all-transactions")]
    public async Task<IActionResult> GetAllTransactions( int page = 1, int pageSize = 24, string sortBy = "createdAt", string sortDir = "desc", string? search = null,string? statuses = null )
    {
        var query = _context.service_transactions
            .AsNoTracking()
            .Include(st => st.service_booking)
                .ThenInclude(sb => sb.customer)
            .Include(st => st.service_transaction_technicians)
            .AsQueryable();


        // 🔍 STATUS FILTER (NEW)

        if (!string.IsNullOrWhiteSpace(statuses))
        {
            var statusList = statuses
                .Split(',')
                .Select(s => s.Trim().ToUpper())
                .ToList();

            query = query.Where(st => statusList.Contains(st.status));
        }
        else
        {
            query = query.Where(st =>
                st.status == "COMPLETED" ||
                st.status == "FAILED" ||
                st.status == "PARTIALLY_COMPLETED" ||
                st.status == "CANCELLED" ||
                st.status == "FAILED_FOR_REFUND" ||
                st.status == "FOR_TECH_ASSIGNMENT" ||
                st.status == "SCHEDULED"
            );
        }


        // 🔍 SEARCH

        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.Trim();

            query = query.Where(st =>
                EF.Functions.ILike(st.st_ref_code ?? "", $"%{search}%") ||
                EF.Functions.ILike(st.service_booking.booking_ref_code ?? "", $"%{search}%") ||
                EF.Functions.ILike(st.service_booking.customer.first_name ?? "", $"%{search}%") ||
                EF.Functions.ILike(st.service_booking.customer.last_name ?? "", $"%{search}%")
            );
        }


        // SORTING

        bool asc = sortDir == "asc";

        query = sortBy switch
        {
            "stRefCode" => asc
                ? query.OrderBy(st => st.st_ref_code)
                : query.OrderByDescending(st => st.st_ref_code),

            "serviceBookingRefCode" => asc
                ? query.OrderBy(st => st.service_booking.booking_ref_code)
                : query.OrderByDescending(st => st.service_booking.booking_ref_code),

            "customerName" => asc
                ? query.OrderBy(st => st.service_booking.customer.first_name)
                    .ThenBy(st => st.service_booking.customer.last_name)
                : query.OrderByDescending(st => st.service_booking.customer.first_name)
                    .ThenByDescending(st => st.service_booking.customer.last_name),

            "actualScheduledDate" => asc
                ? query.OrderBy(st => st.actual_scheduled_date)
                : query.OrderByDescending(st => st.actual_scheduled_date),

            "actualScheduledTime" => asc
                ? query.OrderBy(st => st.actual_scheduled_time)
                : query.OrderByDescending(st => st.actual_scheduled_time),

            "estimatedCompletionDate" => asc
                ? query.OrderBy(st => st.estimated_completion_date)
                : query.OrderByDescending(st => st.estimated_completion_date),

            "estimatedCompletionTime" => asc
                ? query.OrderBy(st => st.estimated_completion_time)
                : query.OrderByDescending(st => st.estimated_completion_time),

            "noOfTechnicians" => asc
                ? query.OrderBy(st => st.no_technicians_req)
                : query.OrderByDescending(st => st.no_technicians_req),

            "stType" => asc
                ? query.OrderBy(st => st.st_type)
                : query.OrderByDescending(st => st.st_type),

            "difficultyRate" => asc
                ? query.OrderBy(st => st.difficulty_rate)
                : query.OrderByDescending(st => st.difficulty_rate),

            _ => asc
                ? query.OrderBy(st => st.created_at)
                : query.OrderByDescending(st => st.created_at)
        };


        //PAGINATION

        var totalCount = await query.CountAsync();

        var data = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(st => new
            {
                bookingId = st.service_booking_id,
                id = st.id,
                stRefCode = st.st_ref_code,
                stType = st.st_type,
                paymentMethod = st.service_booking.payment_method,
                paymentStatus = st.service_booking.payment_status,

                bookingRefCode = st.service_booking.booking_ref_code,
                customerName = st.service_booking.customer.first_name + " " + st.service_booking.customer.last_name,
                businessName = st.service_booking.business_name,
                totalAmount = st.service_booking.total_amount,

                actualScheduledDate = st.actual_scheduled_date,
                actualScheduledTime = st.actual_scheduled_time,

                estimatedCompletionDate = st.estimated_completion_date,
                estimatedCompletionTime = st.estimated_completion_time,

                techniciansRequired = st.no_technicians_req,
                assignedTechnicians = st.service_transaction_technicians.Count(),

                difficultyRate = st.difficulty_rate,
                propertyType = st.service_booking.property_type,

                createdAt = st.created_at,
                status = st.status
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



    /// <summary>
    /// Service Transaction Reference Code Generator
    /// </summary>
    /// <returns></returns>
    private string GenerateServiceTransactionRefCode()
    {
        var now = DateTime.Now;
        return $"SRV{now:MMdd}-{now:HHmmss}";
    }


    ///Display all Service Booking
    [HttpGet("all-bookings")]
    public async Task<IActionResult> GetAllBookings(
    int page = 1,
    int pageSize = 24,
    string sortBy = "createdAt",
    string sortDir = "desc",
    string? search = null,
    string? statuses = null
)
    {
        var query = _context.service_bookings
            .Include(b => b.customer)
            .AsQueryable();

        //  STATUS FILTER (checkbox ready)
        if (!string.IsNullOrWhiteSpace(statuses))
        {
            var statusList = statuses
                .Split(',')
                .Select(s => s.Trim().ToUpper())
                .ToList();

            query = query.Where(b => statusList.Contains(b.status));
        }

        // SEARCH
        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.Trim().ToLower();

            query = query.Where(b =>
                EF.Functions.ILike(b.booking_ref_code ?? "", $"%{search}%") ||
                EF.Functions.ILike(b.customer.first_name ?? "", $"%{search}%") ||
                EF.Functions.ILike(b.customer.last_name ?? "", $"%{search}%")
            );
        }

        
        bool asc = sortDir.ToLower() == "asc";

        query = sortBy switch
        {
            "referenceCode" => asc
                ? query.OrderBy(b => b.booking_ref_code)
                : query.OrderByDescending(b => b.booking_ref_code),

            "customerName" => asc
                ? query.OrderBy(b => b.customer.first_name)
                : query.OrderByDescending(b => b.customer.first_name),

            "businessName" => asc
                ? query.OrderBy(b => b.business_name)
                : query.OrderByDescending(b => b.business_name),

            "scheduledDate" => asc
                ? query.OrderBy(b => b.schedule_date)
                : query.OrderByDescending(b => b.schedule_date),

            "preferredTime" => asc
                ? query.OrderBy(b => b.preferred_time)
                : query.OrderByDescending(b => b.preferred_time),

            "paymentMethod" => asc
                ? query.OrderBy(b => b.payment_method)
                : query.OrderByDescending(b => b.payment_method),

            "totalAmount" => asc
                ? query.OrderBy(b => b.total_amount)
                : query.OrderByDescending(b => b.total_amount),

            "propertyType" => asc
                ? query.OrderBy(b => b.property_type)
                : query.OrderByDescending(b => b.property_type),

            "createdAt" => asc
                ? query.OrderBy(b => b.created_at)
                : query.OrderByDescending(b => b.created_at),

            "status" => asc
                ? query.OrderBy(b => b.status)
                : query.OrderByDescending(b => b.status),

            _ => asc
                ? query.OrderBy(b => b.created_at)
                : query.OrderByDescending(b => b.created_at)
        };

        // pagination
        var totalCount = await query.CountAsync();

        var data = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(b => new
            {
                id = b.id,
                failure_count = b.failure_count,
                referenceCode = b.booking_ref_code,
                customerName = b.customer.first_name + " " + b.customer.last_name,
                businessName = b.business_name,
                scheduledDate = b.schedule_date,
                preferredTime = b.preferred_time,
                paymentMethod = b.payment_method,
                totalAmount = b.total_amount,
                propertyType = b.property_type,
                createdAt = b.created_at, 
                status = b.status
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


}

