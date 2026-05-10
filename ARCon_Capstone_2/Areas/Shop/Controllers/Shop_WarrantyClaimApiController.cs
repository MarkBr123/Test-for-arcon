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

        var today = DateOnly.FromDateTime(DateTime.Now);

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
                TimeOnly.FromDateTime(DateTime.Now);

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
            // Customer Session
            // =========================

            var customerId = HttpContext.Session.GetInt32("UserId");
            if (customerId == null)
                return Unauthorized(new { message = "Login Required" });


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

            var now = DateTime.Now;

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
        var today = DateTime.Now;
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

}
