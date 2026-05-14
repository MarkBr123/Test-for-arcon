
using ARCon_Capstone_2.Data;
using ARCon_Capstone_2.DTOs;
using ARCon_Capstone_2.Models;
using ARCon_Capstone_2.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ARCon_Capstone_2.Services;
using DinkToPdf;
using DinkToPdf.Contracts;
using System.Runtime.Serialization;
using System;
using static System.Net.Mime.MediaTypeNames;
using QuestPDF.Fluent;



[ApiController]
[Route("api/supplier-returns")]
public class SupplierReturnsApi : ControllerBase
{
    private readonly ARCon_Capstone_2_DbContext _context;
    public SupplierReturnsApi(ARCon_Capstone_2_DbContext context)
    {
        _context = context;
    }

    //Get Them all

    [HttpGet]
    public async Task<IActionResult> GetSupplierReturns(
    string search = "",
    string status = "",
    string sortBy = "newest",
    int page = 1,
    int pageSize = 24)
    {
        var query =
            _context.supplier_returns

                .AsNoTracking()

                .Include(x => x.supplier)

                .AsQueryable();



        // =====================================
        // SEARCH
        // =====================================

        if (!string.IsNullOrWhiteSpace(search))
        {
            search =
                search.Trim().ToLower();

            query =
                query.Where(x =>

                    x.return_number
                        .ToLower()
                        .Contains(search)

                    ||

                    x.supplier.supplier_name
                        .ToLower()
                        .Contains(search)

                    ||

                    x.status
                        .ToLower()
                        .Contains(search)
                );
        }



        // =====================================
        // STATUS FILTER
        // =====================================

        if (!string.IsNullOrWhiteSpace(status))
        {
            query =
                query.Where(x =>
                    x.status == status);
        }



        // =====================================
        // SORTATION
        // =====================================

        query =
            sortBy.ToLower() switch
            {
                "oldest" =>

                    query.OrderBy(x =>
                        x.created_at),

                "supplier_asc" =>

                    query.OrderBy(x =>
                        x.supplier.supplier_name),

                "supplier_desc" =>

                    query.OrderByDescending(x =>
                        x.supplier.supplier_name),

                "amount_asc" =>

                    query.OrderBy(x =>
                        x.total_amount),

                "amount_desc" =>

                    query.OrderByDescending(x =>
                        x.total_amount),

                _ =>

                    query.OrderByDescending(x =>
                        x.created_at)
            };



        // =====================================
        // TOTAL COUNT
        // =====================================

        var totalCount =
            await query.CountAsync();



        // =====================================
        // PAGINATION
        // =====================================

        var returns =
            await query

                .Skip((page - 1) * pageSize)

                .Take(pageSize)

                .Select(x => new
                {
                    x.id,

                    x.return_number,

                    supplier_name =
                        x.supplier.supplier_name,

                    x.return_method,

                    x.courier_name,

                    x.tracking_number,

                    x.pickup_date,

                    x.shipped_date,

                    x.shipping_cost,

                    x.status,

                    x.total_items,

                    x.total_amount,

                    x.remarks,

                    x.return_date,

                    x.created_at
                })

                .ToListAsync();



        // =====================================
        // RESPONSE
        // =====================================

        return Ok(new
        {
            currentPage = page,

            pageSize,

            totalCount,

            totalPages =
                (int)Math.Ceiling(
                    totalCount / (double)pageSize
                ),

            items = returns
        });
    }




