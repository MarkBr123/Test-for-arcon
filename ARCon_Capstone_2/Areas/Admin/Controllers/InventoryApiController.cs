using ARCon_Capstone_2.Data;
using ARCon_Capstone_2.DTOs;
using ARCon_Capstone_2.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using System.Security.Permissions;


[AllowAnonymous]
[ApiController]
[Route("api/inventory")]

public class InventoryApiController : ControllerBase
{
    private readonly ARCon_Capstone_2_DbContext _context;

    public InventoryApiController(ARCon_Capstone_2_DbContext context)
    {
        _context = context;
    }

    [HttpPost("from-po/{purchaseOrderId}")]
    public async Task<IActionResult> ReceivePurchaseOrder(
    int purchaseOrderId,
    [FromBody] List<ReceivedFromPoDto> items)
    {
        Console.WriteLine("[HttpPost(\"from-po/{purchaseOrderId}\")] initiated");

        if (items == null || items.Count == 0)
            return BadRequest("No received items provided.");

        if (items.Any(i => i.Qty_Received <= 0))
            return BadRequest("Invalid received quantity.");

        if (items.Any(i => i.Serials.Count != i.Qty_Received))
            return BadRequest("Serial count must match quantity.");

        using var tx = await _context.Database.BeginTransactionAsync();

        try
        {
            // 1️. Validate PO
            var po = await _context.purchase_orders
                .FirstOrDefaultAsync(p => p.id == purchaseOrderId);

            if (po == null)
                return BadRequest("Purchase order not found.");

            // 2️. Create receiving header
            var receiving = new purchased_order_received
            {
                purchase_order_id = po.id,
                received_date = DateTime.UtcNow,
                created_at = DateTime.UtcNow,
                // received_By = GetCurrentAdminId()
            };

            _context.purchased_order_receiveds.Add(receiving);
            await _context.SaveChangesAsync(); // get ID

            decimal totalReceivedAmount = 0;

            // 3️. Insert received articles
            foreach (var item in items)
            {
                var lineTotal = item.Qty_Received * item.Unit_Price;

                var article = new received_article
                {
                    purchased_order_received_id = receiving.id,
                    product_id = item.Product_Id,
                    qty_received = item.Qty_Received,
                    unit_price = item.Unit_Price,
                    total_cost = lineTotal,
                    created_at = DateTime.UtcNow
                };

                totalReceivedAmount += lineTotal;
                _context.received_articles.Add(article);

                // 4️. Insert inventory (per serial)
                foreach (var serial in item.Serials)
                {
                    _context.inventories.Add(new inventory
                    {
                        product_id = item.Product_Id,
                        serial_number = serial.ToUpper(),
                        purchased_order_received_id = receiving.id,
                        received_as = "PURCHASE_ORDER",
                        status = "GOOD_STOCK",
                        created_at = DateTime.UtcNow
                    });
                }
            }

            await _context.SaveChangesAsync();

            // 5️. Update receiving totals
            receiving.total_received_amount = totalReceivedAmount;
            receiving.updated_at = DateTime.UtcNow;

            // 6️. Update PO status
            po.status = "COMPLETED"; // or PARTIALLY_RECEIVED (see note)
            po.updated_at = DateTime.UtcNow;
            Console.WriteLine("Inventory item entry is successful");

            await _context.SaveChangesAsync();

            await tx.CommitAsync();

            return Ok(new
            {
                message = "Purchase order received successfully.",
                receiving_id = receiving.id
            });
        }
        catch (DbUpdateException)
        {
            await tx.RollbackAsync();
            return BadRequest("Duplicate serial number detected.");
        }
        catch (Exception ex)
        {
            await tx.RollbackAsync();
            return BadRequest(ex.Message);
        }
    }

    //Inventory parent list
    [HttpGet("inventory-list")]

