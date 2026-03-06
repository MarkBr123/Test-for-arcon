using ARCon_Capstone_2.Models;
using ARCon_Capstone_2.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ARCon_Capstone_2.Services;
using System.Runtime.CompilerServices;
using ARCon_Capstone_2.Data;
using ARCon_Capstone_2.DTOs;
namespace ARCon_Capstone_2.Areas.Admin.Controllers;


[Route("api/delivery")]
public class DeliveryApiController : ControllerBase
{
    private readonly ARCon_Capstone_2_DbContext _context;
    public DeliveryApiController(ARCon_Capstone_2_DbContext context)
    {
        _context = context;
    }

    [HttpGet("transaction/{transactionId}/items")]
    public async Task<IActionResult> GetTransactionDeliveryItems(int transactionId)
    {

        var transaction = await _context.customer_transactions
            .FirstOrDefaultAsync(t => t.id == transactionId);

        if (transaction == null)
            return NotFound("Transaction not found.");

        if (transaction.status != "CONFIRMED")
            return BadRequest("Transaction is not confirmed.");


        var checkoutItems = await _context.checkout_items
            .Where(ci => ci.checkout_id == transaction.checkout_id)
            .ToListAsync();

        var result = new List<object>();

        foreach (var item in checkoutItems)
        {
            // 3️⃣ Get product info
            var product = await _context.products
                .FirstOrDefaultAsync(p => p.id == item.product_id);

            if (product == null)
                continue;


            var availableInventory = await _context.inventories
                .Where(i =>
                    i.product_id == item.product_id &&
                    i.status == "GOOD_STOCK")
                .Select(i => new
                {
                    inventoryId = i.id,
                    serialNumber = i.serial_number,
                    grossWeight = product.total_gross_weight
                })
                .ToListAsync();

            result.Add(new
            {
                checkoutItemId = item.id,
                productId = product.id,
                productName = product.product_series + product.product_model,
                sku = product.sku,
                orderedQty = item.qty,
                stockAvailable = availableInventory.Count,
                availableSerials = availableInventory
            });
        }

        return Ok(new
        {
            transactionId = transaction.id,
            checkoutId = transaction.checkout_id,
            items = result
        });
    }

