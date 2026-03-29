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
namespace ARCon_Capstone_2.Areas.Admin.Controllers;


[Route("api/transaction")]
public class TransactionsApiController : ControllerBase
{
    public readonly ARCon_Capstone_2_DbContext _context;

    public TransactionsApiController(ARCon_Capstone_2_DbContext context)
    {
        _context = context;
    }

    [HttpGet("pending-transactions")]
    public async Task<IActionResult> GetPendingTransaction(int page = 1, int pageSize = 24, string sortBy = "createdAt", string sortDir = "asc", string? search = null)
    {
        var query = _context.customer_transactions
            .Include(t => t.customer)
            .Include(t => t.payment_transaction)
            .AsQueryable();


        //Filter Pending Only or Reprocess

        query = query.Where(t =>
            t.status == "PENDING_CONFIRMATION" ||
            t.status == "PENDING_REPROCESS");

        //Search

        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.Trim().ToLower();

            query = query.Where(t =>
                EF.Functions.ILike(t.transaction_code ?? "", $"%{search}%") ||
                EF.Functions.ILike(t.customer.first_name ?? "", $"%{search}%") ||
                EF.Functions.ILike(t.customer.last_name ?? "", $"%{search}%")
            );
        }

        //Sorting

        bool asc = sortDir.ToLower() == "asc";

        query = sortBy switch
        {
            "transactionCode" => asc
               ? query.OrderBy(t => t.transaction_code)
               : query.OrderByDescending(t => t.transaction_code),

            "customerName" => asc
                ? query.OrderBy(t => t.customer.first_name)
                : query.OrderByDescending(t => t.customer.first_name),

            "grandTotal" => asc
                ? query.OrderBy(t => t.grand_total)
                : query.OrderByDescending(t => t.grand_total),

            _ => asc
                ? query.OrderBy(t => t.created_at)
                : query.OrderByDescending(t => t.created_at)
        };

        //Pagination

        var totalCount = await query.CountAsync();

