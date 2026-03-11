using ARCon_Capstone_2.Data;
using ARCon_Capstone_2.DTOs;
using ARCon_Capstone_2.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Areas.Shop.Controllers;

[AllowAnonymous]
[ApiController]
[Route("api/service-bookings")]
public class Shop_ServiceBookingsApiController : ControllerBase
{
    private readonly ARCon_Capstone_2_DbContext _context;

    public Shop_ServiceBookingsApiController(ARCon_Capstone_2_DbContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<IActionResult> CreateBooking(
        [FromBody] Shop_CreateServiceBookingDto dto)
    {
        // ================= AUTH =================
        var customerId = HttpContext.Session.GetInt32("UserId");
        if (customerId == null)
            return Unauthorized(new { message = "Login Required" });

        // ================= VALIDATION =================
        if (!ModelState.IsValid)
        {
            var errors = ModelState
                .Where(x => x.Value.Errors.Count > 0)
                .Select(x => new {
                    field = x.Key,
                    errors = x.Value.Errors.Select(e => e.ErrorMessage)
                });

            return BadRequest(new { message = "Validation failed", errors });
        }

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        if (dto.schedule_date < today)
            return BadRequest(new { message = "Schedule date cannot be in the past" });

        var allowedProps = new[] { "HOUSE", "CONDO", "CORPORATE", "BUSINESS" };
        if (!allowedProps.Contains(dto.property_type))
            return BadRequest(new { message = "Invalid property type" });

        if (dto.payment_method != "ONLINE_PAYMENT" &&
            dto.payment_method != "AFTER_SERVICE")
            return BadRequest(new { message = "Invalid payment method" });

        if (dto.sbitems == null || dto.sbitems.Count == 0)
            return BadRequest(new { message = "No booking items" });

        await using var tx = await _context.Database.BeginTransactionAsync();

        try
        {
            // ================= CREATE PAYMENT FIRST =================
            var payment = new payment_transaction
            {
                payment_method = dto.payment_method,
                amount = 0, // temp — update later
                created_at = DateTime.UtcNow
            };

            if (dto.payment_method == "ONLINE_PAYMENT")
                payment.paymongo_status = "PENDING";
            else
                payment.after_service_status = "PENDING";

            _context.payment_transactions.Add(payment);
            await _context.SaveChangesAsync(); // ⭐ payment.id generated



            // ================= CREATE BOOKING =================
            var booking = new service_booking
            {
                customer_id = customerId.Value,
                status = "PENDING",

                customer_addresses_id = dto.customer_addresses_id,
                schedule_date = dto.schedule_date,
                preferred_time = dto.preferred_time,

                property_type = dto.property_type,
                customer_note = dto.customer_note,
                business_name = dto.business_name,
                payment_method = dto.payment_method,
                payment_status = "PENDING",

                payment_transaction_id = payment.id // ⭐ FK satisfied
            };

            _context.service_bookings.Add(booking);
            await _context.SaveChangesAsync(); // ⭐ booking.id generated



            // ================= BOOKING REF CODE =================
            booking.booking_ref_code =
                GenerateBookingRef(customerId.Value, booking.id);

            await _context.SaveChangesAsync();



            // ================= BOOKING ITEMS =================
            decimal grandTotal = 0;

            foreach (var item in dto.sbitems)
            {
                var total = item.price * item.unit_count;
                grandTotal += total;

                var bookingItem = new service_booking_item
                {
                    service_bookings_id = booking.id,
                    services_id = item.services_id,
                    service_price_tier_id = item.service_price_tiers_id,

                    unit_count = item.unit_count,
                    unit_brand = item.unit_brand,
                    unit = item.unit,
                    capacity_range = item.capacity_range,
                  
                    price = item.price
                };
                _context.service_booking_items.Add(bookingItem);
            }

            await _context.SaveChangesAsync();

            // ================= UPDATE TOTALS =================
            booking.total_amount = grandTotal;
            payment.amount = grandTotal;

            await _context.SaveChangesAsync();



            // ================= COMMIT =================
            await tx.CommitAsync();

            return Ok(new
            {
                bookingId = booking.id,
                reference = booking.booking_ref_code,
                total = grandTotal,
                paymentTransactionId = payment.id
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

    private string GenerateBookingRef(int customerId, int bookingId)
    {
        var datePart = DateTime.Now.ToString("MMddyy");
        return $"SB-{customerId:D3}{datePart}-{bookingId:D4}";
    }
}