using ARCon_Capstone_2.Data;
using ARCon_Capstone_2.DTOs;
using ARCon_Capstone_2.Models;
using CloudinaryDotNet.Actions;
using CloudinaryDotNet;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;


namespace ARCon_Capstone_2.Areas.Shop.Controllers;


[ApiController]
[Route("api/my-shop-warranty")]


public class Shop_WarrantyClaimApiController: ControllerBase
{
    private readonly ARCon_Capstone_2_DbContext _context;
    private readonly CloudinaryService _cloudinaryService;

    public Shop_WarrantyClaimApiController(
        ARCon_Capstone_2_DbContext context,
        CloudinaryService cloudinaryService)
    {
        _context = context;
        _cloudinaryService = cloudinaryService;
    }

    [HttpPost("service-warranty-claim")]
    public async Task<IActionResult> CreateWarrantyClaim(
    [FromForm] CreateServiceWarrantyClaimDto dto)
    {
        await using var transaction =
            await _context.Database.BeginTransactionAsync();

        // =========================
        // Customer Session
        // =========================

        var customerId = HttpContext.Session.GetInt32("UserId");
        if (customerId == null)
            return Unauthorized(new { message = "Login Required" });

        // =========================
        // Validate Complaint
        // =========================

        if (string.IsNullOrWhiteSpace(dto.complaint))
        {
            return BadRequest(new
            {
                message = "Complaint is required."
            });
        }

        if (dto.complaint.Trim().Length < 10)
        {
            return BadRequest(new
            {
                message =
                    "Complaint must contain at least 10 characters."
            });
        }


        // =========================
        // Validate Preferred Date
        // =========================

        if (!dto.preferred_date.HasValue)
        {
            return BadRequest(new
            {
                message = "Preferred date is required."
            });
        }

        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        // Past date validation
        if (dto.preferred_date.Value < today)
        {
            return BadRequest(new
            {
                message =
                    "Preferred date cannot be in the past."
            });
        }

        // Max 30 days validation
        if (dto.preferred_date.Value > today.AddDays(30))
        {
            return BadRequest(new
            {
                message =
                    "Preferred date cannot exceed 30 days."
            });
        }


        // =========================
        // Validate Preferred Time
        // =========================

        if (!dto.preferred_time.HasValue)
        {
            return BadRequest(new
            {
                message = "Preferred time is required."
            });
        }

        // Same-day time validation
        if (dto.preferred_date.Value == today)
        {
            var currentTime =
                TimeOnly.FromDateTime(DateTime.UtcNow);

            if (dto.preferred_time.Value < currentTime)
            {
                return BadRequest(new
                {
                    message =
                        "Preferred time cannot be earlier than current time."
                });
            }
        }


        // =========================
        // Validate Files
        // =========================

        if (dto.files != null && dto.files.Any())
        {
            // Total size validation
            long totalSize =
                dto.files.Sum(x => x.Length);

            long maxSize = 20 * 1024 * 1024;

            if (totalSize > maxSize)
            {
                return BadRequest(new
                {
                    message =
                        "Total upload size must not exceed 20MB."
                });
            }

            // Allowed MIME types
            var allowedTypes = new[]
            {
        "image/jpeg",
        "image/png",
        "image/webp",
        "video/mp4",
        "video/quicktime",
        "video/x-msvideo"
    };

            foreach (var file in dto.files)
            {
                // Empty file
                if (file.Length <= 0)
                {
                    return BadRequest(new
                    {
                        message =
                            $"Empty file detected: {file.FileName}"
                    });
                }

                // File type validation
                if (!allowedTypes.Contains(file.ContentType))
                {
                    return BadRequest(new
                    {
                        message =
                            $"File type not allowed: {file.FileName}"
                    });
                }

                // Individual file limit (optional)
                if (file.Length > 15 * 1024 * 1024)
                {
                    return BadRequest(new
                    {
                        message =
                            $"File exceeds 15MB: {file.FileName}"
                    });
                }
            }
        }



        try
        {

            // =========================
            // Validate Booking
            // =========================

            var booking = await _context.service_bookings
                .FirstOrDefaultAsync(x =>
                    x.id == dto.service_booking_id &&
                    x.customer_id == customerId &&
                    x.status == "COMPLETED");

            if (booking == null)
            {
                return BadRequest(new
                {
                    message = "Completed booking not found."
                });
            }         // =========================
            // Validate Existing Active Claim
            // =========================

            var hasActiveClaim =
                await _context.service_warranty_bookings
                .AnyAsync(x =>

                    x.service_booking_id ==
                        dto.service_booking_id &&

                    x.isactiveclaim== true
                );

            if (hasActiveClaim)
            {
                return BadRequest(new
                {
                    message =
                        "This service booking already has an active warranty claim."
                });


   }

            // Validate Complaint

            if (string.IsNullOrWhiteSpace(dto.complaint))
            {
                return BadRequest(new
                {
                    message = "Complaint is required."
                });
            }

            // Validate Preferred Schedule

            if (!dto.preferred_date.HasValue)
            {
                return BadRequest(new
                {
                    message = "Preferred date is required."
                });
            }

            if (!dto.preferred_time.HasValue)
            {
                return BadRequest(new
                {
                    message = "Preferred time is required."
                });
            }

            // Combine date + time
            var scheduled =
                dto.preferred_date.Value.ToDateTime(
                    dto.preferred_time.Value
                );

            var now = DateTime.UtcNow;

            // Cannot schedule in the past
            if (scheduled < now)
            {
                return BadRequest(new
                {
                    message =
                        "Preferred schedule cannot be in the past."
                });
            }

            // Optional: limit 30 days ahead
            if (scheduled > now.AddDays(30))
            {
                return BadRequest(new
                {
                    message =
                        "Preferred schedule cannot exceed 30 days."
                });
            }

            // Validate Files

            if (dto.files != null && dto.files.Any())
            {
                long totalSize =
                    dto.files.Sum(x => x.Length);

                // 20MB limit
                long maxSize = 20 * 1024 * 1024;

                if (totalSize > maxSize)
                {
                    return BadRequest(new
                    {
                        message =
                            "Total upload size must not exceed 20MB."
                    });
                }
            }

            // Create Warranty Booking

            var warranty =
                new service_warranty_booking
                {
                    swb_code = await GenerateWarrantyCodeAsync(),

                    service_booking_id =
                        dto.service_booking_id,

                    customer_id =
                        customerId.Value,

                    complaint =
                        dto.complaint,

                    preferred_date =
                        dto.preferred_date,

                    preferred_time =
                        dto.preferred_time,

                    status = "PENDING_REVIEW"
                };

            _context.service_warranty_bookings
                .Add(warranty);

            // Increment warranty claim count
            booking.warranty_claim_count += 1;

            await _context.SaveChangesAsync();

            await _context.SaveChangesAsync();

            // Upload Attachments

            if (dto.files != null && dto.files.Any())
            {
                foreach (var file in dto.files)
                {
                    // Upload to Cloudinary
                    var uploadedUrl =
                        await _cloudinaryService
                        .UploadFileAsync(file);

                    // Save DB record
                    var attachment =
                        new service_warranty_attachment
                        {
                            service_warranty_booking_id =
                                warranty.id,

                            file_name = file.FileName,

                            file_path = uploadedUrl,

                            file_type = file.ContentType
                        };

                    _context.service_warranty_attachments
                        .Add(attachment);
                }

                await _context.SaveChangesAsync();
            }

            // Commit Transaction

            await transaction.CommitAsync();

            // Success


            return Ok(new
            {
                message =
                    "Warranty claim submitted successfully.",

                warranty_id = warranty.id
            });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            var fullError = ex.InnerException?.Message ?? ex.Message;

            Console.WriteLine("========== FULL ERROR ==========");
            Console.WriteLine(ex.ToString());
            Console.WriteLine("================================");

            return StatusCode(500, new
            {
                message = fullError,
                error = ex.Message
            });
        }
    }

