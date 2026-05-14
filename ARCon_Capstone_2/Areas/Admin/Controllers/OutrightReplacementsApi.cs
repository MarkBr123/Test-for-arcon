
using ARCon_Capstone_2.Data;
using ARCon_Capstone_2.DTOs;
using ARCon_Capstone_2.Models;
using ARCon_Capstone_2.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ARCon_Capstone_2.Services;
using System.Reflection.Metadata.Ecma335;
namespace ARCon_Capstone_2.Controllers;


[ApiController]
[Route("api/outright-replacements")]
public class OutrightReplacementsApi
    : ControllerBase
{
    private readonly ARCon_Capstone_2_DbContext _context;
    public OutrightReplacementsApi(ARCon_Capstone_2_DbContext context)
    {
        _context = context;
    }

    [HttpGet("admin/outright-replacements")]
    public async Task<IActionResult> GetAllOutrightReplacementClaims(
     int page = 1,
     int pageSize = 24,
     string? search = null,
     string sortBy = "created_at",
     string sortDirection = "desc")
    {
        try
        {
            // SESSION VALIDATION
            /*
            var adminId =
                HttpContext.Session.GetInt32("UserId");

            var userType =
                HttpContext.Session.GetString("UserType");

            if (adminId == null ||
                userType != "ADMIN")
            {
                return Unauthorized(new
                {
                    message = "Unauthorized"
                });
            }
            */


            // QUERY

            var query =
                _context.outright_replacement_warranties

                    .Include(x => x.customer)

                    .Include(x => x.customer_transaction)

                    .AsQueryable();

            // SEARCH

            if (!string.IsNullOrWhiteSpace(search))
            {
                search = search.Trim().ToLower();

                query = query.Where(x =>

                    x.warranty_code.ToLower().Contains(search)

                    ||

                    x.status.ToLower().Contains(search)

                    ||

                    (
                        x.customer.first_name + " " +
                        x.customer.last_name
                    )
                    .ToLower()
                    .Contains(search)

                    ||

                    x.customer_transaction.transaction_code
                        .ToLower()
                        .Contains(search)
                );
            }

            // SORTING

            query =
                (sortBy.ToLower(),
                 sortDirection.ToLower()) switch
                {
                    // CREATED AT

                    ("created_at", "asc") =>

                    query.OrderBy(x => x.created_at),

                    ("created_at", "desc") =>

                    query.OrderByDescending(x => x.created_at),

                    // WARRANTY CODE

                    ("warranty_code", "asc") =>

                    query.OrderBy(x => x.warranty_code),

                    ("warranty_code", "desc") =>

                    query.OrderByDescending(x => x.warranty_code),

                    // STATUS

                    ("status", "asc") =>

                    query.OrderBy(x => x.status),

                    ("status", "desc") =>

                    query.OrderByDescending(x => x.status),

                    // CUSTOMER NAME

                    ("customer_name", "asc") =>

                    query
                        .OrderBy(x => x.customer.first_name)
                        .ThenBy(x => x.customer.last_name),

                    ("customer_name", "desc") =>

                    query
                        .OrderByDescending(x => x.customer.first_name)
                        .ThenByDescending(x => x.customer.last_name),

                    // TRANSACTION CODE

                    ("transaction_code", "asc") =>

                    query.OrderBy(x =>
                        x.customer_transaction.transaction_code),

                    ("transaction_code", "desc") =>

                    query.OrderByDescending(x =>
                        x.customer_transaction.transaction_code),

                    // DEFAULT

                    _ =>

                    query.OrderByDescending(x => x.created_at)
                };

            // TOTAL COUNT

            var totalCount =
                await query.CountAsync();

            // PAGINATION

            var claims =
                await query

                    .Skip((page - 1) * pageSize)

                    .Take(pageSize)

                    .Select(x => new
                    {
                        x.id,

                        x.warranty_code,

                        x.status,

                        x.customer_notes,

                        x.created_at,

                        customer = new
                        {
                            x.customer.id,

                            x.customer.first_name,

                            x.customer.last_name,

                            x.customer.email
                        },

                        customer_transaction = new
                        {
                            x.customer_transaction.id,

                            x.customer_transaction.transaction_code
                        }
                    })

                    .ToListAsync();

            // RESPONSE

            return Ok(new
            {
                totalCount,

                currentPage = page,

                pageSize,

                totalPages =
                    (int)Math.Ceiling(
                        totalCount / (double)pageSize),

                data = claims
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message =
                    ex.InnerException?.Message ??
                    ex.Message
            });
        }
    }
    /// <summary>
    /// //////////////////////////////////////////////////////////////////// GET BY ID /////////////////////////////////////////////////
    /// </summary>
    /// <param name="id"></param>
    /// <returns></returns>
    /// 
    [HttpGet("summary/{id}")]
    public async Task<IActionResult> GetOutrightReplacementSummary(
    int id)
    {
        try
        {
            // =========================================
            // SESSION VALIDATION
            // =========================================

            var adminId =
                HttpContext.Session.GetInt32("UserId");

            var userType =
                HttpContext.Session.GetString("UserType");

            if (adminId == null ||
                userType != "ADMIN")
            {
                return Unauthorized(new
                {
                    message = "Unauthorized"
                });
            }



            // =========================================
            // GET WARRANTY
            // =========================================

            var warranty =
                await _context
                    .outright_replacement_warranties

                    // CUSTOMER
                    .Include(x => x.customer)

                    // CUSTOMER TRANSACTION
                    .Include(x => x.customer_transaction)

                        .ThenInclude(ct => ct.payment_transaction)

                    .Include(x => x.customer_transaction)

                        .ThenInclude(ct => ct.checkout)

                            .ThenInclude(c => c.delivery_address)

                                .ThenInclude(a => a.barangay)

                    .Include(x => x.customer_transaction)

                        .ThenInclude(ct => ct.checkout)

                            .ThenInclude(c => c.delivery_address)

                                .ThenInclude(a => a.municipality)

                    .Include(x => x.customer_transaction)

                        .ThenInclude(ct => ct.checkout)

                            .ThenInclude(c => c.delivery_address)

                                .ThenInclude(a => a.province)

                    .Include(x => x.customer_transaction)

                        .ThenInclude(ct => ct.checkout)

                            .ThenInclude(c => c.delivery_address)

                                .ThenInclude(a => a.region)

                    // DELIVERY
                    .Include(x => x.customer_transaction)

                        .ThenInclude(ct => ct.deliveries)

                            .ThenInclude(d => d.delivery_items)

                                .ThenInclude(di => di.checkout_item)

                                    .ThenInclude(ci => ci.product)

                                        .ThenInclude(p => p.manufacturer)

                    .Include(x => x.customer_transaction)

                        .ThenInclude(ct => ct.deliveries)

                            .ThenInclude(d => d.delivery_items)

                                .ThenInclude(di => di.checkout_item)

                                    .ThenInclude(ci => ci.product)

                                        .ThenInclude(p => p.form_factor)

                    .Include(x => x.customer_transaction)

                        .ThenInclude(ct => ct.deliveries)

                            .ThenInclude(d => d.delivery_items)

                                .ThenInclude(di => di.inventory)

                    // WARRANTY ITEMS
                    .Include(x =>
                        x.outright_replacement_warranty_items)

                        .ThenInclude(i => i.product)

                    .Include(x =>
                        x.outright_replacement_warranty_items)

                        .ThenInclude(i => i.original_inventory)

                    .Include(x =>
                        x.outright_replacement_warranty_items)

                        .ThenInclude(i => i.replacement_inventory)

                    // ATTACHMENTS
                    .Include(x =>
                        x.outright_replacement_warranty_attachments)

                    .FirstOrDefaultAsync(x =>
                        x.id == id);

            if (warranty == null)
            {
                return NotFound(new
                {
                    message =
                        "Outright replacement request not found."
                });
            }



            // =========================================
            // DELIVERY
            // =========================================

            var delivery =
                warranty
                    .customer_transaction
                    ?.deliveries
                    ?.FirstOrDefault();



            // =========================================
            // ADDRESS
            // =========================================

            var address =
                warranty
                    .customer_transaction
                    ?.checkout
                    ?.delivery_address;

            var formattedAddress =
                address != null

                    ? $"{address.house_unit}, " +
                      $"{address.street_name}, " +
                      $"{address.barangay?.barangay_name}, " +
                      $"{address.municipality?.municipality_name}, " +
                      $"{address.province?.province_name}, " +
                      $"{address.region?.region_name} " +
                      $"{address.zip_code}"

                    : null;



            // =========================================
            // PAYMENT
            // =========================================

            var payment =
                warranty
                    .customer_transaction
                    ?.payment_transaction;



            // =========================================
            // RESPONSE
            // =========================================

            return Ok(new
            {
                // =====================================
                // WARRANTY
                // =====================================

                warranty = new
                {
                    warranty.id,

                    warranty.warranty_code,

                    warranty.status,

                    warranty.customer_id,

                    warranty.customer_transaction_id,

                    warranty.customer_notes,

                    warranty.admin_notes,

                    warranty.rejection_reason,

                    warranty.approved_at,

                    warranty.rejected_at,

                    warranty.release_method,

                    warranty.delivery_type,

                    warranty.courier_name,

                    warranty.tracking_number,

                    warranty.delivery_date,

                    warranty.pickup_date,

                    warranty.released_at,

                    warranty.received_by_customer_at,

                    warranty.created_at,

                    warranty.updated_at
                },



                // =====================================
                // CUSTOMER
                // =====================================

                customer = warranty.customer == null

                    ? null

                    : new
                    {
                        warranty.customer.id,

                        warranty.customer.first_name,

                        warranty.customer.middle_name,

                        warranty.customer.last_name,

                        warranty.customer.email,

                        warranty.customer.contact_no
                    },



                // =====================================
                // CUSTOMER TRANSACTION
                // =====================================

                customer_transaction =
                    warranty.customer_transaction == null

                    ? null

                    : new
                    {
                        warranty.customer_transaction.id,

                        warranty.customer_transaction.transaction_code,

                        warranty.customer_transaction.status,

                        warranty.customer_transaction.created_at,

                        warranty.customer_transaction.shipping_method,

                        warranty.customer_transaction.payment_method,

                        warranty.customer_transaction.grand_total
                    },



                // =====================================
                // DELIVERY
                // =====================================

                delivery = delivery == null

                    ? null

                    : new
                    {
                        delivery.id,

                        delivery.delivery_ref_code,

                        delivery.status,

                        delivery.courier,

                        delivery.delivered_at
                    },



                // =====================================
                // PAYMENT
                // =====================================

                payment = payment == null

                    ? null

                    : new
                    {
                        paymentStatus =
                            payment.paymongo_status
                            ?? payment.cod_status
                    },



                // =====================================
                // ADDRESS
                // =====================================

                delivery_address =
                    formattedAddress,



                // =====================================
                // WARRANTY ITEMS
                // =====================================

                items =
                    warranty
                        .outright_replacement_warranty_items

                        .Select(item => new
                        {
                            item.id,

                            item.product_id,

                            product_name =

                                $"{item.product.product_series} " +
                                $"{item.product.product_model}",

                            item.product.sku,

                            serial_number =
                                item.original_inventory
                                    ?.serial_number,

                            item.complaint,

                            item.original_inventory_id,

                            item.original_delivery_item_id
                        }),

                // =====================================
                // REPLACEMENT UNITS
                // =====================================

                replacement_units =
                    warranty
                        .outright_replacement_warranty_items

                        .Select(item => new
                        {
                            item.id,

                            item.product_id,

                            product_name =

                                $"{item.product.product_series} " +
                                $"{item.product.product_model}",

                            item.product.sku,



                            // =====================================
                            // DEFECTIVE UNIT
                            // =====================================

                            defective_serial_number =
                                item.original_inventory
                                    ?.serial_number,

                            defective_inventory_id =
                                item.original_inventory_id,



                            // =====================================
                            // REPLACEMENT UNIT
                            // =====================================

                            replacement_serial_number =
                                item.replacement_inventory
                                    ?.serial_number,

                            replacement_inventory_id =
                                item.replacement_inventory_id,



                            // =====================================
                            // STATUS
                            // =====================================

                            replacement_status =
                                item.replacement_inventory
                                    ?.status
                        }),



                // =====================================
                // TRANSACTION ITEMS
                // =====================================

                transaction_items =

                    delivery == null

                        ? []

                        : delivery.delivery_items

                            .Select(di => new
                            {
                                productBrand =
                                    di.checkout_item
                                        .product
                                        .manufacturer
                                        .brand_name,

                                productSeries =
                                    di.checkout_item
                                        .product
                                        .product_series,

                                productModel =
                                    di.checkout_item
                                        .product
                                        .product_model,

                                productSku =
                                    di.checkout_item
                                        .product
                                        .sku,

                                formFactor =
                                    di.checkout_item
                                        .product
                                        .form_factor
                                        .form_factor1,

                                serialNumber =
                                    di.inventory
                                        .serial_number,

                                quantity =
                                    di.checkout_item
                                        .qty,

                                productPrice =
                                    di.checkout_item
                                        .product_price,

                                totalItemAmount =
                                    di.checkout_item
                                        .total_item_amount
                            }),



                // =====================================
                // ATTACHMENTS
                // =====================================

                attachments =
                    warranty
                        .outright_replacement_warranty_attachments

                        .Select(a => new
                        {
                            a.id,

                            a.file_name,

                            a.file_path,

                            a.file_type
                        })
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message =
                    ex.InnerException?.Message ??
                    ex.Message
            });
        }
    }


    /////////////////////////////////////////////////////// REJECT /////////////////////////////////////////////////////////
    [HttpPost("{id}/reject")]
    public async Task<IActionResult> RejectWarranty(
    int id,
    [FromBody] RejectOutrightReplacementDto dto)
    {
        try
        {
            // =====================================
            // VALIDATE REQUEST
            // =====================================

            if (dto == null)
            {
                return BadRequest(new
                {
                    message = "Request body is required."
                });
            }

            if (string.IsNullOrWhiteSpace(dto.RejectionReason))
            {
                return BadRequest(new
                {
                    message = "Rejection reason is required."
                });
            }

            if (dto.RejectionReason.Length > 1000)
            {
                return BadRequest(new
                {
                    message = "Rejection reason exceeds maximum allowed length."
                });
            }



            // =====================================
            // GET WARRANTY
            // =====================================

            var warranty = await _context
                .outright_replacement_warranties

                .Include(w => w.outright_replacement_warranty_items)

                .FirstOrDefaultAsync(w => w.id == id);

            if (warranty == null)
            {
                return NotFound(new
                {
                    message = "Warranty request not found."
                });
            }



            // =====================================
            // STATUS VALIDATIONS
            // =====================================

            if (warranty.status == "REJECTED")
            {
                return BadRequest(new
                {
                    message = "Warranty request already rejected."
                });
            }

            if (warranty.status == "COMPLETED")
            {
                return BadRequest(new
                {
                    message = "Completed warranty can no longer be rejected."
                });
            }

            if (warranty.status == "CANCELLED")
            {
                return BadRequest(new
                {
                    message = "Cancelled warranty can no longer be rejected."
                });
            }

            if (warranty.status != "PENDING_REVIEW")
            {
                return BadRequest(new
                {
                    message = $"Cannot reject warranty in '{warranty.status}' status."
                });
            }



            // =====================================
            // UPDATE MAIN WARRANTY
            // =====================================

            warranty.status = "REJECTED";

            warranty.rejected_at = DateTime.UtcNow;

            warranty.rejection_reason =
                dto.RejectionReason.Trim();

            warranty.admin_notes =
                dto.AdminNotes?.Trim();

            warranty.updated_at =
                DateTime.UtcNow;



            // =====================================
            // UPDATE ITEMS
            // =====================================

            foreach (var item in warranty.outright_replacement_warranty_items)
            {
                item.item_status = "REJECTED";

                item.updated_at = DateTime.UtcNow;
            }



            // =====================================
            // SAVE CHANGES
            // =====================================

            await _context.SaveChangesAsync();



            // =====================================
            // SUCCESS RESPONSE
            // =====================================

            return Ok(new
            {
                message = "Warranty request rejected successfully."
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = ex.Message
            });
        }
    }


    /// FETCH GOOD_STOCKS
    /// 
    [HttpGet("{warrantyItemId}/available-replacements")]
    public async Task<IActionResult> GetAvailableReplacementUnits(
    int warrantyItemId)
    {
        var warrantyItem =
            await _context
                .outright_replacement_warranty_items

                .FirstOrDefaultAsync(i =>
                    i.id == warrantyItemId);

        if (warrantyItem == null)
        {
            return NotFound(new
            {
                message = "Warranty item not found."
            });
        }



        // =====================================
        // GET PRODUCT
        // =====================================

        var product =
            await _context.products
                .FirstOrDefaultAsync(p =>
                    p.id == warrantyItem.product_id);

        if (product == null)
        {
            return NotFound(new
            {
                message = "Product not found."
            });
        }



        // =====================================
        // GET AVAILABLE INVENTORY
        // =====================================

        var inventory =
            await _context.inventories

                .Where(i =>

                    i.product_id ==
                        warrantyItem.product_id &&

                    i.status ==
                        "GOOD_STOCK"
                )

                .Select(i => new
                {
                    inventoryId =
                        i.id,

                    serialNumber =
                        i.serial_number,

                    status =
                        i.status,

                    grossWeight =
                        product.total_gross_weight
                })

                .ToListAsync();



        // =====================================
        // RESPONSE
        // =====================================

        return Ok(new
        {
            warrantyItemId =
                warrantyItem.id,

            productId =
                product.id,

            productName =
                product.product_series + " " +
                product.product_model,

            availableStock =
                inventory.Count,

            replacementUnits =
                inventory
        });
    }

    /// <summary>
    /// Processed
    /// </summary>
    /// <param name="id"></param>
    /// <param name="dto"></param>
    /// <returns></returns>


    [HttpPost("{id}/process")]
    public async Task<IActionResult> ProcessReplacement(
    int id,
    [FromBody] ProcessOutrightReplacementDto dto)
    {
        using var transaction =
            await _context.Database.BeginTransactionAsync();

        try
        {
            // =====================================
            // GET WARRANTY
            // =====================================

            var warranty =
                await _context
                    .outright_replacement_warranties

                    .Include(w =>
                        w.outright_replacement_warranty_items)

                    .FirstOrDefaultAsync(w =>
                        w.id == id);

            if (warranty == null)
            {
                return NotFound(new
                {
                    message =
                        "Warranty request not found."
                });
            }



            // =====================================
            // VALIDATE STATUS
            // =====================================

            if (warranty.status != "PENDING_REVIEW")
            {
                return BadRequest(new
                {
                    message =
                        "Only pending review requests can be processed."
                });
            }



            // =====================================
            // VALIDATE DTO
            // =====================================

            if (dto?.Items == null ||
                !dto.Items.Any())
            {
                return BadRequest(new
                {
                    message =
                        "Replacement items are required."
                });
            }



            // =====================================
            // PROCESS EACH ITEM
            // =====================================

            foreach (var assignment in dto.Items)
            {
                var warrantyItem =
                    warranty
                        .outright_replacement_warranty_items

                        .FirstOrDefault(i =>
                            i.id ==
                                assignment.WarrantyItemId);

                if (warrantyItem == null)
                {
                    await transaction.RollbackAsync();

                    return BadRequest(new
                    {
                        message =
                            $"Warranty item {assignment.WarrantyItemId} not found."
                    });
                }



                // =====================================
                // GET REPLACEMENT INVENTORY
                // =====================================

                var replacementInventory =
                    await _context.inventories
                        .FirstOrDefaultAsync(i =>
                            i.id ==
                                assignment.ReplacementInventoryId);

                if (replacementInventory == null)
                {
                    await transaction.RollbackAsync();

                    return BadRequest(new
                    {
                        message =
                            "Replacement inventory not found."
                    });
                }



                // =====================================
                // VALIDATE STOCK
                // =====================================

                if (replacementInventory.status != "GOOD_STOCK")
                {
                    await transaction.RollbackAsync();

                    return BadRequest(new
                    {
                        message =
                            $"Inventory {replacementInventory.serial_number} is not available."
                    });
                }



                // =====================================
                // GET DEFECTIVE INVENTORY
                // =====================================

                var defectiveInventory =
                    await _context.inventories
                        .FirstOrDefaultAsync(i =>
                            i.id ==
                                warrantyItem.original_inventory_id);

                if (defectiveInventory == null)
                {
                    await transaction.RollbackAsync();

                    return BadRequest(new
                    {
                        message =
                            "Original inventory not found."
                    });
                }



                // =====================================
                // UPDATE DEFECTIVE UNIT
                // =====================================

                defectiveInventory.status =
                    "DEFECTIVE";



                // =====================================
                // UPDATE REPLACEMENT UNIT
                // =====================================

                replacementInventory.status =
                    "AS_REPLACEMENT";



                // =====================================
                // UPDATE WARRANTY ITEM
                // =====================================

                warrantyItem.replacement_inventory_id =
                    replacementInventory.id;

                warrantyItem.item_status =
                    "APPROVED";

                warrantyItem.updated_at =
                    DateTime.UtcNow;
            }



            // =====================================
            // UPDATE WARRANTY
            // =====================================

            warranty.status =
                "FOR_RELEASE";

            warranty.approved_at =
                DateTime.UtcNow;

            warranty.updated_at =
                DateTime.UtcNow;



            // =====================================
            // SAVE
            // =====================================

            await _context.SaveChangesAsync();

            await transaction.CommitAsync();



            // =====================================
            // RESPONSE
            // =====================================

            return Ok(new
            {
                message =
                    "Replacement request processed successfully."
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

            Console.WriteLine(ex.ToString());

            Console.WriteLine(
                "================================"
            );

            return StatusCode(500, new
            {
                message = fullError,
                error = ex.Message
            });
        }
    }


    //////// RELEASE POINT /////////
    [HttpPost("{id}/release")]
    public async Task<IActionResult> ReleaseReplacement(
    int id,
    [FromBody] ReleaseOutrightReplacementDto dto)
    {
        using var transaction =
            await _context.Database.BeginTransactionAsync();

        try
        {
            // =====================================
            // GET WARRANTY
            // =====================================

            var warranty =
                await _context
                    .outright_replacement_warranties

                    .Include(w =>
                        w.outright_replacement_warranty_items)

                    .FirstOrDefaultAsync(w =>
                        w.id == id);

            if (warranty == null)
            {
                await transaction.RollbackAsync();

                return NotFound(new
                {
                    message =
                        "Replacement request not found."
                });
            }



            // =====================================
            // VALIDATE STATUS
            // =====================================

            if (warranty.status != "FOR_RELEASE")
            {
                await transaction.RollbackAsync();

                return BadRequest(new
                {
                    message =
                        "Only FOR_RELEASE requests can be released."
                });
            }



            // =====================================
            // VALIDATE RELEASE METHOD
            // =====================================

            if (string.IsNullOrWhiteSpace(dto.ReleaseMethod))
            {
                await transaction.RollbackAsync();

                return BadRequest(new
                {
                    message =
                        "Release method is required."
                });
            }



            // =====================================
            // STORE PICKUP VALIDATION
            // =====================================

            if (dto.ReleaseMethod == "STORE_PICKUP")
            {
                if (dto.PickupDate == null)
                {
                    await transaction.RollbackAsync();

                    return BadRequest(new
                    {
                        message =
                            "Pickup date is required."
                    });
                }
            }

            if (
                dto.PickupDate != null &&
                dto.PickupDate < DateTime.UtcNow
)
            {
                await transaction.RollbackAsync();

                return BadRequest(new
                {
                    message =
                        "Pickup date cannot be in the past."
                });
            }


            // =====================================
            // DELIVERY VALIDATION
            // =====================================

            if (dto.ReleaseMethod == "DELIVERY")
            {
                if (string.IsNullOrWhiteSpace(dto.DeliveryType))
                {
                    await transaction.RollbackAsync();

                    return BadRequest(new
                    {
                        message =
                            "Delivery type is required."
                    });
                }

                if (dto.DeliveryDate == null)
                {
                    await transaction.RollbackAsync();

                    return BadRequest(new
                    {
                        message =
                            "Delivery date is required."
                    });
                }
            }

            if (
                    dto.DeliveryDate != null &&
                    dto.DeliveryDate < DateTime.UtcNow
)
            {
                await transaction.RollbackAsync();

                return BadRequest(new
                {
                    message =
                        "Delivery date cannot be in the past."
                });
            }



            // =====================================
            // COURIER VALIDATION
            // =====================================

            if (dto.DeliveryType == "COURIER")
            {
                if (string.IsNullOrWhiteSpace(dto.CourierName))
                {
                    await transaction.RollbackAsync();

                    return BadRequest(new
                    {
                        message =
                            "Courier name is required."
                    });
                }
            }



            // =====================================
            // UPDATE WARRANTY
            // =====================================

            warranty.release_method =
             dto.ReleaseMethod;

            warranty.delivery_type =
                string.IsNullOrWhiteSpace(dto.DeliveryType)
                    ? null
                    : dto.DeliveryType;

            warranty.courier_name =
                string.IsNullOrWhiteSpace(dto.CourierName)
                    ? null
                    : dto.CourierName;

            warranty.tracking_number =
                string.IsNullOrWhiteSpace(dto.TrackingNumber)
                    ? null
                    : dto.TrackingNumber;

            warranty.delivery_date =
                dto.DeliveryDate == null
                    ? null
                    : DateTime.SpecifyKind(
                        dto.DeliveryDate.Value,
                        DateTimeKind.Utc
                    );

            warranty.pickup_date =
                dto.PickupDate == null
                    ? null
                    : DateTime.SpecifyKind(
                        dto.PickupDate.Value,
                        DateTimeKind.Utc
                    );

            warranty.released_at =
                DateTime.UtcNow;

            warranty.status =
                "RELEASED";

            warranty.updated_at =
                DateTime.UtcNow;





            // =====================================
            // SAVE
            // =====================================

            await _context.SaveChangesAsync();

            await transaction.CommitAsync();



            // =====================================
            // RESPONSE
            // =====================================

            return Ok(new
            {
                message =
                    "Replacement released successfully."
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



    /////////////////////////           COMPLETE            ////////////////////////////////
    ///
    [HttpPost("{id}/complete")]
    public async Task<IActionResult> CompleteReplacement(
    int id)
    {
        using var transaction =
            await _context.Database.BeginTransactionAsync();

        try
        {
            // =====================================
            // GET WARRANTY
            // =====================================

            var warranty =
                await _context
                    .outright_replacement_warranties

                    .Include(w =>
                        w.outright_replacement_warranty_items)

                    .FirstOrDefaultAsync(w =>
                        w.id == id);

            if (warranty == null)
            {
                await transaction.RollbackAsync();

                return NotFound(new
                {
                    message =
                        "Replacement request not found."
                });
            }



            // =====================================
            // VALIDATE STATUS
            // =====================================

            if (warranty.status != "RELEASED")
            {
                await transaction.RollbackAsync();

                return BadRequest(new
                {
                    message =
                        "Only released replacements can be completed."
                });
            }



            // =====================================
            // UPDATE WARRANTY
            // =====================================

            warranty.status =
                "COMPLETED";

            warranty.received_by_customer_at =
                DateTime.UtcNow;

            warranty.updated_at =
                DateTime.UtcNow;



            // =====================================
            // UPDATE WARRANTY ITEMS
            // =====================================

            if (warranty
                .outright_replacement_warranty_items != null)
            {
                foreach (var item in warranty
                    .outright_replacement_warranty_items)
                {
                    item.item_status =
                        "COMPLETED";

                    item.updated_at =
                        DateTime.UtcNow;
                }
            }



            // =====================================
            // SAVE
            // =====================================

            await _context.SaveChangesAsync();

            await transaction.CommitAsync();



            // =====================================
            // RESPONSE
            // =====================================

            return Ok(new
            {
                message =
                    "Replacement request completed successfully."
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
}