        var data = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new
            {
                id = t.id,
                transactionCode = t.transaction_code,
                customerName = t.customer.first_name + " " + t.customer.last_name,
                paymentMethod = t.payment_transaction.payment_method,
                grandTotal = t.grand_total,
                createdAt = t.created_at,
                status = t.status
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

    [HttpGet("{id}/summary")]
    public async Task<IActionResult> GetTransactionSummary(int id)
    {
           var summary = await _context.customer_transactions
            .Where(t => t.id == id && (t.status == "PENDING_CONFIRMATION" || t.status == "PENDING_REPROCESS"))
            .Select(t => new
            {
                transactionId = t.id,
                transactionCode = t.transaction_code,

                customerName = (t.customer.first_name ?? "")
                             + " "
                             + (t.customer.last_name ?? ""),
                customerEmail = t.customer.email,
                customerNo = t.customer.contact_no,
                shippingMethod = t.shipping_method,
                deliveryAddress = t.checkout.delivery_address_id != null
                    ? t.checkout.delivery_address.house_unit + ", " +
                      t.checkout.delivery_address.street_name + ", " +
                      t.checkout.delivery_address.barangay.barangay_name + ", " +
                      t.checkout.delivery_address.municipality.municipality_name + ", " +
                      t.checkout.delivery_address.province.province_name + ", " +
                      t.checkout.delivery_address.region.region_name + " " +
                      t.checkout.delivery_address.zip_code
                    : null,

                paymentMethod = t.payment_transaction.payment_method,

                paymentStatus =
                    t.payment_transaction.cod_status ??
                    t.payment_transaction.paymongo_status,

                deliveryCost = t.checkout.delivery_cost,
                grandTotal = t.grand_total,
                status = t.status,
                createdAt = t.created_at,

                items = t.checkout.checkout_items.Select(ci => new
                {
                    productManufacturer = ci.product.manufacturer != null
                        ? ci.product.manufacturer.brand_name
                        : null,

                    productSeries = ci.product.product_series,
                    productModel = ci.product.product_model,
                    productSku = ci.product.sku,

                    qty = ci.qty,
                    productPrice = ci.product_price,
                    stdInstallationPrice = ci.std_installation_price,
                    additionalInstallationPrice = ci.additional_installation_price,
                    totalItemAmount = ci.total_item_amount
                }).ToList()
            })
            .FirstOrDefaultAsync();

        if (summary == null)
            return NotFound("Transaction not found.");

        return Ok(summary);
    }


    [HttpGet("{id}/details")] // used in processing.cshtml and CreateDelivery.cshtml
    public async Task<IActionResult> GetTransactionDetails(int id)
    {
        var summary = await _context.customer_transactions
         .Where(t => t.id == id && t.status == "CONFIRMED")
         .Select(t => new
         {
             transactionId = t.id,
             transactionCode = t.transaction_code,
             transactionConfimedDate = t.date_confirmed,
             customerName = (t.customer.first_name ?? "")
                          + " "
                          + (t.customer.last_name ?? ""),
             customerEmail = t.customer.email,
             customerNo = t.customer.contact_no,
             shippingMethod = t.shipping_method,
             deliveryAddress = t.checkout.delivery_address_id != null
                 ? t.checkout.delivery_address.house_unit + ", " +
                   t.checkout.delivery_address.street_name + ", " +
                   t.checkout.delivery_address.barangay.barangay_name + ", " +
                   t.checkout.delivery_address.municipality.municipality_name + ", " +
                   t.checkout.delivery_address.province.province_name + ", " +
                   t.checkout.delivery_address.region.region_name + " " +
                   t.checkout.delivery_address.zip_code
                 : null,

             paymentMethod = t.payment_transaction.payment_method,

             paymentStatus =
                 t.payment_transaction.cod_status ??
                 t.payment_transaction.paymongo_status,

             deliveryCost = t.checkout.delivery_cost,
             grandTotal = t.grand_total,
             status = t.status,
             createdAt = t.created_at,

             items = t.checkout.checkout_items.Select(ci => new
             {
                 productManufacturer = ci.product.manufacturer != null
                     ? ci.product.manufacturer.brand_name
                     : null,
                 checkoutItemId = ci.id, /// added
                 productSeries = ci.product.product_series,
                 productModel = ci.product.product_model,
                 productSku = ci.product.sku,

                 qty = ci.qty,
                 productPrice = ci.product_price,
                 stdInstallationPrice = ci.std_installation_price,
                 additionalInstallationPrice = ci.additional_installation_price,
                 totalItemAmount = ci.total_item_amount
             }).ToList()
         })
         .FirstOrDefaultAsync();

        if (summary == null)
            return NotFound("Transaction not found.");

        return Ok(summary);
    }




    //this will make trasaction status = confimed
    [HttpPut("{id}/confirm")]
        public async Task<IActionResult> ConfirmOrder(int id)
        {
            await _context.customer_transactions
                .Where(t => t.id == id)
                .ExecuteUpdateAsync(s =>
                    s.SetProperty(t => t.status, "CONFIRMED")
                    .SetProperty(t => t.date_confirmed, DateTime.UtcNow));

            await _context.SaveChangesAsync();

            return Ok();
        }
    //this will make trasaction status = rejected
    [HttpPut("{id}/reject")]
        public async Task<IActionResult> RejectOrder(int id)
        {
        await _context.customer_transactions
             .Where(t => t.id == id)
             .ExecuteUpdateAsync(s =>
                 s.SetProperty(t => t.status, "REJECTED")
                 .SetProperty(t => t.date_rejected, DateTime.UtcNow));

                await _context.SaveChangesAsync();

            return Ok();
        }


    [HttpGet("processing-transactions")]

    public async Task<IActionResult> GetProcessingTransactions(int page = 1, int pageSize = 24, string sortBy = "createdAt", string sortDir = "asc", string? search = null)
    {
        var query = _context.customer_transactions
            .Include(t => t.customer)
            .Include(t => t.payment_transaction)
            .AsQueryable();


        //Filter Processing Only

        query = query.Where(t => t.status == "CONFIRMED");

        //Search

        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.Trim().ToLower();

            query = query.Where(t =>
                EF.Functions.ILike(t.transaction_code ?? "", $"%{search}%") ||
                EF.Functions.ILike(t.customer.first_name ?? "", $"%{search}%") ||
                EF.Functions.ILike(t.customer.last_name ?? "", $"%{search}%")
            );
        }

        //Sorting

        bool asc = sortDir.ToLower() == "asc";

        query = sortBy switch
        {
            "transactionCode" => asc
               ? query.OrderBy(t => t.transaction_code)
               : query.OrderByDescending(t => t.transaction_code),

            "customerName" => asc
                ? query.OrderBy(t => t.customer.first_name)
                : query.OrderByDescending(t => t.customer.first_name),

            "dateConfirmed" => asc
            ? query.OrderBy(t => t.date_confirmed)
            : query.OrderByDescending(t => t.date_confirmed),

            "grandTotal" => asc
                ? query.OrderBy(t => t.grand_total)
                : query.OrderByDescending(t => t.grand_total),

            _ => asc
                ? query.OrderBy(t => t.created_at)
                : query.OrderByDescending(t => t.created_at)
        };

        //Pagination

        var totalCount = await query.CountAsync();

        var data = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new
            {
                id = t.id,
                transactionCode = t.transaction_code,
                customerName = t.customer.first_name + " " + t.customer.last_name,
                paymentMethod = t.payment_transaction.payment_method,
                dateConfimerd = t.date_confirmed,
                grandTotal = t.grand_total,
                createdAt = t.created_at,
                dateConfirmed = t.date_confirmed,
                status = t.status
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


    ////FAILED AND CANCELLED TRANSACTIONS
    [HttpGet("cancelled-failed")]
    public async Task<IActionResult> GetCancelledAndFailedDeliveries(
        int page = 1,
        int pageSize = 10,
        string? search = null)
    {
        var query = _context.deliveries
            .Include(d => d.customer_transaction)
            .Where(d => d.status == "CANCELLED" || d.status == "FAILED")
            .AsQueryable();

        // 🔎 Search
        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.Trim().ToLower();

            query = query.Where(d =>
                EF.Functions.ILike(d.delivery_ref_code ?? "", $"%{search}%") ||
                EF.Functions.ILike(d.customer_transaction.transaction_code ?? "", $"%{search}%")
            );
        }

        var totalCount = await query.CountAsync();

        var deliveries = await query
            .OrderByDescending(d => d.created_at)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(d => new
            {
                d.id,
                d.delivery_ref_code,
                d.courier,
                d.status,
                d.delivery_tries,
                d.date_cancelled,
                d.cancellation_reason,
                d.failed_at,
                d.fail_reason,
                d.fail_reason_code,
                transactionCode = d.customer_transaction.transaction_code
            })
            .ToListAsync();

        return Ok(new
        {
            totalCount,
            page,
            pageSize,
            data = deliveries
        });
    }

}