    public async Task<IActionResult> GetParentsListForInventory
        (int page = 1, int pageSize = 16, string sortBy = "date", string sortDir = "desc", string? search = null)
    {
        var query = _context.products
            .Where(p => p.status.ToUpper() != "ARCHIVED")
             .Include(p => p.manufacturer)
             .Include(p => p.form_factor)
             .AsQueryable();

        //search
        if (!string.IsNullOrEmpty(search))
        {
            search = search.Trim();
            query = query.Where(p =>
                EF.Functions.ILike(p.sku ?? "", $"%{search}%") ||
                EF.Functions.ILike(p.manufacturer.manufacturer_name ?? "", $"%{search}%") ||
                EF.Functions.ILike(p.form_factor.form_factor1 ?? "", $"%{search}%") ||
                EF.Functions.ILike(p.product_model ?? "", $"%{search}%") ||
                EF.Functions.ILike(p.product_series ?? "", $"%{search}%") ||
                EF.Functions.ILike(p.part_number_a ?? "", $"%{search}%") ||
                EF.Functions.ILike(p.part_number_b ?? "", $"%{search}%")
            );
        }

        bool asc = sortDir.ToLower() == "asc";

        query = sortBy switch
        {
            "sku" => asc
                ? query.OrderBy(p => p.sku)
                : query.OrderByDescending(p => p.sku),
            "manufacturer" => asc
                ? query.OrderBy(p => p.manufacturer.manufacturer_name)
                : query.OrderByDescending(p => p.manufacturer.manufacturer_name),
            "productModel" => asc
                ? query.OrderBy(p => p.product_model)
                : query.OrderByDescending(p => p.product_model),
            "productSeries" => asc
               ? query.OrderBy(p => p.product_series)
               : query.OrderByDescending(p => p.product_series),
            "formfactor" => asc
                ? query.OrderBy(p => p.form_factor.form_factor1)
                : query.OrderByDescending(p => p.form_factor.form_factor1),
            "status" => asc
                ? query.OrderBy(p => p.status)
                : query.OrderByDescending(p => p.status),
            "stockStatus" => asc
                ? query.OrderBy(p => p.inventories.Count(i => i.status == "GOOD_STOCK") > p.reorder_level)
                : query.OrderByDescending(p => p.inventories.Count(i => i.status == "GOOD_STOCK") > p.reorder_level),
            "createDate" => asc
                ? query.OrderBy(p => p.created_at)
                : query.OrderByDescending(p => p.created_at),
            "totalStock" => asc
                ? query.OrderBy(p => p.inventories.Count(i => i.status == "GOOD_STOCK"))
                : query.OrderByDescending(p => p.inventories.Count(i => i.status == "GOOD_STOCK")),
            _ => asc
                ? query.OrderBy(p => p.created_at)
                : query.OrderByDescending(p => p.created_at),
        };

        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p=> new
            {

                p.id,
                p.sku,
                manufacturer = p.manufacturer.manufacturer_name,
                p.product_model,
                p.product_series,
                formfactor = p.form_factor.form_factor1,
                p.status,
                p.reorder_level,
                p.created_at,
                total_stock = p.inventories.Count(i => i.status == "GOOD_STOCK"),
                stock_status = p.inventories.Count(i => i.status == "GOOD_STOCK") <= p.reorder_level ? "LOW_STOCK" : "OK"
            })
            .ToListAsync();

        // this will be use to get info on inventory (below the searchbar text)
        var totalProducts = await query.CountAsync();

        var totalStock = await query
            .SelectMany(p => p.inventories)
            .CountAsync();

        var goodStock = await query
            .SelectMany(p => p.inventories)
            .CountAsync(i => i.status == "GOOD_STOCK");

        return Ok(new
        {
            items,
            totalCount = totalProducts,
            totalStock,
            goodStock
        });
    }

    //Inventory Child List Per Parent
    [HttpGet("by-product/{productId}")]
    public async Task<IActionResult> GetInventoryByProduct(int productId)
    {
        var stocks = await (
            from i in _context.inventories
            join por in _context.purchased_order_receiveds
                on i.purchased_order_received_id equals por.id into porGroup
            from por in porGroup.DefaultIfEmpty()

            join po in _context.purchase_orders
                on por.purchase_order_id equals po.id into poGroup
            from po in poGroup.DefaultIfEmpty()

            join s in _context.suppliers
                on po.supplier_id equals s.id into supGroup
            from s in supGroup.DefaultIfEmpty()

            where i.product_id == productId
            orderby i.created_at
            select new
            {
                i.id,
                i.serial_number,
                i.received_as,
                i.status,
                i.created_at,

                supplier_name = s != null ? s.supplier_name : null,
                source = i.received_as
            }
        ).ToListAsync();

        return Ok(stocks);
    }
}