    //delivery post
    [HttpPost]
    public async Task<IActionResult> CreateDelivery([FromBody] CreateDeliveryDto dto)
    {
        if (dto == null || dto.SelectedInventory == null || !dto.SelectedInventory.Any())
            return BadRequest("Invalid delivery data.");

        using var tx = await _context.Database.BeginTransactionAsync();

        try
        {
            // 1️⃣ Get transaction
            var transaction = await _context.customer_transactions
                .FirstOrDefaultAsync(t => t.id == dto.TransactionId);

            if (transaction == null)
                return NotFound("Transaction not found.");

            if (transaction.status != "CONFIRMED")
                return BadRequest("Transaction must be CONFIRMED before delivery.");

            // 2️⃣ Prevent active delivery
            bool hasActiveDelivery = await _context.deliveries
                .AnyAsync(d =>
                    d.customer_transaction_id == dto.TransactionId &&
                    (d.status == "BOOKED" || d.status == "IN_TRANSIT")
                );

            if (hasActiveDelivery)
                return BadRequest("Active delivery already exists.");

            // 3️⃣ Get checkout items
            var checkoutItems = await _context.checkout_items
                .Where(ci => ci.checkout_id == transaction.checkout_id)
                .ToListAsync();

            if (!checkoutItems.Any())
                return BadRequest("No checkout items found.");

            // 4️⃣ Validate exact quantity match
            foreach (var selection in dto.SelectedInventory)
            {
                var checkoutItem = checkoutItems
                    .FirstOrDefault(ci => ci.id == selection.CheckoutItemId);

                if (checkoutItem == null)
                    return BadRequest("Invalid checkout item.");

                if (selection.InventoryIds.Count != checkoutItem.qty)
                    return BadRequest("Selected inventory count must match ordered quantity.");
            }

            // 5️⃣ Flatten all inventory IDs
            var allInventoryIds = dto.SelectedInventory
                .SelectMany(s => s.InventoryIds)
                .ToList();

            var inventories = await _context.inventories
                .Where(i => allInventoryIds.Contains(i.id))
                .ToListAsync();

            if (inventories.Count != allInventoryIds.Count)
                return BadRequest("Some inventory not found.");

            if (inventories.Any(i => i.status != "GOOD_STOCK"))
                return BadRequest("Some inventory items are not available.");

            // 6️⃣ Determine retry count
            var lastDelivery = await _context.deliveries
                .Where(d => d.customer_transaction_id == dto.TransactionId)
                .OrderByDescending(d => d.created_at)
                .FirstOrDefaultAsync();

            int nextTry = lastDelivery != null
                ? lastDelivery.delivery_tries + 1
                : 1;

            // 7️⃣ Generate delivery code
            var deliveryCode = GenerateDeliveryCode(
                transaction.transaction_code,
                nextTry
            );


            // 🚫 Prevent past scheduled date
            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            if (dto.ScheduledDate < today)
            {
                return BadRequest("Scheduled date cannot be in the past.");
            }


            var delivery = new delivery
            {
                customer_transaction_id = dto.TransactionId,
                delivery_ref_code = deliveryCode,
                courier = dto.Courier,
                status = "BOOKED",
                scheduled_at = dto.ScheduledDate,
                tracking_number = dto.TrackingNumber,
                delivery_tries = nextTry,
                schedule_status = "SCHEDULED",
                created_at = DateTime.UtcNow
            };

            _context.deliveries.Add(delivery);
            await _context.SaveChangesAsync(); // we need delivery.id


            // 9️⃣ Preload product weights (avoid N+1 query)
            var productWeights = await _context.products
                .Where(p => inventories.Select(i => i.product_id).Contains(p.id))
                .ToDictionaryAsync(p => p.id, p => p.total_gross_weight ?? 0m);


            decimal totalWeight = 0m;


            // 🔟 Insert delivery_items + reserve inventory
            foreach (var selection in dto.SelectedInventory)
            {
                foreach (var inventoryId in selection.InventoryIds)
                {
                    var inv = inventories.First(i => i.id == inventoryId);

                    _context.delivery_items.Add(new delivery_item
                    {
                        delivery_id = delivery.id,
                        checkout_item_id = selection.CheckoutItemId,
                        inventory_id = inventoryId,
                        created_at = DateTime.UtcNow
                    });

                    // Reserve inventory
                    inv.status = "RESERVED_FOR_DELIVERY";
                    inv.updated_at = DateTime.UtcNow;

                    // Add product weight (1 inventory = 1 unit)
                    totalWeight += productWeights[inv.product_id];
                }
            }


            // 1️⃣1️⃣ Assign final computed weight
            // Assign final computed weight
            delivery.deliverytotalweight = totalWeight;

            // 🔥 Mark transaction as having active delivery
            transaction.has_active_delivery = true;

            await _context.SaveChangesAsync();
            await tx.CommitAsync();

            return Ok(new
            {
                message = "Delivery created successfully.",
                deliveryId = delivery.id,
                deliveryCode = delivery.delivery_ref_code
            });
        }
        catch (Exception ex)
        {
            await tx.RollbackAsync();

            var realError = ex.InnerException?.Message ?? ex.Message;

            return BadRequest(realError);
        }
    }

    private string GenerateDeliveryCode(string transactionCode, int deliveryTry)
    {
        var cleanCode = transactionCode
            .Replace(" ", "")
            .Replace("/", "")
            .Replace("\\", "")
            .ToUpper();

        return $"DLV-{cleanCode}-{deliveryTry}";
    }

    [HttpGet("booked")]
    public async Task<IActionResult> GetBookedDeliveries(
        int page = 1,
        int pageSize = 20,
        string? search = null,
        string sortBy = "createdAt",
        string sortDir = "desc")
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;

        var query = _context.deliveries
            .Where(d => d.status == "BOOKED")
            .Include(d => d.customer_transaction)
                .ThenInclude(t => t.customer)
            .AsQueryable();

        // 🔎 SEARCH
        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.Trim();

