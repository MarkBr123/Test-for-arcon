using ARCon_Capstone_2.Data;
using ARCon_Capstone_2.DTOs;
using ARCon_Capstone_2.Models;
using ARCon_Capstone_2.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ARCon_Capstone_2.Services;
using System.Data.Common;

namespace ARCon_Capstone_2.Areas.Shop.Controllers;


[ApiController]
[Route("api/online-payments-orders")]

public class OnlinePayments_OrderApiController : ControllerBase
{
    private readonly ARCon_Capstone_2_DbContext _context;
    private readonly PayMongoService _payMongoService;
    public OnlinePayments_OrderApiController(ARCon_Capstone_2_DbContext context, PayMongoService payMongoService)
    {
        _context = context;
        _payMongoService = payMongoService;
    }

    [HttpPost("attach-payment")]
    public async Task<IActionResult> AttachPayment([FromBody] Attach_OnlinePaymentDto dto)
    {
        var customerId = HttpContext.Session.GetInt32("UserId");
        try
        {
            if (customerId == null)
                return Unauthorized();

            var paymentTransaction = await _context.payment_transactions
                .FirstOrDefaultAsync(p => p.id == dto.PaymentTransactionId);

            if (paymentTransaction == null)
                return NotFound();

            // 🔐 Ownership check
            var isOwner = await _context.customer_transactions
                .AnyAsync(t =>
                    t.payment_transaction_id == paymentTransaction.id &&
                    t.customer_id == customerId);

            if (!isOwner)
                return Unauthorized();

            // 🔥 FIX HERE
            await _payMongoService.AttachPaymentMethod(
                paymentTransaction.paymongo_payment_intent_id,
                dto.PaymentMethodId
            );

            paymentTransaction.paymongo_status = "PROCESSING";
            await _context.SaveChangesAsync();

            return Ok(new { success = true });
        }
        catch (Exception ex)
        {
            var fullError = ex.InnerException?.Message ?? ex.Message;

            Console.WriteLine("========== FULL ERROR ==========");
            Console.WriteLine(ex.ToString());
            Console.WriteLine("================================");

            return StatusCode(500, new
            {
                message = fullError
            });
        }
    }

}
