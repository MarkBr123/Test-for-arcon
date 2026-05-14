using ARCon_Capstone_2.Data;
using ARCon_Capstone_2.DTOs;
using ARCon_Capstone_2.Models;
using Humanizer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Areas.Shop.Controllers;



[ApiController]
[Route("api/my-shop-orders")]

public class Shop_OrdersApiController : ControllerBase
{
    public readonly ARCon_Capstone_2_DbContext _context;

    public Shop_OrdersApiController(ARCon_Capstone_2_DbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// List down all "Pending Orders" (not confirmed yet)
    /// </summary>
    /// <param name="status"></param>
    /// <param name="page"></param>
    /// <param name="pageSize"></param>
    /// <param name="sortBy"></param>
    /// <returns></returns>
    [HttpGet("my-purchases")]
    public async Task<IActionResult> GetMyPurchases(
        string status = "PENDING_CONFIRMATION",
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

        // normalize inputs
        status = status?.ToUpper();
        sortBy = sortBy?.ToLower();
        page = page < 1 ? 1 : page;
        pageSize = pageSize > 50 ? 50 : pageSize;

        var query = _context.customer_transactions
            .Include(t => t.customer)
            .Include(t => t.payment_transaction)
            .Include(t => t.checkout)
                .ThenInclude(c => c.checkout_items)
                    .ThenInclude(ci => ci.product)
                        .ThenInclude(p => p.manufacturer)
            .Where(t => t.customer_id == customerId.Value);

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(t => t.status == status);
        }

        query = sortBy switch
        {
            "oldest" => query.OrderBy(t => t.created_at),
            "priceasc" => query.OrderBy(t => t.grand_total),
            "pricedesc" => query.OrderByDescending(t => t.grand_total),
            _ => query.OrderByDescending(t => t.created_at)
        };

        var totalCount = await query.CountAsync();

        var rawData = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var data = rawData.Select(t => new
        {
            id = t.id,

            transactionCode = string.IsNullOrWhiteSpace(t.transaction_code)
                ? $"TXN-{t.id}"
                : t.transaction_code,

            customerName = t.customer.first_name + " " + t.customer.last_name,

            paymentMethod = t.payment_transaction != null
                ? t.payment_transaction.payment_method switch
                {
                    "ONLINE_PAYMENT" => "Online Payment",
                    "CASH_ON_DELIVERY" => "Cash on Delivery",
                    _ => t.payment_transaction.payment_method
                }
                : "N/A",

            grandTotal = t.grand_total,
            createdAt = t.created_at,
            status = t.status,
            shippingMethod = t.shipping_method,
            //ITEMS
            items = t.checkout?.checkout_items?.Select(ci => new
            {
                productManufacturer = ci.product?.manufacturer?.brand_name ?? "N/A",
                productSeries = ci.product?.product_series,
                productModel = ci.product?.product_model,
                productSku = ci.product?.sku,

                qty = ci.qty,
                productPrice = ci.product_price
            }).ToList()
        }).ToList();

        return Ok(new
        {
            totalCount,
            page,
            pageSize,
            data
        });
    }


    ///Confirmed
    [HttpGet("my-purchases-processing")]
    public async Task<IActionResult> GetMyPurchasesProcessing(
    string status = "CONFIRMED",
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
        status = status?.ToUpper();
        sortBy = sortBy?.ToLower();
        page = page < 1 ? 1 : page;
        pageSize = pageSize > 50 ? 50 : pageSize;

        // 🔥 BASE QUERY (with NO delivery yet)
        var query = _context.customer_transactions
            .Include(t => t.customer)
            .Include(t => t.payment_transaction)
            .Include(t => t.checkout)
                .ThenInclude(c => c.checkout_items)
                    .ThenInclude(ci => ci.product)
                        .ThenInclude(p => p.manufacturer)
            .Where(t =>
                t.customer_id == customerId.Value &&
                !_context.deliveries.Any(d => d.customer_transaction_id == t.id) // 🔥 KEY FILTER
            );

        // 🔹 status filter
        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(t => t.status == status);
        }

        // 🔹 sorting
        query = sortBy switch
        {
            "oldest" => query.OrderBy(t => t.created_at),
            "priceasc" => query.OrderBy(t => t.grand_total),
            "pricedesc" => query.OrderByDescending(t => t.grand_total),
            _ => query.OrderByDescending(t => t.created_at)
        };

        // 🔹 total count
        var totalCount = await query.CountAsync();