    ///Service Warranty Code Generator
    ///
    private async Task<string> GenerateWarrantyCodeAsync()
    {
        var today = DateTime.UtcNow;
        var datePart = today.ToString("MMddyy");

        var prefix = $"SWB-{datePart}";

        var latestCode = await _context.service_warranty_bookings
            .Where(x => x.swb_code.StartsWith(prefix))
            .OrderByDescending(x => x.swb_code)
            .Select(x => x.swb_code)
            .FirstOrDefaultAsync();

        int nextNumber = 1;

        if (!string.IsNullOrEmpty(latestCode))
        {
            var numberPart = latestCode.Substring(latestCode.Length - 3);

            if (int.TryParse(numberPart, out int parsed))
            {
                nextNumber = parsed + 1;
            }
        }

        return $"{prefix}{nextNumber:D3}";
    }

    //////////////////////////////////////////////////////   OUTRIGHT WARRANTY  //////////////////////////////////////////////////////////////


    [HttpPost("outright-replacement/create")]
    public async Task<IActionResult> CreateOutrightReplacementClaim(
    [FromForm] CreateOutrightReplacementDto dto)
    {
        await using var transaction =
            await _context.Database.BeginTransactionAsync();

        // SESSION VALIDATION

        var customerId =
            HttpContext.Session.GetInt32("UserId");

        var userType =
            HttpContext.Session.GetString("UserType");

        if (customerId == null ||
            userType != "CUSTOMER")
        {
            return Unauthorized(new
            {
                message = "Login Required"
            });
        }



        // ITEMS VALIDATION


        if (dto.items == null ||
            !dto.items.Any())
        {
            return BadRequest(new
            {
                message =
                    "Please add at least one defective product."
            });
        }

        // Max items safeguard
        if (dto.items.Count > 10)
        {
            return BadRequest(new
            {
                message =
                    "Maximum of 10 defective products only."
            });
        }

        // Duplicate inventory validation
        var duplicateInventory =
            dto.items
                .GroupBy(x => x.original_inventory_id)
                .FirstOrDefault(g => g.Count() > 1);

        if (duplicateInventory != null)
        {
            return BadRequest(new
            {
                message =
                    "Duplicate defective products detected."
            });
        }

        // CUSTOMER NOTES VALIDATION

        if (!string.IsNullOrWhiteSpace(dto.customer_notes))
        {
            dto.customer_notes =
                dto.customer_notes.Trim();

            if (dto.customer_notes.Length > 1000)
            {
                return BadRequest(new
                {
                    message =
                        "Customer notes cannot exceed 1000 characters."
                });
            }
        }

        // ITEM FIELD VALIDATION

        foreach (var item in dto.items)
        {
            // Delivery Item ID
            if (item.delivery_item_id <= 0)
            {
                return BadRequest(new
                {
                    message =
                        "Invalid delivery item."
                });
            }

            // Inventory ID
            if (item.original_inventory_id <= 0)
            {
                return BadRequest(new
                {
                    message =
                        "Invalid inventory item."
                });
            }

            // Product ID
            if (item.product_id <= 0)
            {
                return BadRequest(new
                {
                    message =
                        "Invalid product."
                });
            }

            // Complaint Required
            if (string.IsNullOrWhiteSpace(
                item.issue_description))
            {
                return BadRequest(new
                {
                    message =
                        "Issue description is required for all defective products."
                });
            }

            item.issue_description =
                item.issue_description.Trim();

            // Complaint Length
            if (item.issue_description.Length < 10)
            {
                return BadRequest(new
                {
                    message =
                        "Issue description must contain at least 10 characters."
                });
            }

            if (item.issue_description.Length > 500)
            {
                return BadRequest(new
                {
                    message =
                        "Issue description cannot exceed 500 characters."
                });
            }
        }
        // FILE VALIDATION

        if (dto.attachments != null &&
            dto.attachments.Any())
        {
            // Max file count
            if (dto.attachments.Count > 10)
            {
                return BadRequest(new
                {
                    message =
                        "Maximum of 10 attachments only."
                });
            }

            long totalSize =
                dto.attachments.Sum(x => x.Length);

            // 20MB TOTAL
            long maxSize =
                50 * 1024 * 1024;

            if (totalSize > maxSize)
            {
                return BadRequest(new
                {
                    message =
                        "Total upload size must not exceed 50MB."
                });
            }

            // Allowed Types
            var allowedTypes = new[]
            {
        "image/jpeg",
        "image/png",
        "image/webp",
        "video/mp4",
        "video/quicktime",
        "video/x-msvideo"
    };

            foreach (var file in dto.attachments)
            {
                // Empty file
                if (file.Length <= 0)
                {
                    return BadRequest(new
                    {
                        message =
                            $"Empty file detected: {file.FileName}"
                    });
                }

                // Invalid MIME
                if (!allowedTypes.Contains(file.ContentType))
                {
                    return BadRequest(new
                    {
                        message =
                            $"File type not allowed: {file.FileName}"
                    });
                }

                // Individual Limit
                if (file.Length >
                    30 * 1024 * 1024)
                {
                    return BadRequest(new
                    {
                        message =
                            $"File exceeds 30MB: {file.FileName}"
                    });
                }
            }
        }

        try
        {
            // =========================
            // GET TRANSACTION ID
            // =========================

            var firstInventory =
                await _context.inventories

                    .Include(i => i.delivery_item)

                        .ThenInclude(di => di.delivery)

                            .ThenInclude(d => d.customer_transaction)

                    .FirstOrDefaultAsync(i =>
                        i.id ==
                        dto.items.First().original_inventory_id
                    );

            if (firstInventory == null)
            {
                await transaction.RollbackAsync();

                return BadRequest(new
                {
                    message = "Inventory not found."
                });
            }

            var customerTransactionId =
                firstInventory
                    .delivery_item
                    ?.delivery
                    ?.customer_transaction
                    ?.id;

            // =========================
            // CREATE MAIN WARRANTY
            // =========================

            var warrantyCode =
                await GenerateOutrightWarrantyCodeAsync();

            var warranty =
                new outright_replacement_warranty
                {
                    customer_id =
                        customerId.Value,

                    customer_transaction_id =
                        customerTransactionId,

                    status =
                        "PENDING_REVIEW",

                    customer_notes =
                        dto.customer_notes,

                    warranty_code =
                        warrantyCode,

                    created_at =
                        DateTime.UtcNow
                };

            _context
                .outright_replacement_warranties
                .Add(warranty);

            await _context.SaveChangesAsync();

            // VALIDATE + CREATE ITEMS

            foreach (var item in dto.items)
            {
                // VALIDATE INVENTORY

                var inventory =
                    await _context.inventories

                    .Include(i => i.product)

                    .Include(i => i.delivery_item)

                        .ThenInclude(di => di.delivery)

                            .ThenInclude(d => d.customer_transaction)

                    .FirstOrDefaultAsync(i =>
                        i.id ==
                            item.original_inventory_id
                    );

                if (inventory == null)
                {
                    await transaction.RollbackAsync();

                    return BadRequest(new
                    {
                        message =
                            $"Inventory not found. ID: {item.original_inventory_id}"
                    });
                }

                // VALIDATE PRODUCT MATCH

                if (inventory.product_id != item.product_id)
                {
                    await transaction.RollbackAsync();

                    return BadRequest(new
                    {
                        message =
                            "Product mismatch detected."
                    });
                }


                // VALIDATE OWNERSHIP
                /*
                var transactionOwner =
                    inventory
                        .delivery_item
                        ?.delivery
                        ?.customer_transaction
                        ?.customer_id;
                
                if (transactionOwner != customerId)
                {
                    await transaction.RollbackAsync();

                    return Unauthorized(new
                    {
                        message =
                            "You are not authorized to claim this product."
                    });
                }

                */

                // VALIDATE WARRANTY OWNERSHIP

                if (warranty.customer_id != customerId)
                {
                    await transaction.RollbackAsync();

                    return Unauthorized(new
                    {
                        message =
                            "You are not authorized to claim this warranty."
                    });
                }

                // VALIDATE INVENTORY STATUS

                if (inventory.status != "SOLD")
                {
                    await transaction.RollbackAsync();

                    return BadRequest(new
                    {
                        message =
                            $"Inventory unit is not eligible for outright replacement. Serial: {inventory.serial_number}"
                    });
                }


                // VALIDATE WARRANTY DAYS

                var deliveredAt =
                    inventory
                        .delivery_item
                        ?.delivery
                        ?.delivered_at;

                var outrightDays =
                    inventory
                        .product
                        ?.outright_replacement_days ?? 0;

                if (!deliveredAt.HasValue)
                {
                    await transaction.RollbackAsync();

                    return BadRequest(new
                    {
                        message =
                            "Delivery date not found."
                    });
                }

                var expiryDate =
                    deliveredAt.Value
                        .AddDays(outrightDays);

                if (DateTime.UtcNow > expiryDate)
                {
                    await transaction.RollbackAsync();

                    return BadRequest(new
                    {
                        message =
                            $"Outright replacement expired for serial: {inventory.serial_number}"
                    });
                }

                if (outrightDays <= 0)
                {
                    await transaction.RollbackAsync();

                    return BadRequest(new
                    {
                        message =
                            $"Product is not eligible for outright replacement. Serial: {inventory.serial_number}"
                    });
                }

                // VALIDATE ACTIVE CLAIM

                var alreadyClaimed =
                    await _context
                        .outright_replacement_warranty_items

                        .Include(x =>
                            x.outright_replacement_warranty)

                        .AnyAsync(x =>

                            x.original_inventory_id ==
                                item.original_inventory_id

                            &&

                            x.outright_replacement_warranty.status
                                != "REJECTED"
                        );

                if (alreadyClaimed)
                {
                    await transaction.RollbackAsync();

                    return BadRequest(new
                    {
                        message =
                            $"This product already has an active outright replacement claim. Serial: {inventory.serial_number}"
                    });
                }


                // VALIDATE ISSUE


                if (string.IsNullOrWhiteSpace(
                    item.issue_description))
                {
                    await transaction.RollbackAsync();

                    return BadRequest(new
                    {
                        message =
                            "Issue description is required."
                    });
                }

                // CREATE WARRANTY ITEM

                var warrantyItem =
                    new outright_replacement_warranty_item
                    {
                        outright_replacement_warranty_id =
                            warranty.id,

                        original_delivery_item_id =
                            item.delivery_item_id,

                        original_inventory_id =
                            item.original_inventory_id,

                        product_id =
                            item.product_id,

                        complaint =
                            item.issue_description,

                    };

                _context
                    .outright_replacement_warranty_items
                    .Add(warrantyItem);
            }

            await _context.SaveChangesAsync();

            // ATTACHMENTS

            if (dto.attachments != null &&
                dto.attachments.Any())
            {
                foreach (var file in dto.attachments)
                {
                    // Upload to Cloudinary
                    var uploadedUrl =
                        await _cloudinaryService
                            .UploadFileAsync(file);

                    // Save DB
                    var attachment =
                        new outright_replacement_warranty_attachment
                        {
                            outright_replacement_warranty_id =
                                warranty.id,

                            file_name =
                                file.FileName,

                            file_path =
                                uploadedUrl,

                            file_type =
                                file.ContentType,
                        };

                    _context
                        .outright_replacement_warranty_attachments
                        .Add(attachment);
                }

                await _context.SaveChangesAsync();
            }
            // COMMIT

            await transaction.CommitAsync();

            // SUCCESS

            return Ok(new
            {
                message =
                    "Outright replacement claim submitted successfully.",

                warranty_id =
                    warranty.id
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






































    ///Outright Warranty Code Generator
    private async Task<string> GenerateOutrightWarrantyCodeAsync()
    {

        var today =
            DateTime.UtcNow;

        // MMDDYY
        var datePart =
            today.ToString("MMddyy");

        var prefix =
            $"OW-{datePart}";


        var todayCount =
            await _context
                .outright_replacement_warranties

                .CountAsync(x =>

                    x.created_at.HasValue &&

                    x.created_at.Value.Date ==
                        today.Date
                );

        var increment =
            (todayCount + 1)
            .ToString("D4");

        return $"{prefix}{increment}";

        // Example:
        // OW-0515260001
    }
}
