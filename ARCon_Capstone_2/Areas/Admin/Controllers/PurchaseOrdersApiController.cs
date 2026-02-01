
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

[AllowAnonymous]
[ApiController]
[Route("api/purchase-orders")]

public class PurchaseOrderApiController : ControllerBase
{
    private readonly ARCon_Capstone_2_DbContext _context;
    private readonly IConverter _converter;

    public PurchaseOrderApiController(ARCon_Capstone_2_DbContext context, IConverter converter)
    {
        _context = context;
        _converter = converter;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] PurchaseOrderCreateDto dto)
    {

        if (dto.Expected_Delivery < DateOnly.FromDateTime(DateTime.UtcNow))
            return BadRequest("Expected delivery date cannot be in the past.");

        if (dto.Items.Count == 0)
            return BadRequest("At least one PO item is required.");


        var poNumber = await PurchaseOrderHelper.GeneratePONumberAsync(_context);

        var purchaseOrder = new purchase_order
        {
            supplier_id = dto.Supplier_Id,
            po_number = poNumber,
            payment_type = dto.Payment_Type,
            arcon_branch_address = dto.Arcon_Branch_Address,
            expected_delivery = dto.Expected_Delivery,
            freight_cost = dto.Freight_Cost,
            status = "DRAFT",
            created_at = DateTime.UtcNow,
            revision = 0
        };

        _context.purchase_orders.Add(purchaseOrder);
        await _context.SaveChangesAsync();

        decimal total = 0;

        foreach (var item in dto.Items)
        {
            var lineTotal = item.Qty_Ordered * item.Unit_Price;
            total += lineTotal;

            _context.purchase_order_articles.Add(new purchase_order_article
            {
                purchase_order_id = purchaseOrder.id,
                product_id = item.Product_Id,
                qty_ordered = item.Qty_Ordered,
                unit_price = item.Unit_Price,
                total_cost = lineTotal
            });
        }

        purchaseOrder.total_amount = total + dto.Freight_Cost;


        await _context.SaveChangesAsync();

        return Ok(new
        {
            purchaseOrder.id,
            purchaseOrder.po_number
        });
    }


    [HttpGet]
    public async Task<IActionResult> GetAll(int page = 1, int pageSize = 24, string sortBy = "date", string sortDir = "desc", string? search = null)
    {
        var query = _context.purchase_orders
                .Include(po => po.supplier)
                .Include(po => po.arcon_store_branch)
                .AsQueryable();

        // SEARCH 
        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.Trim();

            query = query.Where(po =>
                EF.Functions.ILike(po.po_number ?? "", $"%{search}%") ||
                EF.Functions.ILike(po.supplier.supplier_name ?? "", $"%{search}%") ||
                EF.Functions.ILike(po.arcon_store_branch.branch_name ?? "", $"%{search}%")
            );
        }

        bool asc = sortDir.ToLower() == "asc";
        query = sortBy switch
        {
            "po_number" => asc ? query.OrderBy(po => po.po_number) : query.OrderByDescending(po => po.po_number),
            "payment_type" => asc ? query.OrderBy(po => po.payment_type) : query.OrderByDescending(po => po.payment_type),
            "arcon_branch_name" => asc ? query.OrderBy(po => po.arcon_store_branch.branch_name) : query.OrderByDescending(po => po.arcon_store_branch.branch_name),
            "expected_delivery" => asc ? query.OrderBy(po => po.expected_delivery) : query.OrderByDescending(po => po.expected_delivery),
            "freight_cost" => asc ? query.OrderBy(po => po.freight_cost) : query.OrderByDescending(po => po.freight_cost),
            "total_amount" => asc ? query.OrderBy(po => po.total_amount) : query.OrderByDescending(po => po.total_amount),
            "status" => asc ? query.OrderBy(po => po.status) : query.OrderByDescending(po => po.status),
            "updated_At" => asc ? query.OrderBy(po => po.updated_at) : query.OrderByDescending(po => po.updated_at),
            _ => asc ? query.OrderBy(po => po.created_at) : query.OrderByDescending(po => po.created_at)
        };

        var totalCount = await query.CountAsync();
        var items = await query
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .Select(po => new
        {
            po.id,
            po.po_number,
            po.supplier.supplier_name,
            po.arcon_store_branch.branch_name,
            po.payment_type,
            po.status,
            po.expected_delivery,
            po.freight_cost,
            po.total_amount,
            //number of unique products 
            item_count = po.purchase_order_articles.Count(),
            //total quantity (from purchase_order_articles tbl)
            total_quantity = po.purchase_order_articles
                .Sum(a => (int?)a.qty_ordered) ?? 0,
            po.created_at,
            po.updated_at
        })

        .ToListAsync();
        return Ok(new
        {
            items,
            totalCount
        });
    }

    //soft delete (ARCHIVE)
    [HttpDelete("{id}")]
    public async Task<IActionResult> Archive(int id)
    {
        var po = await _context.purchase_orders.FindAsync(id);
        if (po == null)
            return NotFound();

        po.status = "ARCHIVED";
        po.updated_at = DateTime.UtcNow;

        var affected = await _context.SaveChangesAsync();
        Console.WriteLine($"ROWS AFFECTED: {affected}");

        return Ok(new
        {
            id = po.id,
            status = po.status,
            affected
        });
    }

    //Summary API
    [HttpGet("{id}/summary")]
    public async Task<IActionResult> GetSummary(int id)
    {
        var po = await _context.purchase_orders
             .Include(po => po.supplier)
             .Include(po => po.arcon_store_branch)
             .Include(po => po.purchase_order_articles)
                 .ThenInclude(a => a.product)
                     .ThenInclude(p => p.manufacturer)
             .Include(po => po.purchase_order_articles)
                 .ThenInclude(a => a.product)
                     .ThenInclude(p => p.form_factor)
             .FirstOrDefaultAsync(po => po.id == id);


        if (po == null)
            return NotFound();

        return Ok(new
        {
            po.id,
            po.po_number,
            po.status,
            po.payment_type,
            po.expected_delivery,
            po.freight_cost,
            po.total_amount,

            supplier_id = po.supplier_id,
            supplier_name = po.supplier.supplier_name,

            arcon_branch_address = po.arcon_branch_address,
            branch_name = po.arcon_store_branch.branch_name,

            items = po.purchase_order_articles.Select(a => new
            {
                a.product_id,
                a.product.sku,
                manufacturer = a.product.manufacturer.manufacturer_name,
                a.product.product_model,
                a.product.product_series,
                a.product.part_number_a,
                a.product.total_gross_weight,
                form_factor = a.product.form_factor.form_factor1,
                a.qty_ordered,
                a.unit_price,
                a.total_cost
            })
        });
    }

    /*
     * Rules enforced
        ✔ Only DRAFT POs can be updated
        ✔ Expected delivery cannot be in the past
        ✔ Must have at least 1 item
        ✔ Replaces items safely
        ✔ Recomputes totals
     */
    //Update PO Api
    [HttpPut("{id}/edit")]
    public async Task<IActionResult> UpdatePurchaseOrder(int id, [FromBody] PurchaseOrderCreateDto dto)
    {
        var purchaseOrder = await _context.purchase_orders
       .Include(po => po.purchase_order_articles)
       .FirstOrDefaultAsync(po => po.id == id);


        if (purchaseOrder == null)
        {
            return NotFound("Purchase Order not found");
        }
        if (purchaseOrder.status != "DRAFT")
        {
            return BadRequest("Only DRAFT purchase orders can be updated.");
        }
        if (dto.Expected_Delivery < DateOnly.FromDateTime(DateTime.UtcNow))
        {
            return BadRequest("Expected delivery date cannot be in the past");
        }
        if (dto.Items == null || dto.Items.Count == 0)
        {
            return BadRequest("At least one PO Item is required");
        }

        //update po header
        purchaseOrder.supplier_id = dto.Supplier_Id;
        purchaseOrder.payment_type = dto.Payment_Type;
        purchaseOrder.arcon_branch_address = dto.Arcon_Branch_Address;
        purchaseOrder.expected_delivery = dto.Expected_Delivery;
        purchaseOrder.freight_cost = dto.Freight_Cost;
        purchaseOrder.updated_at = DateTime.UtcNow;

        // 🔥 INCREMENT REVISION
        purchaseOrder.revision += 1;

        // remove existing items
        _context.purchase_order_articles.RemoveRange(purchaseOrder.purchase_order_articles);

        decimal total = 0;

        // re-add items
        foreach (var item in dto.Items)
        {
            var lineTotal = item.Qty_Ordered * item.Unit_Price;
            total += lineTotal;

            _context.purchase_order_articles.Add(new purchase_order_article
            {
                purchase_order_id = purchaseOrder.id,
                product_id = item.Product_Id,
                qty_ordered = item.Qty_Ordered,
                unit_price = item.Unit_Price,
                total_cost = lineTotal,
            });
        }

        purchaseOrder.total_amount = total + dto.Freight_Cost;
        await _context.SaveChangesAsync();

        return Ok(new {
            purchaseOrder.id,
            purchaseOrder.po_number,
            purchaseOrder.status,
            purchaseOrder.revision
        });
    }

    // this will create a pdf report
    [HttpGet("{id}/pdf")]
    public async Task<IActionResult> GeneratePdf(int id)
    {
        var po = await _context.purchase_orders
            .Include(p => p.supplier)
            .Include(p => p.arcon_store_branch)
            .Include(p => p.purchase_order_articles)
                .ThenInclude(a => a.product)
                    .ThenInclude(p => p.manufacturer)
            .Include(p => p.purchase_order_articles)
                .ThenInclude(a => a.product)
                    .ThenInclude(p => p.form_factor)
            .FirstOrDefaultAsync(p => p.id == id);

        if (po == null)
            return NotFound("Purchase Order not found.");

        try
        {
            // ✅ USE QUESTPDF HERE
            var document = new PurchaseOrderPdf(po);
            var pdfBytes = document.GeneratePdf();

            return File(
                pdfBytes,
                "application/pdf",
                $"PurchaseOrder-{po.po_number}.pdf"
            );
        }
        catch (Exception ex)
        {
            // QuestPDF gives very clear errors
            return BadRequest(ex.ToString());
        }
    }




    //this will make status 'SENT' via button
    [HttpPut("{id}/send")]
    public async Task<IActionResult> MarkAsSent(int id)
    {
        var po = await _context.purchase_orders.FindAsync(id);

        if (po == null)
            return NotFound("Purchase Order not found.");

        if (po.status != "DRAFT")
            return BadRequest("Only DRAFT purchase orders can be sent.");

        po.status = "SENT";
        po.updated_at = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Purchase Order marked as 'SENT'.",
            status = po.status
        });
    }

    // GET: api/purchase-orders/receivable -- to be used for inventory's PO search
    [HttpGet("receivable")]
    public async Task<IActionResult> GetReceivablePurchaseOrders()
    {
        var pos = await _context.purchase_orders
            .Include(po => po.supplier)
            .Where(po => po.status == "SENT" || po.status == "SENT_LATE")
            .OrderByDescending(po => po.created_at)
            .Select(po => new 
            {
                po.id,
                po.po_number,
                po.supplier.supplier_name,
                po.arcon_store_branch.branch_name,
                po.payment_type,
                po.status,
                po.expected_delivery,
                po.freight_cost,
                po.total_amount,
                //number of unique products 
                item_count = po.purchase_order_articles.Count(),
                //total quantity (from purchase_order_articles tbl)
                total_quantity = po.purchase_order_articles
                .Sum(a => (int?)a.qty_ordered) ?? 0,
                po.created_at,
                po.updated_at
            })
            .ToListAsync();

        return Ok(pos);
    }

    //this will show articles
    // GET: api/purchase-orders/{id}/articles
    // Used for PO receiving – REFERENCE ONLY
    [HttpGet("{id}/articles")]
    public async Task<IActionResult> GetPurchaseOrderArticles(int id)
    {
        var articles = await _context.purchase_order_articles
            .Include(a => a.product)
                .ThenInclude(p => p.manufacturer)
            .Include(a => a.product)
                .ThenInclude(p => p.form_factor)
            .Where(a => a.purchase_order_id == id)
            .Select(a => new
            {
                // product identity
                product_id = a.product_id,
                sku = a.product.sku,
                manufacturer = a.product.manufacturer.manufacturer_name,
                product_model = a.product.product_model,
                product_series = a.product.product_series,
                part_number_a = a.product.part_number_a,

                // specs
                total_gross_weight = a.product.total_gross_weight,
                form_factor = a.product.form_factor.form_factor1,

                // order info
                qty = a.qty_ordered,
                unit_price = a.unit_price,
                line_total = a.qty_ordered * a.unit_price
            })
            .ToListAsync();

        return Ok(articles);
    }




}