        // 🔹 paginated data
        var rawData = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        // 🔹 projection
        var data = rawData.Select(t => new
        {
            id = t.id,

            transactionCode = string.IsNullOrWhiteSpace(t.transaction_code)
                ? $"TXN-{t.id}"
                : t.transaction_code,

            customerName =
                (t.customer?.first_name ?? "") + " " +
                (t.customer?.last_name ?? ""),

            paymentMethod = t.payment_transaction != null
                ? t.payment_transaction.payment_method switch
                {
                    "ONLINE_PAYMENT" => "Online Payment",
                    "CASH_ON_DELIVERY" => "Cash on Delivery",
                    _ => t.payment_transaction.payment_method
                }
                : "N/A",

            dateConfirmed = t.date_confirmed,

            grandTotal = t.grand_total,
            createdAt = t.created_at,
            status = t.status,
            shippingMethod = t.shipping_method,

            // 🔹 ITEMS
            items = t.checkout?.checkout_items?.Select(ci => new
            {
                productManufacturer = ci.product?.manufacturer?.brand_name ?? "N/A",
                productSeries = ci.product?.product_series,
                productModel = ci.product?.product_model,
                productSku = ci.product?.sku,

                qty = ci.qty,
                productPrice = ci.product_price
            }).ToList()
        }).ToList();