    /// GET DEFECTIVE ITEMS that came from a specific supplier
    /// 
    [HttpGet("supplier/{supplierId}/defective-inventories")]
    public async Task<IActionResult> GetDefectiveInventoriesBySupplier(
    int supplierId,
    string search = "")
    {
        var query =
            _context.inventories

                .AsNoTracking()

                // PRODUCT
                .Include(i => i.product)

                    .ThenInclude(p => p.manufacturer)

                // PURCHASE RECEIVING
                .Include(i => i.purchased_order_received)

                    .ThenInclude(r => r.purchase_order)

                .Where(i =>

                    // ONLY DEFECTIVE
                    i.status == "DEFECTIVE"

                    &&

                    // MUST HAVE SOURCE RECEIVING
                    i.purchased_order_received_id != null

                    &&

                    // MATCH SUPPLIER
                    i.purchased_order_received
                        .purchase_order
                        .supplier_id == supplierId
                )

                .AsQueryable();



        // =====================================
        // SEARCH
        // =====================================

        if (!string.IsNullOrWhiteSpace(search))
        {
            search =
                search.Trim().ToLower();

            query =
                query.Where(i =>

                    i.serial_number
                        .ToLower()
                        .Contains(search)

                    ||

                    i.product.product_series
                        .ToLower()
                        .Contains(search)

                    ||

                    i.product.product_model
                        .ToLower()
                        .Contains(search)

                    ||

                    i.product.sku
                        .ToLower()
                        .Contains(search)

                    ||

                    i.product.manufacturer.brand_name
                        .ToLower()
                        .Contains(search)
                );
        }



        // =====================================
        // RESULT
        // =====================================

        var items =
            await query

                .OrderByDescending(i =>
                    i.created_at)

                .Select(i => new
                {
                    i.id,

                    i.serial_number,

                    i.status,

                    i.received_as,

                    i.created_at,



                    // PRODUCT
                    product_id =
                        i.product.id,

                    brand =
                        i.product.manufacturer
                            .brand_name,

                    product_name =

                        $"{i.product.product_series} " +
                        $"{i.product.product_model}",

                    i.product.sku,



                    // PURCHASE INFO
                    po_number =
                        i.purchased_order_received
                            .purchase_order
                            .po_number,

                    received_date =
                        i.purchased_order_received
                            .received_date
                })

                .ToListAsync();



        return Ok(new
        {
            supplierId,

            totalCount =
                items.Count,

            items
        });
    }


    /// <summary>
    /// POST
    /// </summary>
    /// <returns></returns>
    /// 
    [HttpPost]
    public async Task<IActionResult> CreateSupplierReturn(
    [FromBody] CreateSupplierReturnDto dto)
    {
        await using var transaction =
            await _context.Database
                .BeginTransactionAsync();

        try
        {
            // =====================================
            // VALIDATION
            // =====================================

            if (dto == null)
            {
                return BadRequest(new
                {
                    message =
                        "Invalid payload."
                });
            }

            if (dto.SupplierId <= 0)
            {
                return BadRequest(new
                {
                    message =
                        "Supplier is required."
                });
            }

            if (dto.Items == null ||
                !dto.Items.Any())
            {
                return BadRequest(new
                {
                    message =
                        "At least one inventory item is required."
                });
            }



            // =====================================
            // GET ADMIN
            // =====================================

            var adminId =
                HttpContext.Session
                    .GetInt32("AdminId");



            // =====================================
            // GENERATE NUMBER
            // =====================================

            var returnNumber =
                await GenerateReturnNumber();



            // =====================================
            // CREATE RETURN ORDER
            // =====================================

            var supplierReturn =
                new supplier_return
                {
                    supplier_id =
                        dto.SupplierId,

                    return_number =
                        returnNumber,

                    return_method =
                        dto.ReturnMethod,

                    courier_name =
                        dto.CourierName,

                    tracking_number =
                        dto.TrackingNumber,

                    pickup_date =
                        dto.PickupDate,

                    shipped_date =
                        dto.ShippedDate,

                    shipping_cost =
                        dto.ShippingCost,

                    remarks =
                        dto.Remarks,

                    status =
                        "DRAFT",

                    created_by =
                        adminId
                };

            _context.supplier_returns
                .Add(supplierReturn);

            await _context.SaveChangesAsync();



            // =====================================
            // GET INVENTORIES
            // =====================================

            var inventoryIds =
                dto.Items
                    .Select(x => x.InventoryId)
                    .ToList();

            var inventories =
                await _context.inventories

                    .Include(i => i.product)

                    .Where(i =>
                        inventoryIds.Contains(i.id))

                    .ToListAsync();



            // =====================================
            // VALIDATE INVENTORIES
            // =====================================

            if (inventories.Count != inventoryIds.Count)
            {
                await transaction.RollbackAsync();

                return BadRequest(new
                {
                    message =
                        "Some inventories were not found."
                });
            }



            decimal totalAmount = 0;



            // =====================================
            // CREATE ITEMS
            // =====================================

            foreach (var inventory in inventories)
            {
                // MUST BE DEFECTIVE

                if (inventory.status != "DEFECTIVE")
                {
                    await transaction.RollbackAsync();

                    return BadRequest(new
                    {
                        message =
                            $"Inventory {inventory.serial_number} is not DEFECTIVE."
                    });
                }



                // UNIT COST
                // OPTIONAL:
                // derive from latest PO later

                decimal unitCost = 0;



                // CREATE ITEM

                var item =
                    new supplier_return_item
                    {
                        supplier_return_id =
                            supplierReturn.id,

                        product_id =
                            inventory.product_id,

                        inventory_id =
                            inventory.id,

                        serial_number =
                            inventory.serial_number,

                        unit_cost =
                            unitCost,

                        total_cost =
                            unitCost,

                        return_reason =
                            dto.ReturnReason,

                        condition_notes =
                            dto.ConditionNotes
                    };

                _context.supplier_return_items
                    .Add(item);



                // UPDATE INVENTORY STATUS

                inventory.status =
                    "RETURN_PENDING";

                inventory.updated_at =
                    DateTime.UtcNow;

                inventory.updated_by =
                    adminId;



                totalAmount += unitCost;
            }



            // =====================================
            // UPDATE TOTALS
            // =====================================

            supplierReturn.total_items =
                inventories.Count;

            supplierReturn.total_amount =
                totalAmount;



            // =====================================
            // SAVE
            // =====================================

            await _context.SaveChangesAsync();

            await transaction.CommitAsync();



            return Ok(new
            {
                message =
                    "Supplier return order created successfully.",

                supplierReturn.id,

                supplierReturn.return_number
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
                    ex.Message,

                stackTrace =
                    ex.StackTrace,

                innerException =
                    ex.InnerException?.ToString()
            });
        }
    }