            query = query.Where(d =>
                EF.Functions.ILike(d.delivery_ref_code ?? "", $"%{search}%") ||
                EF.Functions.ILike(d.customer_transaction.transaction_code ?? "", $"%{search}%") ||
                EF.Functions.ILike(d.customer_transaction.customer.first_name ?? "", $"%{search}%") ||
                EF.Functions.ILike(d.customer_transaction.customer.last_name ?? "", $"%{search}%") ||
                EF.Functions.ILike(d.courier ?? "", $"%{search}%")
            );
        }

        // 🔀 SORTING
        bool asc = sortDir.ToLower() == "asc";

        query = sortBy switch
        {
            "deliveryRefCode" => asc
                ? query.OrderBy(d => d.delivery_ref_code)
                : query.OrderByDescending(d => d.delivery_ref_code),

            "transactionCode" => asc
                ? query.OrderBy(d => d.customer_transaction.transaction_code)
                : query.OrderByDescending(d => d.customer_transaction.transaction_code),

            "customerName" => asc
                ? query.OrderBy(d => d.customer_transaction.customer.first_name)
                       .ThenBy(d => d.customer_transaction.customer.last_name)
                : query.OrderByDescending(d => d.customer_transaction.customer.first_name)
                       .ThenByDescending(d => d.customer_transaction.customer.last_name),

            "courier" => asc
                ? query.OrderBy(d => d.courier)
                : query.OrderByDescending(d => d.courier),

            "scheduledAt" => asc
                ? query.OrderBy(d => d.scheduled_at)
                : query.OrderByDescending(d => d.scheduled_at),

            "scheduleStatus" => asc
                ? query.OrderBy(d => d.schedule_status)
                : query.OrderByDescending(d => d.schedule_status),

            _ => asc
                ? query.OrderBy(d => d.created_at)
                : query.OrderByDescending(d => d.created_at)
        };

        var totalCount = await query.CountAsync();

        var deliveries = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(d => new
            {
                deliveryId = d.id,
                deliveryCode = d.delivery_ref_code,
                transactionId = d.customer_transaction_id,
                transactionCode = d.customer_transaction.transaction_code,
                customerName = d.customer_transaction.customer.first_name + " " +
                               d.customer_transaction.customer.last_name,
                courier = d.courier,
                scheduledDate = d.scheduled_at,
                deliveryTry = d.delivery_tries,
                totalWeight = d.deliverytotalweight,
                scheduleStatus = d.schedule_status,
                createdAt = d.created_at
            })
            .ToListAsync();

        return Ok(new
        {
            totalCount,
            page,
            pageSize,
            deliveries
        });
    }

    // get by id for summary

    [HttpGet("{id}")]
    public async Task<IActionResult> GetDeliveryById(int id)
    {
        var delivery = await _context.deliveries
            .Where(d => d.id == id)
            .Include(d => d.customer_transaction)
                .ThenInclude(t => t.customer)
            .Include(d => d.delivery_items)
                .ThenInclude(di => di.inventory)
                    .ThenInclude(i => i.product)
            .FirstOrDefaultAsync();

        if (delivery == null)
            return NotFound("Delivery not found.");

        var result = new
        {
            deliveryId = delivery.id,
            deliveryCode = delivery.delivery_ref_code,
            courier = delivery.courier,
            status = delivery.status,
            scheduleStatus = delivery.schedule_status,
            scheduledAt = delivery.scheduled_at,
            deliveredAt = delivery.delivered_at,
            trackingNumber = delivery.tracking_number,
            deliveryTries = delivery.delivery_tries,
            totalWeight = delivery.deliverytotalweight,
            createdAt = delivery.created_at,

            transaction = new
            {
                transactionId = delivery.customer_transaction.id,
                transactionCode = delivery.customer_transaction.transaction_code,
                status = delivery.customer_transaction.status,
                grandTotal = delivery.customer_transaction.grand_total
            },

            customer = new
            {
                customerId = delivery.customer_transaction.customer.id,
                name = delivery.customer_transaction.customer.first_name + " " +
                       delivery.customer_transaction.customer.last_name,
                contactNo = delivery.customer_transaction.customer.contact_no
            },


            items = delivery.delivery_items
                .GroupBy(di => di.checkout_item_id)
                .Select(group => new
                {
                    checkoutItemId = group.Key,
                    productId = group.First().inventory.product.id,
                    productName =
                        group.First().inventory.product.product_model + " " +
                        group.First().inventory.product.product_series,
                    serialNumbers = group
                        .Select(g => g.inventory.serial_number)
                        .ToList(),
                    quantity = group.Count(),
                    unitWeight = group.First().inventory.product.total_gross_weight,
                    totalWeight =
                        group.Count() *
                        (group.First().inventory.product.total_gross_weight ?? 0m)
                })
                .ToList()
        };

        return Ok(result);
    }

    //Cancelled Delivery
    /*
    Change delivery.status → CANCELLED
    Set date_cancelled
    Save cancellation_reason
    Revert all inventory from RESERVED_FOR_DELIVERY → GOOD_STOCK
    Set customer_transaction.has_active_delivery = false
    Optionally update transaction.status → PENDING_REPROCESS
     */

    [HttpPut("{id}/cancel")]
    public async Task<IActionResult> CancelDelivery(
    int id,
    [FromBody] CancelDeliveryDto dto)
    {
        using var tx = await _context.Database.BeginTransactionAsync();

        try
        {
            var delivery = await _context.deliveries
                .Include(d => d.delivery_items)
                    .ThenInclude(di => di.inventory)
                .Include(d => d.customer_transaction)
                .FirstOrDefaultAsync(d => d.id == id);

            if (delivery == null)
                return NotFound("Delivery not found.");

            if (delivery.status == "CANCELLED")
                return BadRequest("Delivery already cancelled.");

            if (delivery.status == "DELIVERED")
                return BadRequest("Cannot cancel delivered delivery.");

            // 1️⃣ Update delivery
            delivery.status = "CANCELLED";
            delivery.date_cancelled = DateTime.UtcNow;
            delivery.cancellation_reason = dto.Reason;
            delivery.schedule_status = "CANCELLED";

            // 2️⃣ Revert inventory
            foreach (var item in delivery.delivery_items)
            {
                var inventory = item.inventory;

                if (inventory.status == "RESERVED_FOR_DELIVERY")
                {
                    inventory.status = "GOOD_STOCK";
                    inventory.updated_at = DateTime.UtcNow;
                }
            }

            // 3️⃣ Reset transaction active flag
            delivery.customer_transaction.has_active_delivery = false;

            // 4️⃣ Move transaction to reprocess
            delivery.customer_transaction.status = "PENDING_REPROCESS";

            await _context.SaveChangesAsync();
            await tx.CommitAsync();

            return Ok(new
            {
                message = "Delivery cancelled successfully."
            });
        }
        catch (Exception ex)
        {
            await tx.RollbackAsync();
            return BadRequest(ex.InnerException?.Message ?? ex.Message);
        }
    }
    ////// Shipped Out
    [HttpPut("{id}/ship-out")]
    public async Task<IActionResult> ShipOutDelivery(int id)
    {
        using var tx = await _context.Database.BeginTransactionAsync();

        try
        {
            var delivery = await _context.deliveries
                .Include(d => d.customer_transaction)
                .FirstOrDefaultAsync(d => d.id == id);

            if (delivery == null)
                return NotFound("Delivery not found.");

            if (delivery.status != "BOOKED")
                return BadRequest("Only BOOKED deliveries can be shipped out.");

            delivery.status = "IN_TRANSIT";
            delivery.in_transit_at = DateTime.UtcNow;
            delivery.schedule_status = "READY_FOR_DELIVERY";

            await _context.SaveChangesAsync();
            await tx.CommitAsync();

            return Ok(new
            {
                message = "Delivery marked as IN TRANSIT."
            });
        }
        catch (Exception ex)
        {
            await tx.RollbackAsync();
            return BadRequest(ex.InnerException?.Message ?? ex.Message);
        }
    }

    /// Get Shipped Out Deliveries
    [HttpGet("shipped-out")]
    public async Task<IActionResult> GetShippedOutDeliveries(
       int page = 1,
       int pageSize = 20,
       string? search = null,
       string sortBy = "createdAt",
       string sortDir = "desc")
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;

        var query = _context.deliveries
            .Where(d => d.status == "IN_TRANSIT")
            .Include(d => d.customer_transaction)
                .ThenInclude(t => t.customer)
            .AsQueryable();

        // 🔎 SEARCH
        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.Trim();

            query = query.Where(d =>
                EF.Functions.ILike(d.delivery_ref_code ?? "", $"%{search}%") ||
                EF.Functions.ILike(d.customer_transaction.transaction_code ?? "", $"%{search}%") ||
                EF.Functions.ILike(d.customer_transaction.customer.first_name ?? "", $"%{search}%") ||
                EF.Functions.ILike(d.customer_transaction.customer.last_name ?? "", $"%{search}%") ||
                EF.Functions.ILike(d.courier ?? "", $"%{search}%")
            );
        }

        // 🔀 SORTING
        bool asc = sortDir.ToLower() == "asc";

        query = sortBy switch
        {
            "deliveryRefCode" => asc
                ? query.OrderBy(d => d.delivery_ref_code)
                : query.OrderByDescending(d => d.delivery_ref_code),

            "transactionCode" => asc
                ? query.OrderBy(d => d.customer_transaction.transaction_code)
                : query.OrderByDescending(d => d.customer_transaction.transaction_code),

            "customerName" => asc
                ? query.OrderBy(d => d.customer_transaction.customer.first_name)
                       .ThenBy(d => d.customer_transaction.customer.last_name)
                : query.OrderByDescending(d => d.customer_transaction.customer.first_name)
                       .ThenByDescending(d => d.customer_transaction.customer.last_name),

            "courier" => asc
                ? query.OrderBy(d => d.courier)
                : query.OrderByDescending(d => d.courier),

            "scheduledAt" => asc    
                ? query.OrderBy(d => d.scheduled_at)
                : query.OrderByDescending(d => d.scheduled_at),

            "scheduleStatus" => asc
                ? query.OrderBy(d => d.schedule_status)
                : query.OrderByDescending(d => d.schedule_status),
            "shippedAt" => asc 
                ? query.OrderBy(d => d.in_transit_at)
                : query.OrderByDescending(d => d.in_transit_at),
            _ => asc
                ? query.OrderBy(d => d.created_at)
                : query.OrderByDescending(d => d.created_at)
        };

        var totalCount = await query.CountAsync();

        var deliveries = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(d => new
            {
                deliveryId = d.id,
                deliveryCode = d.delivery_ref_code,
                transactionId = d.customer_transaction_id,
                transactionCode = d.customer_transaction.transaction_code,
                customerName = d.customer_transaction.customer.first_name + " " +
                               d.customer_transaction.customer.last_name,
                grandTotal  = d.customer_transaction.grand_total,
                courier = d.courier,
                scheduledDate = d.scheduled_at,
                deliveryTry = d.delivery_tries,
                totalWeight = d.deliverytotalweight,
                scheduleStatus = d.status,
                createdAt = d.created_at,
                inTransit = d.in_transit_at
            })
            .ToListAsync();

        return Ok(new
        {
            totalCount,
            page,
            pageSize,
            deliveries
        });
    }




    /////// FINAL: DELIVERED
    ///
    [HttpPut("{deliveryId}/delivered")]
    public async Task<IActionResult> MarkAsDelivered(int deliveryId)
    {
        using var tx = await _context.Database.BeginTransactionAsync();

        try
        {
            var delivery = await _context.deliveries
                .Include(d => d.delivery_items)
                .FirstOrDefaultAsync(d => d.id == deliveryId);

            if (delivery == null)
                return NotFound("Delivery not found.");

            if (delivery.status != "IN_TRANSIT")
                return BadRequest("Only IN_TRANSIT deliveries can be completed.");

            // 1️⃣ Update delivery
            delivery.status = "DELIVERED";
            delivery.delivered_at = DateTime.UtcNow;
            delivery.schedule_status = "COMPLETED";

            // 2️⃣ Mark inventory as SOLD
            var inventoryIds = delivery.delivery_items
                .Select(di => di.inventory_id)
                .ToList();

            var inventories = await _context.inventories
                .Where(i => inventoryIds.Contains(i.id))
                .ToListAsync();

            foreach (var inv in inventories)
            {
                inv.status = "SOLD";
                inv.updated_at = DateTime.UtcNow;
            }

            // 3️⃣ Update transaction
            var transaction = await _context.customer_transactions
                .FirstOrDefaultAsync(t => t.id == delivery.customer_transaction_id);

            if (transaction == null)
                return BadRequest("Transaction not found.");

            transaction.status = "COMPLETED";

            // 4️⃣ Update payment transaction (COD only)
            if (transaction.payment_method == "CASH_ON_DELIVERY")
            {
                var payment = await _context.payment_transactions
                    .FirstOrDefaultAsync(p => p.id == transaction.payment_transaction_id);

                if (payment != null)
                {
                    payment.cod_status = "COLLECTED";
                }
            }

            await _context.SaveChangesAsync();
            await tx.CommitAsync();

            return Ok(new
            {
                message = "Delivery completed and payment collected."
            });
        }
        catch (Exception ex)
        {
            await tx.RollbackAsync();
            return BadRequest(ex.Message);
        }
    }


    //// Failed Delivery
    [HttpPut("{deliveryId}/fail")]
    public async Task<IActionResult> FailDelivery(int deliveryId, [FromBody] FailDeliveryDto dto)
    {
        using var tx = await _context.Database.BeginTransactionAsync();

        try
        {
            var delivery = await _context.deliveries
                .Include(d => d.delivery_items)
                .FirstOrDefaultAsync(d => d.id == deliveryId);

            if (delivery == null)
                return NotFound("Delivery not found.");

            if (delivery.status != "IN_TRANSIT")
                return BadRequest("Only IN_TRANSIT deliveries can fail.");

            // 1️⃣ Update delivery
            delivery.status = "FAILED";
            delivery.failed_delivery = true;
            delivery.failed_at = DateTime.UtcNow;
            delivery.fail_reason = dto.FailReason;
            delivery.fail_reason_code = dto.FailReasonCode;
            delivery.schedule_status = "PAST_SCHEDULE_DATE";
            delivery.delivery_tries += 1;

            // 2️⃣ Release inventory
            var inventoryIds = delivery.delivery_items
                .Select(di => di.inventory_id)
                .ToList();

            var inventories = await _context.inventories
                .Where(i => inventoryIds.Contains(i.id))
                .ToListAsync();

            foreach (var inv in inventories)
            {
                inv.status = "GOOD_STOCK";
                inv.updated_at = DateTime.UtcNow;
            }

            // 3️⃣ Update transaction
            var transaction = await _context.customer_transactions
                .FirstOrDefaultAsync(t => t.id == delivery.customer_transaction_id);

            if (transaction != null)
            {
                transaction.status = "PENDING_REPROCESS";
            }

            await _context.SaveChangesAsync();
            await tx.CommitAsync();

            return Ok(new
            {
                message = "Delivery marked as FAILED and inventory released."
            });
        }
        catch (Exception ex)
        {
            await tx.RollbackAsync();
            return BadRequest(ex.Message);
        }
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

    /// Successful Deliveries
    [HttpGet("delivered")]
    public async Task<IActionResult> Delivered(
        int page = 1,
        int pageSize = 10,
        string sortBy = "deliveredAt",
        string sortDir = "desc",
        string? search = null)
    {
        var query = _context.deliveries
            .Include(d => d.customer_transaction)
            .Where(d => d.status == "DELIVERED")
            .AsQueryable();

        // 🔎 Search
        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.Trim();

            query = query.Where(d =>
                EF.Functions.ILike(d.delivery_ref_code ?? "", $"%{search}%") ||
                EF.Functions.ILike(d.customer_transaction.transaction_code ?? "", $"%{search}%")
            );
        }

        // 🔽 Sortation
        bool asc = sortDir.ToLower() == "asc";

        query = sortBy switch
        {
            "deliveryCode" => asc
                ? query.OrderBy(d => d.delivery_ref_code)
                : query.OrderByDescending(d => d.delivery_ref_code),

            "transactionCode" => asc
                ? query.OrderBy(d => d.customer_transaction.transaction_code)
                : query.OrderByDescending(d => d.customer_transaction.transaction_code),

            "courier" => asc
                ? query.OrderBy(d => d.courier)
                : query.OrderByDescending(d => d.courier),

            "scheduledAt" => asc
                ? query.OrderBy(d => d.scheduled_at)
                : query.OrderByDescending(d => d.scheduled_at),

            "deliveredAt" => asc
                ? query.OrderBy(d => d.delivered_at)
                : query.OrderByDescending(d => d.delivered_at),

            "grandTotal" => asc
                ? query.OrderBy(d => d.customer_transaction.grand_total)
                : query.OrderByDescending(d => d.customer_transaction.grand_total),

            "deliveryTries" => asc
                ? query.OrderBy(d => d.delivery_tries)
                : query.OrderByDescending(d => d.delivery_tries),

            _ => asc
                ? query.OrderBy(d => d.delivered_at)
                : query.OrderByDescending(d => d.delivered_at)
        };

        var totalCount = await query.CountAsync();

        var deliveries = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(d => new
            {
                d.id,
                d.delivery_ref_code,
                d.courier,
                d.status,
                d.scheduled_at,
                d.delivered_at,
                d.delivery_tries,
                transactionCode = d.customer_transaction.transaction_code,
                grandTotal = d.customer_transaction.grand_total
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

    [HttpGet("{deliveryId}/master-summary")]
    public async Task<IActionResult> GetMasterSummary(int deliveryId)
    {
        var delivery = await _context.deliveries

            // 🔹 Transaction → Customer + Payment
            .Include(d => d.customer_transaction)
                .ThenInclude(ct => ct.customer)

            .Include(d => d.customer_transaction)
                .ThenInclude(ct => ct.payment_transaction)

            // 🔹 Checkout → Address → Location Tree
            .Include(d => d.customer_transaction)
                .ThenInclude(ct => ct.checkout)
                    .ThenInclude(c => c.delivery_address)
                        .ThenInclude(a => a.barangay)

            .Include(d => d.customer_transaction)
                .ThenInclude(ct => ct.checkout)
                    .ThenInclude(c => c.delivery_address)
                        .ThenInclude(a => a.municipality)

            .Include(d => d.customer_transaction)
                .ThenInclude(ct => ct.checkout)
                    .ThenInclude(c => c.delivery_address)
                        .ThenInclude(a => a.province)

            .Include(d => d.customer_transaction)
                .ThenInclude(ct => ct.checkout)
                    .ThenInclude(c => c.delivery_address)
                        .ThenInclude(a => a.region)

            // 🔹 Delivery Items → Checkout Item → Product → Manufacturer + FormFactor
            .Include(d => d.delivery_items)
                .ThenInclude(di => di.checkout_item)
                    .ThenInclude(ci => ci.product)
                        .ThenInclude(p => p.manufacturer)

            .Include(d => d.delivery_items)
                .ThenInclude(di => di.checkout_item)
                    .ThenInclude(ci => ci.product)
                        .ThenInclude(p => p.form_factor)

            // 🔹 Inventory (Serials)
            .Include(d => d.delivery_items)
                .ThenInclude(di => di.inventory)

            .FirstOrDefaultAsync(d => d.id == deliveryId);

        if (delivery == null)
            return NotFound("Delivery not found.");

        var address = delivery.customer_transaction.checkout?.delivery_address;

        var formattedAddress = address != null
            ? $"{address.house_unit}, {address.street_name}, " +
              $"{address.barangay?.barangay_name}, " +
              $"{address.municipality?.municipality_name}, " +
              $"{address.province?.province_name}, " +
              $"{address.region?.region_name} {address.zip_code}"
            : null;

        var payment = delivery.customer_transaction.payment_transaction;

        return Ok(new
        {
            deliveryCode = delivery.delivery_ref_code,
            status = delivery.status,
            courier = delivery.courier,
            shippingMethod = delivery.customer_transaction.shipping_method,
            paymentMethod = delivery.customer_transaction.payment_method,
            paymentStatus = payment?.paymongo_status ?? payment?.cod_status,
            deliveredAt = delivery.delivered_at,

            transactionCode = delivery.customer_transaction.transaction_code,
            transactionPlacedAt = delivery.customer_transaction.created_at,

            customerName =
                (delivery.customer_transaction.customer?.first_name ?? "") + " " +
                (delivery.customer_transaction.customer?.last_name ?? ""),

            customerContactNo =
                delivery.customer_transaction.customer?.contact_no,
            customerEmail =
                delivery.customer_transaction.customer?.email,

            deliveryAddress = formattedAddress,

            grandTotal = delivery.customer_transaction.grand_total,

            items = delivery.delivery_items.Select(di => new
            {
                // 🔹 PRODUCT INFO
                productBrand = di.checkout_item.product.manufacturer.brand_name,
                productSeries = di.checkout_item.product.product_series,
                productModel = di.checkout_item.product.product_model,
                productSku = di.checkout_item.product.sku,
                formFactor = di.checkout_item.product.form_factor.form_factor1,

                // 🔹 SERIAL
                serialNumber = di.inventory.serial_number,

                // 🔹 SNAPSHOT PRICING (IMPORTANT)
                quantity = di.checkout_item.qty,
                productPrice = di.checkout_item.product_price,
                standardInstallationPrice = di.checkout_item.std_installation_price,
                additionalInstallationPrice = di.checkout_item.additional_installation_price,
                totalItemAmount = di.checkout_item.total_item_amount,

                // 🔹 SERVICE OPTIONS (optional if you want labels)
                stdInstallationOptionId = di.checkout_item.std_installation_option_id,
                additionalInstallationOptionId = di.checkout_item.additional_installation_option_id
            })
        });
    }
}

