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

namespace ARCon_Capstone_2.Areas.Shop.Controllers;


[ApiController]
[Route("api/my-shop-ratings")]
public class Shop_CustomerRatingApiControllers : ControllerBase
{
    public readonly ARCon_Capstone_2_DbContext _context;

    public Shop_CustomerRatingApiControllers(ARCon_Capstone_2_DbContext context)
    {
        _context = context;
    }


    // Posting of customer Transaction ratings
    [HttpPost("customer-transaction-ratings")]
    public async Task<IActionResult> CreateCustomerRating([FromBody] CreateCustomerRatingDto dto)
    {
        var customerId = HttpContext.Session.GetInt32("UserId");

        if (customerId == null)
            return Unauthorized();

        if (dto == null || dto.rating == null)
                return BadRequest("Rating is required.");

        if (dto.rating < 1 || dto.rating > 5)
            return BadRequest("Rating must be between 1 and 5.");

        await using var tx = await _context.Database.BeginTransactionAsync();

        try
        {
            // Check transaction ownership
            var transactionExists = await _context.customer_transactions
                .AnyAsync(t => t.id == dto.transactionId && t.customer_id == customerId);

            if (!transactionExists)
            {
                await tx.RollbackAsync();
                return BadRequest("Invalid transaction.");
            }

            // Check product exists in that transaction (via checkout_items)
            var productExists = await _context.checkout_items
                .AnyAsync(ci =>
                    ci.product_id == dto.productId &&
                    ci.checkout.customer_id == customerId &&   // extra safety
                    ci.checkout.id == _context.customer_transactions
                        .Where(t => t.id == dto.transactionId)
                        .Select(t => t.checkout_id)
                        .FirstOrDefault());

            if (!productExists)
            {
                await tx.RollbackAsync();
                return BadRequest("Product not found in this transaction.");
            }

            // STRICT: ensure THIS product is delivered
            var deliveredItem = await _context.delivery_items
                .AnyAsync(di =>
                    di.checkout_item.product_id == dto.productId &&
                    di.delivery.customer_transaction_id == dto.transactionId &&
                    di.delivery.delivered_at != null);

            if (!deliveredItem)
            {
                await tx.RollbackAsync();
                return BadRequest("This product is not yet delivered.");
            }

            // Validate delivery_item_id (if provided)
            if (dto.deliveryItemId != null)
            {
                var validDeliveryItem = await _context.delivery_items
                    .AnyAsync(di =>
                        di.id == dto.deliveryItemId &&
                        di.checkout_item.product_id == dto.productId &&
                        di.delivery.customer_transaction_id == dto.transactionId);

                if (!validDeliveryItem)
                {
                    await tx.RollbackAsync();
                    return BadRequest("Invalid delivery item.");
                }
            }

            // Create rating
            var rating = new customer_rating
            {
                customer_id = customerId.Value,
                transaction_id = dto.transactionId,
                product_id = dto.productId,
                delivery_item_id = dto.deliveryItemId,
                rating = dto.rating,
                comment = string.IsNullOrWhiteSpace(dto.comment) ? null : dto.comment.Trim(),
                isposted = false // explicit for moderation
            };

            _context.customer_ratings.Add(rating);
            await _context.SaveChangesAsync();

            await tx.CommitAsync();

            return Ok(new { message = "Rating submitted successfully." });
        }
        catch (DbUpdateException ex)
        {
            await tx.RollbackAsync();

            var error = ex.InnerException?.Message ?? ex.Message;

            return BadRequest(new
            {
                message = "Database error",
                error = error
            });
        }

    }


    /// <summary>
    /// Get Transaction
    /// </summary>
    /// <param name="transactionId"></param>
    /// <returns></returns>
    [HttpGet("customer-transaction-ratings/{transactionId}")]
    public async Task<IActionResult> GetRatings(int transactionId)
    {
        var customerId = HttpContext.Session.GetInt32("UserId");

        if (customerId == null)
            return Unauthorized();

        var ratings = await _context.customer_ratings
            .Where(r =>
                r.transaction_id == transactionId &&
                r.customer_id == customerId)
            .Select(r => new
            {
                r.product_id,
                r.rating,
                r.comment
            })
            .ToListAsync();

        return Ok(ratings);
    }



    ////////// Services /////////////
    ///
    [HttpPost("{bookingId}/rate")]
    public async Task<IActionResult> RateService(int bookingId, [FromBody] AddServiceRatingDto dto)
    {
        var customerId = HttpContext.Session.GetInt32("UserId");
        var userType = HttpContext.Session.GetString("UserType");

        if (customerId == null || userType != "CUSTOMER")
            return Unauthorized(new { message = "User not logged in" });

        var booking = await _context.service_bookings
            .FirstOrDefaultAsync(x => x.id == bookingId);

        if (booking == null)
            return NotFound(new { message = "Service booking not found" });

        if (booking.customer_id != customerId)
            return Forbid();

        if (booking.status != "COMPLETED")
            return BadRequest(new { message = "You can only rate completed services" });

        // 🔥 CHECK IF ALREADY RATED
        var alreadyRated = await _context.service_ratings
            .AnyAsync(x => x.service_booking_id == bookingId
                        && x.customer_id == customerId);

        if (alreadyRated)
            return BadRequest(new
            {
                message = "This service has already been rated",
                isRated = true
            });

        // ✅ CREATE NEW RATING
        var rating = new service_rating
        {
            service_booking_id = bookingId,
            customer_id = customerId.Value,
            rating = dto.rating,
            comment = dto.comment,
            isposted = false
        };

        _context.service_ratings.Add(rating);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Rating submitted successfully",
            isRated = true
        });
    }
}