    /// <summary>
    /// PDF GENERATOR
    /// </summary>
    /// <returns></returns>
    /// 

    // =====================================
    // GENERATE PDF
    // =====================================

    [HttpGet("{id}/pdf")]
    public async Task<IActionResult> GeneratePdf(
        int id)
    {
        var supplierReturn =
            await _context.supplier_returns

                // SUPPLIER
                .Include(x => x.supplier)

                // ITEMS
                .Include(x =>
                    x.supplier_return_items)

                    .ThenInclude(i =>
                        i.product)

                        .ThenInclude(p =>
                            p.manufacturer)

                .FirstOrDefaultAsync(x =>
                    x.id == id);



        // =====================================
        // NOT FOUND
        // =====================================

        if (supplierReturn == null)
        {
            return NotFound(new
            {
                message =
                    "Supplier return not found."
            });
        }



        try
        {
            // =====================================
            // GENERATE PDF
            // =====================================

            var document =
                new SupplierReturnPdf(
                    supplierReturn
                );

            var pdfBytes =
                document.GeneratePdf();



            // =====================================
            // RETURN FILE
            // =====================================

            return File(
                pdfBytes,
                "application/pdf",

                $"SupplierReturn-{supplierReturn.return_number}.pdf"
            );
        }
        catch (Exception ex)
        {
            return BadRequest(
                ex.ToString()
            );
        }
    }


    /// <summary>
    ///  Mark As Sent
    /// </summary>
    /// <returns></returns>
    /// 
    // =====================================
    // MARK AS SENT
    // =====================================

    [HttpPost("{id}/mark-sent")]
    public async Task<IActionResult> MarkAsSent(
        int id)
    {
        try
        {
            var supplierReturn =
                await _context.supplier_returns
                    .FirstOrDefaultAsync(x =>
                        x.id == id);



            // =====================================
            // NOT FOUND
            // =====================================

            if (supplierReturn == null)
            {
                return NotFound(new
                {
                    message =
                        "Supplier return not found."
                });
            }



            // =====================================
            // VALIDATE STATUS
            // =====================================

            if (supplierReturn.status != "DRAFT")
            {
                return BadRequest(new
                {
                    message =
                        "Only DRAFT returns can be marked as SENT."
                });
            }



            // =====================================
            // UPDATE
            // =====================================

            supplierReturn.status =
                "SENT";



            await _context.SaveChangesAsync();



            return Ok(new
            {
                message =
                    "Supplier return marked as SENT successfully."
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message =
                    ex.InnerException?.Message
                    ?? ex.Message
            });
        }
    }


    // =====================================
    // GET RETURN ORDERS FOR RECEIVING
    // ONLY SENT
    // =====================================