        return Ok(new
        {
            totalCount,
            page,
            pageSize,
            data
        });
    }


    //To ship
    [HttpGet("my-purchases-to-ship")]
    public async Task<IActionResult> GetMyPurchasesToShip(
    string status = "BOOKED",
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
        status = status?.ToUpper();
        sortBy = sortBy?.ToLower();
        page = page < 1 ? 1 : page;
        pageSize = pageSize > 50 ? 50 : pageSize;

        var query = _context.deliveries
            .Where(d =>
                d.customer_transaction.customer_id == customerId.Value
            );

        // 🔹 filter by delivery status (BOOKED = to ship)
        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(d => d.status == status);
        }

        // 🔹 sorting (based on transaction or schedule)
        query = sortBy switch
        {
            "oldest" => query.OrderBy(d => d.customer_transaction.created_at),
            "priceasc" => query.OrderBy(d => d.customer_transaction.grand_total),
            "pricedesc" => query.OrderByDescending(d => d.customer_transaction.grand_total),
            _ => query.OrderByDescending(d => d.customer_transaction.created_at)
        };

        var totalCount = await query.CountAsync();

        var rawData = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(d => new
            {
                // 🔹 DELIVERY INFO
                deliveryId = d.id,
                deliveryCode = d.delivery_ref_code,
                courier = d.courier,
                scheduledDate = d.scheduled_at,

                deliveryAddress =
                    (d.customer_transaction.checkout.delivery_address.house_unit ?? "") + ", " +
                    (d.customer_transaction.checkout.delivery_address.street_name ?? "") + ", " +
                    (d.customer_transaction.checkout.delivery_address.barangay.barangay_name ?? "") + ", " +
                    (d.customer_transaction.checkout.delivery_address.municipality.municipality_name ?? "") + ", " +
                    (d.customer_transaction.checkout.delivery_address.province.province_name ?? "") + ", " +
                    (d.customer_transaction.checkout.delivery_address.region.region_name ?? "") + " " +
                    (d.customer_transaction.checkout.delivery_address.zip_code ?? ""),

                // 🔹 TRANSACTION INFO
                id = d.customer_transaction.id,

                transactionCode = string.IsNullOrWhiteSpace(d.customer_transaction.transaction_code)
                    ? "TXN-" + d.customer_transaction.id
                    : d.customer_transaction.transaction_code,

                customerName =
                    (d.customer_transaction.customer.first_name ?? "") + " " +
                    (d.customer_transaction.customer.last_name ?? ""),

                paymentMethod = d.customer_transaction.payment_transaction != null
                    ? d.customer_transaction.payment_transaction.payment_method == "ONLINE_PAYMENT"
                        ? "Online Payment"
                        : d.customer_transaction.payment_transaction.payment_method == "CASH_ON_DELIVERY"
                            ? "Cash on Delivery"
                            : d.customer_transaction.payment_transaction.payment_method
                    : "N/A",

                dateConfirmed = d.customer_transaction.date_confirmed,
                grandTotal = d.customer_transaction.grand_total,
                createdAt = d.customer_transaction.created_at,


                // 🔥 IMPORTANT: separate statuses
                deliveryStatus = d.status,
                transactionStatus = d.customer_transaction.status,

                shippingMethod = d.customer_transaction.shipping_method,

                // 🔹 ITEMS
                items = d.customer_transaction.checkout.checkout_items.Select(ci => new
                {
                    productManufacturer = ci.product.manufacturer.brand_name ?? "N/A",
                    productSeries = ci.product.product_series,
                    productModel = ci.product.product_model,
                    productSku = ci.product.sku,

                    qty = ci.qty,
                    productPrice = ci.product_price
                }).ToList()
            })
            .ToListAsync();

        return Ok(new
        {
            totalCount,
            page,
            pageSize,
            data = rawData
        });
    }

    //In transit
    [HttpGet("my-purchases-in-transit")]
    public async Task<IActionResult> GetMyPurchasesInTransit(
        string status = "IN_TRANSIT",
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
                status = status?.ToUpper();
                sortBy = sortBy?.ToLower();
                page = page < 1 ? 1 : page;
                pageSize = pageSize > 50 ? 50 : pageSize;

                var query = _context.deliveries
                    .Where(d =>
                        d.customer_transaction.customer_id == customerId.Value
                    );

                // filter by delivery status (BOOKED = to ship)
                if (!string.IsNullOrEmpty(status))
                {
                    query = query.Where(d => d.status == status);
                }

                // sorting (based on transaction or schedule)
                query = sortBy switch
                {
                    "oldest" => query.OrderBy(d => d.customer_transaction.created_at),
                    "priceasc" => query.OrderBy(d => d.customer_transaction.grand_total),
                    "pricedesc" => query.OrderByDescending(d => d.customer_transaction.grand_total),
                    _ => query.OrderByDescending(d => d.customer_transaction.created_at)
                };

                var totalCount = await query.CountAsync();

                var rawData = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(d => new
                    {
                        // DELIVERY INFO
                        deliveryId = d.id,
                        deliveryCode = d.delivery_ref_code,
                        courier = d.courier,
                        scheduledDate = d.scheduled_at,

                        deliveryAddress =
                            (d.customer_transaction.checkout.delivery_address.house_unit ?? "") + ", " +
                            (d.customer_transaction.checkout.delivery_address.street_name ?? "") + ", " +
                            (d.customer_transaction.checkout.delivery_address.barangay.barangay_name ?? "") + ", " +
                            (d.customer_transaction.checkout.delivery_address.municipality.municipality_name ?? "") + ", " +
                            (d.customer_transaction.checkout.delivery_address.province.province_name ?? "") + ", " +
                            (d.customer_transaction.checkout.delivery_address.region.region_name ?? "") + " " +
                            (d.customer_transaction.checkout.delivery_address.zip_code ?? ""),

                        // TRANSACTION INFO
                        id = d.customer_transaction.id,

                        transactionCode = string.IsNullOrWhiteSpace(d.customer_transaction.transaction_code)
                            ? "TXN-" + d.customer_transaction.id
                            : d.customer_transaction.transaction_code,

                        customerName =
                            (d.customer_transaction.customer.first_name ?? "") + " " +
                            (d.customer_transaction.customer.last_name ?? ""),

                        paymentMethod = d.customer_transaction.payment_transaction != null
                            ? d.customer_transaction.payment_transaction.payment_method == "ONLINE_PAYMENT"
                                ? "Online Payment"
                                : d.customer_transaction.payment_transaction.payment_method == "CASH_ON_DELIVERY"
                                    ? "Cash on Delivery"
                                    : d.customer_transaction.payment_transaction.payment_method
                            : "N/A",

                        dateConfirmed = d.customer_transaction.date_confirmed,
                        grandTotal = d.customer_transaction.grand_total,
                        createdAt = d.customer_transaction.created_at,
                        inTransitAt = d.in_transit_at,

                        // Important: separate statuses
                        deliveryStatus = d.status,
                        transactionStatus = d.customer_transaction.status,

                        shippingMethod = d.customer_transaction.shipping_method,

                        // product items
                        items = d.customer_transaction.checkout.checkout_items.Select(ci => new
                        {
                            productManufacturer = ci.product.manufacturer.brand_name ?? "N/A",
                            productSeries = ci.product.product_series,
                            productModel = ci.product.product_model,
                            productSku = ci.product.sku,

                            qty = ci.qty,
                            productPrice = ci.product_price
                        }).ToList()
                    })
                    .ToListAsync();

                return Ok(new
                {
                    totalCount,
                    page,
                    pageSize,
                    data = rawData
                });
            }

    // Order Delivered //
    [HttpGet("my-purchases-delivered")]
    public async Task<IActionResult> GetMyPurchasesDelivered(
        string status = "DELIVERED",
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
        status = status?.ToUpper();
        sortBy = sortBy?.ToLower();
        page = page < 1 ? 1 : page;
        pageSize = pageSize > 50 ? 50 : pageSize;

        var query = _context.deliveries
            .Where(d =>
                d.customer_transaction.customer_id == customerId.Value
            );

        // filter by delivery status
        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(d => d.status == status);
        }

        // sorting
        query = sortBy switch
        {
            "oldest" => query.OrderBy(d => d.customer_transaction.created_at),

            "priceasc" => query.OrderBy(d =>
                d.customer_transaction.grand_total),

            "pricedesc" => query.OrderByDescending(d =>
                d.customer_transaction.grand_total),

            _ => query.OrderByDescending(d =>
                d.customer_transaction.created_at)
        };

        var totalCount = await query.CountAsync();

        var rawData = await query

            .Skip((page - 1) * pageSize)

            .Take(pageSize)

            .Select(d => new
            {
                // =========================
                // DELIVERY INFO
                // =========================

                deliveryId = d.id,

                deliveryCode = d.delivery_ref_code,

                courier = d.courier,

                scheduledDate = d.scheduled_at,

                deliveryAddress =
                    (d.customer_transaction.checkout.delivery_address.house_unit ?? "") + ", " +
                    (d.customer_transaction.checkout.delivery_address.street_name ?? "") + ", " +
                    (d.customer_transaction.checkout.delivery_address.barangay.barangay_name ?? "") + ", " +
                    (d.customer_transaction.checkout.delivery_address.municipality.municipality_name ?? "") + ", " +
                    (d.customer_transaction.checkout.delivery_address.province.province_name ?? "") + ", " +
                    (d.customer_transaction.checkout.delivery_address.region.region_name ?? "") + " " +
                    (d.customer_transaction.checkout.delivery_address.zip_code ?? ""),

                // =========================
                // TRANSACTION INFO
                // =========================

                id = d.customer_transaction.id,

                transactionCode =
                    string.IsNullOrWhiteSpace(
                        d.customer_transaction.transaction_code
                    )
                        ? "TXN-" + d.customer_transaction.id
                        : d.customer_transaction.transaction_code,

                // =========================
                // CUSTOMER RATING
                // =========================

                isRated = _context.customer_ratings
                    .Any(r =>
                        r.transaction_id ==
                            d.customer_transaction.id

                        &&

                        r.customer_id ==
                            customerId.Value
                    ),

                // =========================
                // CUSTOMER
                // =========================

                customerName =
                    (d.customer_transaction.customer.first_name ?? "") + " " +
                    (d.customer_transaction.customer.last_name ?? ""),

                // =========================
                // PAYMENT
                // =========================

                paymentMethod =
                    d.customer_transaction.payment_transaction != null

                        ? d.customer_transaction
                            .payment_transaction
                            .payment_method == "ONLINE_PAYMENT"

                            ? "Online Payment"

                            : d.customer_transaction
                                .payment_transaction
                                .payment_method == "CASH_ON_DELIVERY"

                                ? "Cash on Delivery"

                                : d.customer_transaction
                                    .payment_transaction
                                    .payment_method

                        : "N/A",

                // =========================
                // DATES
                // =========================

                dateConfirmed =
                    d.customer_transaction.date_confirmed,

                createdAt =
                    d.customer_transaction.created_at,

                inTransitAt =
                    d.in_transit_at,

                deliveredAt =
                    d.delivered_at,

                // =========================
                // OUTRIGHT WARRANTY
                // =========================

                isOutrightReplacementEligible =

                    d.delivered_at.HasValue &&

                    DateTime.UtcNow <=

                    d.delivered_at.Value.AddDays(

                        d.customer_transaction
                            .checkout
                            .checkout_items

                            .Max(ci =>
                                ci.product
                                    .outright_replacement_days ?? 0
                            )
                    ),

                remainingWarrantyDays =

                    d.delivered_at.HasValue

                        ?

                        (
                            d.delivered_at.Value.AddDays(

                                d.customer_transaction
                                    .checkout
                                    .checkout_items

                                    .Max(ci =>
                                        ci.product
                                            .outright_replacement_days ?? 0
                                    )
                            ).Date

                            -

                            DateTime.UtcNow.Date
                        ).Days

                        : -1,

                // =========================
                // TOTALS
                // =========================

                grandTotal =
                    d.customer_transaction.grand_total,

                // =========================
                // STATUSES
                // =========================

                deliveryStatus =
                    d.status,

                transactionStatus =
                    d.customer_transaction.status,

                shippingMethod =
                    d.customer_transaction.shipping_method,

                // =========================
                // ITEMS
                // =========================

                items = d.customer_transaction
                    .checkout
                    .checkout_items

                    .Select(ci => new
                    {
                        productManufacturer =
                            ci.product.manufacturer.brand_name ?? "N/A",

                        productSeries =
                            ci.product.product_series,

                        productModel =
                            ci.product.product_model,

                        productSku =
                            ci.product.sku,

                        qty =
                            ci.qty,

                        productPrice =
                            ci.product_price
                    })
                    .ToList()
            })

            .ToListAsync();

        return Ok(new
        {
            totalCount,
            page,
            pageSize,
            data = rawData
        });
    }

    //Rejected
    [HttpGet("my-purchases-rejected")]
    public async Task<IActionResult> GetMyPurchasesRejected(
        string status = "REJECTED",
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

        // normalize inputs
        status = status?.ToUpper();
        sortBy = sortBy?.ToLower();
        page = page < 1 ? 1 : page;
        pageSize = pageSize > 50 ? 50 : pageSize;

        var query = _context.customer_transactions
            .Include(t => t.customer)
            .Include(t => t.payment_transaction)
            .Include(t => t.checkout)
                .ThenInclude(c => c.checkout_items)
                    .ThenInclude(ci => ci.product)
                        .ThenInclude(p => p.manufacturer)
            .Where(t => t.customer_id == customerId.Value);

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(t => t.status == status);
        }

        query = sortBy switch
        {
            "oldest" => query.OrderBy(t => t.created_at),
            "priceasc" => query.OrderBy(t => t.grand_total),
            "pricedesc" => query.OrderByDescending(t => t.grand_total),
            _ => query.OrderByDescending(t => t.created_at)
        };

        var totalCount = await query.CountAsync();

        var rawData = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var data = rawData.Select(t => new
        {
            id = t.id,

            transactionCode = string.IsNullOrWhiteSpace(t.transaction_code)
                ? $"TXN-{t.id}"
                : t.transaction_code,

            customerName = t.customer.first_name + " " + t.customer.last_name,

            paymentMethod = t.payment_transaction != null
                ? t.payment_transaction.payment_method switch
                {
                    "ONLINE_PAYMENT" => "Online Payment",
                    "CASH_ON_DELIVERY" => "Cash on Delivery",
                    _ => t.payment_transaction.payment_method
                }
                : "N/A",

            grandTotal = t.grand_total,
            createdAt = t.created_at,
            status = t.status,
            shippingMethod = t.shipping_method,
            rejectedAt = t.date_rejected,

            //ITEMS
            items = t.checkout?.checkout_items?.Select(ci => new
            {
                productManufacturer = ci.product?.manufacturer?.brand_name ?? "N/A",
                productSeries = ci.product?.product_series,
                productModel = ci.product?.product_model,
                productSku = ci.product?.sku,

                qty = ci.qty,
                productPrice = ci.product_price
            }).ToList()
        }).ToList();

        return Ok(new
        {
            totalCount,
            page,
            pageSize,
            data
        });
    }


    [HttpPut("{id}/cancel")]
    public async Task<IActionResult> CancelOrderByCustomer(int id, [FromBody] CancelOrderDto dto)
    {
        var customerId = HttpContext.Session.GetInt32("UserId");

        if (customerId == null)
            return Unauthorized();

        var transaction = await _context.customer_transactions
            .Include(t => t.payment_transaction)
            .FirstOrDefaultAsync(t => t.id == id && t.customer_id == customerId);

        if (transaction == null)
            return NotFound();

        // Allow cancel ONLY in specific statuses
        if (transaction.status != "PENDING_CONFIRMATION" && transaction.status != "CONFIRMED")
            return BadRequest("This order can no longer be cancelled.");

        //Prevent double cancel
        if (transaction.status == "CANCELLED" || transaction.status == "CANCELLED_FOR_REFUND")
            return BadRequest("Order is already cancelled.");

        //Require reason
        if (string.IsNullOrWhiteSpace(dto.CancellationReason))
            return BadRequest("Cancellation reason is required.");

        //Determine status (refund logic)
        string newStatus = "CANCELLED";

        if (transaction.payment_method == "ONLINE_PAYMENT" &&
            transaction.payment_transaction != null &&
            transaction.payment_transaction.paymongo_status == "PAID")
        {
            newStatus = "CANCELLED_FOR_REFUND";
        }

        //Apply update
        transaction.status = newStatus;
        transaction.cancelled_at = DateTime.UtcNow;
        transaction.cancelled_by = "CUSTOMER";
        transaction.cancellation_reason = dto.CancellationReason;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Your order has been cancelled successfully.",
            status = newStatus,
            cancelledAt = transaction.cancelled_at,
            reason = transaction.cancellation_reason
        });
    }

    [HttpGet("my-purchases-cancelled-orders")]
    public async Task<IActionResult> GetMyPurchasesCancelledOrders(
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

        var cancelledStatuses = new[] { "CANCELLED", "CANCELLED_FOR_REFUND" };

        var query = _context.customer_transactions
            .Include(t => t.customer)
            .Include(t => t.payment_transaction)
            .Include(t => t.checkout)
                .ThenInclude(c => c.checkout_items)
                    .ThenInclude(ci => ci.product)
                        .ThenInclude(p => p.manufacturer)
            .Where(t => t.customer_id == customerId.Value &&
                        cancelledStatuses.Contains(t.status));

        // sorting
        query = sortBy switch
        {
            "oldest" => query.OrderBy(t => t.created_at),
            "priceasc" => query.OrderBy(t => t.grand_total),
            "pricedesc" => query.OrderByDescending(t => t.grand_total),
            _ => query.OrderByDescending(t => t.created_at)
        };

        var totalCount = await query.CountAsync();

        var rawData = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var data = rawData.Select(t => new
        {
            id = t.id,

            transactionCode = string.IsNullOrWhiteSpace(t.transaction_code)
                ? $"TXN-{t.id}"
                : t.transaction_code,
            
            cancellationReason = t.cancellation_reason,
            cancelledAt = t.cancelled_at,
            customerName = t.customer.first_name + " " + t.customer.last_name,

            paymentMethod = t.payment_transaction != null
                ? t.payment_transaction.payment_method switch
                {
                    "ONLINE_PAYMENT" => "Online Payment",
                    "CASH_ON_DELIVERY" => "Cash on Delivery",
                    _ => t.payment_transaction.payment_method
                }
                : "N/A",

            grandTotal = t.grand_total,
            createdAt = t.created_at,
            status = t.status,
            shippingMethod = t.shipping_method,

            items = t.checkout?.checkout_items?.Select(ci => new
            {
                productManufacturer = ci.product?.manufacturer?.brand_name ?? "N/A",
                productSeries = ci.product?.product_series,
                productModel = ci.product?.product_model,
                productSku = ci.product?.sku,

                qty = ci.qty,
                productPrice = ci.product_price
            }).ToList()
        }).ToList();

        return Ok(new
        {
            totalCount,
            page,
            pageSize,
            data
        });
    }

    //Summary
    [HttpGet("{transactionId}/view-summary")]
    public async Task<IActionResult> GetViewSummary(int transactionId)
    {
        var customerId = HttpContext.Session.GetInt32("UserId");

        if (customerId == null)
            return Unauthorized();

        var transaction = await _context.customer_transactions
            .AsNoTracking()

            // 🔹 Customer + Payment
            .Include(ct => ct.customer)
            .Include(ct => ct.payment_transaction)

            // 🔹 Checkout → Items → Product
            .Include(ct => ct.checkout)
                .ThenInclude(c => c.checkout_items)
                    .ThenInclude(ci => ci.product)
                        .ThenInclude(p => p.manufacturer)

            // 🔥 DELIVERY WITH SERIALS
            .Include(ct => ct.deliveries)
                .ThenInclude(d => d.delivery_items)
                    .ThenInclude(di => di.inventory)

            .Include(ct => ct.deliveries)
                .ThenInclude(d => d.delivery_items)
                    .ThenInclude(di => di.checkout_item)
                        .ThenInclude(ci => ci.product)
                            .ThenInclude(p => p.manufacturer)

            // 🔥 OUTRIGHT REPLACEMENTS
            .Include(ct => ct.outright_replacement_warranties)
                .ThenInclude(w => w.outright_replacement_warranty_items)
                    .ThenInclude(i => i.product)

            .Include(ct => ct.outright_replacement_warranties)
                .ThenInclude(w => w.outright_replacement_warranty_items)
                    .ThenInclude(i => i.original_inventory)

            .Include(ct => ct.outright_replacement_warranties)
                .ThenInclude(w => w.outright_replacement_warranty_items)
                    .ThenInclude(i => i.replacement_inventory)
                        .ThenInclude(ri => ri.product)

            .FirstOrDefaultAsync(ct =>
                ct.id == transactionId &&
                ct.customer_id == customerId);

        if (transaction == null)
            return NotFound("Transaction not found.");

        var payment = transaction.payment_transaction;

        // 🔥 GET ACTUAL DELIVERED RECORD
        var delivered = transaction.deliveries?
            .FirstOrDefault(d => d.delivered_at != null);

        // 🔥 SAFE FLATTEN
        var deliveryItems = transaction.deliveries?
            .Where(d => d.delivery_items != null)
            .SelectMany(d => d.delivery_items)
            .ToList() ?? new List<delivery_item>();

        return Ok(new
        {
            transactionCode = transaction.transaction_code,
            status = transaction.status,
            createdAt = transaction.created_at,

            paymentMethod = transaction.payment_method,
            paymentStatus = payment?.paymongo_status ?? payment?.cod_status,

            shippingMethod = transaction.shipping_method,
            grandTotal = transaction.grand_total,

            deliveredAt = delivered?.delivered_at,

            // 🔥 ITEMS WITH SERIALS
            items = deliveryItems.Select(di => new
            {
                productId = di.checkout_item.product_id,
                productBrand = di.checkout_item?.product?.manufacturer?.brand_name,
                productSeries = di.checkout_item?.product?.product_series,
                productModel = di.checkout_item?.product?.product_model,
                productSku = di.checkout_item?.product?.sku,

                quantity = di.checkout_item?.qty,
                productPrice = di.checkout_item?.product_price,

                serialNumber = di.inventory?.serial_number
            }).ToList(),

            // 🔥 REPLACEMENT ITEMS
            replacementItems =
                transaction
                    .outright_replacement_warranties

                    .SelectMany(w =>
                        w.outright_replacement_warranty_items)

                    .Select(item => new
                    {
                        item.id,

                        defectiveProduct =

                            $"{item.product.product_series} " +
                            $"{item.product.product_model}",

                        defectiveSerial =
                            item.original_inventory
                                ?.serial_number,

                        replacementProduct =

                            item.replacement_inventory != null

                                ? $"{item.replacement_inventory.product.product_series} " +
                                  $"{item.replacement_inventory.product.product_model}"

                                : null,

                        replacementSerial =
                            item.replacement_inventory
                                ?.serial_number,

                        replacementStatus =
                            item.replacement_inventory
                                ?.status
                    }).ToList()
        });
    }


    /// To be Used For Outright Replacement Warranty
    [HttpGet("outright-replacement/eligible-items/{transactionId}")]
    public async Task<IActionResult> GetEligibleOutrightReplacementItems(int transactionId)
    {
        // ================= SESSION =================
        var customerId = HttpContext.Session.GetInt32("UserId");
        var userType = HttpContext.Session.GetString("UserType");

        if (customerId == null || userType != "CUSTOMER")
        {
            return Unauthorized(new
            {
                message = "Unauthorized."
            });
        }

        // ================= TRANSACTION =================
        var transaction = await _context.customer_transactions

            // CUSTOMER
            .Include(ct => ct.customer)

            // PAYMENT
            .Include(ct => ct.payment_transaction)

            // CHECKOUT + ADDRESS
            .Include(ct => ct.checkout)
                .ThenInclude(c => c.delivery_address)
                    .ThenInclude(a => a.barangay)

            .Include(ct => ct.checkout)
                .ThenInclude(c => c.delivery_address)
                    .ThenInclude(a => a.municipality)

            .Include(ct => ct.checkout)
                .ThenInclude(c => c.delivery_address)
                    .ThenInclude(a => a.province)

            .Include(ct => ct.checkout)
                .ThenInclude(c => c.delivery_address)
                    .ThenInclude(a => a.region)

            // DELIVERIES
            .Include(ct => ct.deliveries)
                .ThenInclude(d => d.delivery_items)
                    .ThenInclude(di => di.inventory)
                        .ThenInclude(i => i.product)
                            .ThenInclude(p => p.manufacturer)

            .Include(ct => ct.deliveries)
                .ThenInclude(d => d.delivery_items)
                    .ThenInclude(di => di.checkout_item)

            .FirstOrDefaultAsync(ct =>
                ct.id == transactionId &&
                ct.customer_id == customerId
            );

        if (transaction == null)
        {
            return NotFound(new
            {
                message = "Transaction not found."
            });
        }

        // ================= DELIVERED DELIVERY =================
        var deliveredDelivery = transaction.deliveries
            .FirstOrDefault(d => d.status == "DELIVERED");

        if (deliveredDelivery == null)
        {
            return BadRequest(new
            {
                message = "No completed delivery found."
            });
        }

        // ================= ADDRESS =================
        var address = transaction.checkout?.delivery_address;

        var formattedAddress = address != null
            ? $"{address.house_unit}, {address.street_name}, " +
              $"{address.barangay?.barangay_name}, " +
              $"{address.municipality?.municipality_name}, " +
              $"{address.province?.province_name}, " +
              $"{address.region?.region_name} {address.zip_code}"
            : null;

        // ================= PAYMENT =================
        var payment = transaction.payment_transaction;

        // ================= ITEMS =================
        var items = new List<object>();

        foreach (var di in deliveredDelivery.delivery_items)
        {
            if (di.inventory == null)
                continue;

            if (di.inventory.product == null)
                continue;

            var product = di.inventory.product;

            // ================= WARRANTY =================
            int outrightDays =
                product.outright_replacement_days ?? 0;

            bool eligible = false;

            int remainingDays = 0;

            if (deliveredDelivery.delivered_at.HasValue)
            {
                var expiryDate =
                    deliveredDelivery.delivered_at.Value
                        .AddDays(outrightDays);

                remainingDays =
                    (expiryDate.Date - DateTime.Now.Date).Days;

                eligible = remainingDays >= 0;
            }

            // ================= CLAIM CHECK =================
            bool alreadyClaimed =
                await _context.outright_replacement_warranty_items
                    .AnyAsync(w =>
                        w.original_inventory_id == di.inventory.id
                    );

            items.Add(new
            {
                // IDS
                deliveryItemId = di.id,
                inventoryId = di.inventory.id,
                productId = product.id,

                // PRODUCT
                productBrand = product.manufacturer.brand_name,
                productSeries = product.product_series,
                productModel = product.product_model,
                productSku = product.sku,

                // SERIALIZED UNIT
                serialNumber = di.inventory.serial_number,

                // INSTALLATION OPTIONS
                standardInstallationOptionId =
                    di.checkout_item.std_installation_option_id,

                additionalInstallationOptionId =
                    di.checkout_item.additional_installation_option_id,

                standardInstallationPrice =
                    di.checkout_item.std_installation_price,

                additionalInstallationPrice =
                    di.checkout_item.additional_installation_price,

                // PRICING
                productPrice = di.checkout_item.product_price,
                totalItemAmount = di.checkout_item.total_item_amount,

                // DELIVERY
                deliveredAt = deliveredDelivery.delivered_at,

                // WARRANTY
                outrightReplacementDays = outrightDays,
                remainingDays = remainingDays,

                eligible = eligible,
                alreadyClaimed = alreadyClaimed
            });
        }

        // ================= RESPONSE =================
        return Ok(new
        {
            // TRANSACTION
            transactionId = transaction.id,
            transactionCode = transaction.transaction_code,
            transactionPlacedAt = transaction.created_at,

            // CUSTOMER
            customerName =
                (transaction.customer?.first_name ?? "") + " " +
                (transaction.customer?.last_name ?? ""),

            customerContactNo =
                transaction.customer?.contact_no,

            customerEmail =
                transaction.customer?.email,

            // DELIVERY
            shippingMethod = transaction.shipping_method,
            deliveredAt = deliveredDelivery.delivered_at,
            courier = deliveredDelivery.courier,

            // ADDRESS
            deliveryAddress = formattedAddress,

            // PAYMENT
            paymentMethod = transaction.payment_method,
            paymentStatus =
                payment?.paymongo_status ??
                payment?.cod_status,

            // TOTAL
            grandTotal = transaction.grand_total,

            // ITEMS
            items = items
        });
    }

}
