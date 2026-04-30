/*
using ARCon_Capstone_2.Data;
using ARCon_Capstone_2.Models;
using Azure.Core;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;

[Route("api/webhook")]
public class WebhookController : ControllerBase
{
    private readonly ARCon_Capstone_2_DbContext _context;
    private readonly ILogger<WebhookController> _logger;
    public WebhookController(ARCon_Capstone_2_DbContext context, ILogger<WebhookController> logger)
    {
        _context = context;
        _logger = logger;   
    }


    [HttpPost("paymongo_webhook")]
    public async Task<IActionResult> PaymongoWebhook()
    {
        using var reader = new StreamReader(Request.Body);
        var body = await reader.ReadToEndAsync();

        if (string.IsNullOrEmpty(body))
            return Ok();

        dynamic json = JsonConvert.DeserializeObject(body);

        // ✅ Get event type
        string eventType = json?.data?.attributes?.type;

        if (eventType != "payment.paid")
            return Ok(); // ignore other events

        // ✅ Get payment_intent_id
        string paymentIntentId = json?.data?.attributes?.data?.attributes?.payment_intent_id;

        if (string.IsNullOrEmpty(paymentIntentId))
            return Ok();

        // ✅ Find transaction
        var transaction = await _context.payment_transactions
            .FirstOrDefaultAsync(x => x.paymongo_payment_intent_id == paymentIntentId);

        // 🔥 RETRY (handles race condition)
        if (transaction == null)
        {
            await Task.Delay(500);

            transaction = await _context.payment_transactions
                .FirstOrDefaultAsync(x => x.paymongo_payment_intent_id == paymentIntentId);
        }

        if (transaction == null)
            return Ok(); // still not found, safe exit

        // ✅ Prevent duplicate updates
        if (transaction.paymongo_status == "PAID")
            return Ok();

        // ✅ Update payment status
        transaction.paymongo_status = "PAID";
        transaction.paid_at = DateTime.UtcNow; // 🔥 ADD THIS

        await _context.SaveChangesAsync();

        await _context.SaveChangesAsync();

        return Ok();
    }
}

*/


using ARCon_Capstone_2.Data;
using ARCon_Capstone_2.Models;
using Azure.Core;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;

[Route("api/webhook")]
public class WebhookController : ControllerBase
{
    private readonly ARCon_Capstone_2_DbContext _context;
    private readonly ILogger<WebhookController> _logger;
    public WebhookController(ARCon_Capstone_2_DbContext context, ILogger<WebhookController> logger)
    {
        _context = context;
        _logger = logger;
    }


    [HttpPost("paymongo_webhook")]
    public async Task<IActionResult> PaymongoWebhook()
    {
        using var reader = new StreamReader(Request.Body);
        var body = await reader.ReadToEndAsync();

        if (string.IsNullOrEmpty(body))
            return Ok();

        dynamic json = JsonConvert.DeserializeObject(body);

        // ================= GET EVENT =================
        string eventType = json?.data?.attributes?.type;

        if (eventType != "payment.paid" && eventType != "payment.failed")
            return Ok();

        var attributes = json?.data?.attributes?.data?.attributes;

        string paymentIntentId = attributes?.payment_intent_id;
        string paymentId = attributes?.id;

        if (string.IsNullOrEmpty(paymentIntentId))
            return Ok();

        _logger.LogInformation($"Webhook received: {eventType} | Intent: {paymentIntentId}");

        // ================= FIND PAYMENT =================
        var transaction = await _context.payment_transactions
            .FirstOrDefaultAsync(x => x.paymongo_payment_intent_id == paymentIntentId);

        // 🔥 RETRY (race condition safe)
        if (transaction == null)
        {
            await Task.Delay(500);

            transaction = await _context.payment_transactions
                .FirstOrDefaultAsync(x => x.paymongo_payment_intent_id == paymentIntentId);
        }

        if (transaction == null)
        {
            _logger.LogWarning("Transaction not found for intent: " + paymentIntentId);
            return Ok();
        }

        // ================= PREVENT DUPLICATE =================
        if ((transaction.paymongo_status ?? "").ToUpper() == "PAID")
            return Ok();

        // ================= UPDATE PAYMENT =================
        if (eventType == "payment.paid")
        {
            transaction.paymongo_status = "PAID";
            transaction.paymongo_payment_id = paymentId;
            transaction.paid_at = DateTime.UtcNow;
        }
        else if (eventType == "payment.failed")
        {
            transaction.paymongo_status = "FAILED";
        }

        // ================= UPDATE BOOKING =================
        var booking = await _context.service_bookings
            .FirstOrDefaultAsync(x => x.payment_transaction_id == transaction.id);

        if (booking != null)
        {
            if (eventType == "payment.paid")
            {
                booking.payment_status = "PAID";
                booking.payment_reference = paymentId;
                booking.paid_at = DateTime.UtcNow;

                // 🔥 IMPORTANT: confirm booking
                booking.status = "PENDING";
            }
            else if (eventType == "payment.failed")
            {
                booking.payment_status = "FAILED";
            }
        }

        // ================= SAVE =================
        await _context.SaveChangesAsync();

        _logger.LogInformation($"Webhook processed successfully for intent: {paymentIntentId}");

        return Ok();
    }
}