    [HttpGet("for-receiving")]
    public async Task<IActionResult> GetForReceiving()
    {
        try
        {
            var items =
                await _context.supplier_returns

                    .AsNoTracking()

                    .Include(x => x.supplier)

                    .Where(x =>
                        x.status == "SENT")

                    .OrderByDescending(x =>
                        x.created_at)

                    .Select(x => new
                    {
                        x.id,

                        x.return_number,

                        supplier_name =
                            x.supplier.supplier_name,

                        x.status,

                        x.return_method,

                        x.total_items,

                        x.total_amount,

                        x.created_at
                    })

                    .ToListAsync();



            return Ok(items);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message =
                    ex.InnerException?.Message
                    ?? ex.Message
            });
        }
    }




    // =====================================
    // RECEIVE SUMMARY
    // =====================================

    [HttpGet("{id}/receive-summary")]
    public async Task<IActionResult> GetReceiveSummary(
        int id)
    {
        try
        {
            var supplierReturn =
                await _context.supplier_returns

                    .AsNoTracking()

                    // SUPPLIER
                    .Include(x => x.supplier)

                    // ITEMS
                    .Include(x =>
                        x.supplier_return_items)

                        .ThenInclude(i =>
                            i.product)

                            .ThenInclude(p =>
                                p.manufacturer)

                    .Include(x =>
                        x.supplier_return_items)

                        .ThenInclude(i =>
                            i.inventory)

                    .FirstOrDefaultAsync(x =>
                        x.id == id);



            // =====================================
            // NOT FOUND
            // =====================================

            if (supplierReturn == null)
            {
                return NotFound(new
                {
                    message =
                        "Supplier return not found."
                });
            }



            // =====================================
            // RESPONSE
            // =====================================

            return Ok(new
            {
                supplierReturn.id,

                supplierReturn.return_number,

                supplier_name =
                    supplierReturn.supplier
                        ?.supplier_name,

                supplierReturn.status,

                supplierReturn.return_method,

                supplierReturn.courier_name,

                supplierReturn.tracking_number,

                supplierReturn.shipping_cost,

                supplierReturn.total_items,

                supplierReturn.total_amount,

                supplierReturn.remarks,

                supplierReturn.created_at,



                // ITEMS

                items =
                    supplierReturn
                        .supplier_return_items

                        .Select(item => new
                        {
                            item.id,

                            item.product_id,

                            product_name =

                                $"{item.product.manufacturer.brand_name} " +

                                $"{item.product.product_series} " +

                                $"{item.product.product_model}",

                            item.product.sku,



                            // DEFECTIVE INVENTORY

                            defective_inventory_id =
                                item.inventory_id,

                            defective_serial =
                                item.inventory
                                    ?.serial_number,



                            // RETURN INFO

                            item.return_reason,

                            item.condition_notes
                        })
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message =
                    ex.InnerException?.Message
                    ?? ex.Message
            });
        }
    }



    /// <summary>
    /// RECEIVE REPLACEMENT (POST)
    /// </summary>
    /// <returns></returns>

    // =====================================
    // RECEIVE REPLACEMENT INVENTORY
    // =====================================

    [HttpPost("{supplierReturnId}/receive")]
    public async Task<IActionResult> ReceiveReplacementInventory(
        int supplierReturnId,
        [FromBody] ReceiveSupplierReturnDto dto)
    {
        Console.WriteLine(
            "[POST RECEIVE REPLACEMENT INVENTORY]"
        );



        // =====================================
        // VALIDATION
        // =====================================

        if (dto == null ||
            dto.Items == null ||
            dto.Items.Count == 0)
        {
            return BadRequest(new
            {
                message =
                    "No replacement items provided."
            });
        }



        if (dto.Items.Any(x =>
            string.IsNullOrWhiteSpace(
                x.ReplacementSerial
            )))
        {
            return BadRequest(new
            {
                message =
                    "Replacement serial is required."
            });
        }



        using var tx =
            await _context.Database
                .BeginTransactionAsync();



        try
        {
            // =====================================
            // GET RETURN ORDER
            // =====================================

            var supplierReturn =
                    await _context.supplier_returns

                        .Include(x => x.supplier)

                        .Include(x =>
                            x.supplier_return_items)

                        .ThenInclude(i =>
                            i.inventory)

                        .FirstOrDefaultAsync(x =>
                            x.id == supplierReturnId);



            if (supplierReturn == null)
            {
                return BadRequest(new
                {
                    message =
                        "Supplier return not found."
                });
            }



            // =====================================
            // VALIDATE STATUS
            // =====================================

            if (supplierReturn.status != "SENT")
            {
                return BadRequest(new
                {
                    message =
                        "Only SENT return orders can receive replacements."
                });
            }



            // =====================================
            // CHECK DUPLICATE SERIALS
            // =====================================

            var incomingSerials =
                dto.Items
                    .Select(x =>
                        x.ReplacementSerial
                            .Trim()
                            .ToUpper())
                    .ToList();



            var existingSerials =
                await _context.inventories

                    .Where(x =>
                        incomingSerials.Contains(
                            x.serial_number
                        ))

                    .Select(x =>
                        x.serial_number)

                    .ToListAsync();



            if (existingSerials.Any())
            {
                return BadRequest(new
                {
                    message =

                        $"Duplicate serial detected: " +

                        $"{string.Join(", ", existingSerials)}"
                });
            }



            // =====================================
            // PROCESS ITEMS
            // =====================================

            foreach (var itemDto in dto.Items)
            {
                var returnItem =
                    supplierReturn
                        .supplier_return_items

                        .FirstOrDefault(x =>
                            x.id ==
                            itemDto.SupplierReturnItemId);



                if (returnItem == null)
                {
                    await tx.RollbackAsync();

                    return BadRequest(new
                    {
                        message =

                            $"Return item not found: " +

                            $"{itemDto.SupplierReturnItemId}"
                    });
                }



                // =====================================
                // UPDATE DEFECTIVE INVENTORY
                // =====================================

                if (returnItem.inventory != null)
                {
                    returnItem.inventory.status =
                        "RETURNED_TO_SUPPLIER";

                    returnItem.inventory.updated_at =
                        DateTime.UtcNow;
                }



                // =====================================
                // CREATE NEW INVENTORY
                // =====================================

                var replacementInventory =
                     new inventory
                     {
                         product_id =
                             returnItem.product_id,

                         serial_number =
                             itemDto.ReplacementSerial
                                 .Trim()
                                 .ToUpper(),



                         // 🔥 PRESERVE ORIGINAL SUPPLIER LINEAGE

                         purchased_order_received_id =
                             returnItem.inventory
                                 ?.purchased_order_received_id,



                         supplier_return_item_id =
                             returnItem.id,



                         received_as =
                             "REPLACEMENT",

                         status =
                             "GOOD_STOCK",

                     };



                _context.inventories
                    .Add(replacementInventory);
            }



            // =====================================
            // COMPLETE RETURN ORDER
            // =====================================

            supplierReturn.status =
                "COMPLETED";



            await _context.SaveChangesAsync();

            await tx.CommitAsync();



            return Ok(new
            {
                message =
                    "Replacement inventory received successfully."
            });
        }
        catch (DbUpdateException)
        {
            await tx.RollbackAsync();

            return BadRequest(new
            {
                message =
                    "Duplicate serial number detected."
            });
        }
        catch (Exception ex)
        {
            await tx.RollbackAsync();

            return BadRequest(new
            {
                message =
                    ex.InnerException?.Message
                    ?? ex.Message
            });
        }
    }




















    // =====================================
    // GENERATE RETURN NUMBER
    // FORMAT:
    // RO-0515260001
    // =====================================

    private async Task<string> GenerateReturnNumber()
    {
        var today =
            DateTime.Now;

        var datePart =
            today.ToString("MMddyy");



        // =====================================
        // GET LATEST TODAY
        // =====================================

        var latestReturn =
            await _context.supplier_returns

                .Where(x =>
                    x.return_number.StartsWith(
                        $"RO-{datePart}"
                    ))

                .OrderByDescending(x =>
                    x.return_number)

                .FirstOrDefaultAsync();



        // =====================================
        // NEXT NUMBER
        // =====================================

        int nextNumber = 1;

        if (latestReturn != null)
        {
            var lastSequence =
                latestReturn.return_number
                    .Substring(9); // 0001

            nextNumber =
                int.Parse(lastSequence) + 1;
        }



        // =====================================
        // FINAL FORMAT
        // =====================================

        return
            $"RO-{datePart}{nextNumber.ToString("D4")}";
    }

}