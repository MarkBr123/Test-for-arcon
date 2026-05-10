using ARCon_Capstone_2.Data;
using ARCon_Capstone_2.DTOs;
using ARCon_Capstone_2.Models;
using ARCon_Capstone_2.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ARCon_Capstone_2.Services;


[AllowAnonymous]
[ApiController]
[Route("api/warranties")]
public class WarrantyApiController : ControllerBase
{
    private readonly ARCon_Capstone_2_DbContext _context;

    public WarrantyApiController(ARCon_Capstone_2_DbContext context)
    {
        _context = context;
    }

    //Get Main Table for Service Warranty
    [HttpGet]
    public async Task<IActionResult> GetServiceWarrantyBookings(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 2,
            [FromQuery] string? search = null,
            [FromQuery] string sortBy = "created_at",
            [FromQuery] string sortDirection = "desc",
            [FromQuery] string? status = null)
        {
            var q = _context.service_warranty_bookings
                .Include(x => x.service_booking)
                    .ThenInclude(sb => sb.customer)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                search = search.Trim().ToLower();

                q = q.Where(x =>

                    x.complaint.ToLower().Contains(search) ||

                    (x.swb_code != null &&
                     x.swb_code.ToLower().Contains(search)) ||

                    x.customer.first_name.ToLower().Contains(search) ||

                    x.customer.last_name.ToLower().Contains(search) ||

                    (x.customer.first_name + " " + x.customer.last_name)
                        .ToLower()
                        .Contains(search) ||

                    x.service_booking.booking_ref_code
                        .ToLower()
                        .Contains(search) ||

                    x.service_booking_id.ToString()
                        .Contains(search)
                );
            }

        // filter
        if (!string.IsNullOrWhiteSpace(status))
        {
                q = q.Where(x => x.status == status);
        }

        // sorting
        q = (sortBy?.ToLower(), sortDirection?.ToLower()) switch
            {
                ("status", "asc")
                    => q.OrderBy(x => x.status),

                ("status", "desc")
                    => q.OrderByDescending(x => x.status),

                ("preferred_date", "asc")
                    => q.OrderBy(x => x.preferred_date),

                ("preferred_date", "desc")
                    => q.OrderByDescending(x => x.preferred_date),

                ("preferred_time", "asc")
                    => q.OrderBy(x => x.preferred_time),

                ("preferred_time", "desc")
                    => q.OrderByDescending(x => x.preferred_time),

                ("swb_code", "asc")
                    => q.OrderBy(x => x.swb_code),

                ("swb_code", "desc")
                    => q.OrderByDescending(x => x.swb_code),

                ("booking_ref_code", "asc")
                    => q.OrderBy(x => x.service_booking.booking_ref_code),

                ("booking_ref_code", "desc")
                    => q.OrderByDescending(x => x.service_booking.booking_ref_code),

                ("first_name", "asc")
                    => q.OrderBy(x => x.customer.first_name),

                ("first_name", "desc")
                    => q.OrderByDescending(x => x.customer.first_name),

                ("last_name", "asc")
                    => q.OrderBy(x => x.customer.last_name),

                ("last_name", "desc")
                    => q.OrderByDescending(x => x.customer.last_name),

                ("created_at", "asc")
                    => q.OrderBy(x => x.created_at),

                _ => q.OrderByDescending(x => x.created_at)
            };

        var totalCount = await q.CountAsync();

        var items = await q
              .Skip((page - 1) * pageSize)
              .Take(pageSize)
              .Select(x => new
              {
                  x.id,

                  x.swb_code,

                  x.service_booking_id,

                  booking_ref_code = x.service_booking.booking_ref_code,

                  first_name = x.customer.first_name,

                  middle_name = x.customer.middle_name,

                  last_name = x.customer.last_name,

                  customer_name =
                      x.customer.first_name + " " +
                      x.customer.middle_name + " " +
                      x.customer.last_name,

                  x.complaint,

                  x.preferred_date,

                  x.preferred_time,

                  x.status,

                  x.created_at
              })
              .ToListAsync();

        return Ok(new
        {
                items,
                page,
                pageSize,
                totalCount,
                totalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetWarrantySummary(int id)
    {
        var warranty = await _context.service_warranty_bookings

            .Include(x => x.customer)

            .Include(x => x.service_booking)
                .ThenInclude(sb => sb.customer)

            .Include(x => x.service_warranty_attachments)

            .FirstOrDefaultAsync(x => x.id == id);

        if (warranty == null)
        {
            return NotFound(new
            {
                message = "Warranty booking not found."
            });
        }

        return Ok(new
        {
            // WARRANTY BOOKING

            warranty_booking = new
            {
                warranty.id,

                warranty.swb_code,

                warranty.service_booking_id,

                warranty.complaint,

                warranty.diagnosis_notes,

                warranty.technician_notes,

                warranty.status,

                warranty.is_repeat_issue,

                warranty.isactiveclaim,

                warranty.preferred_date,

                warranty.preferred_time,

                warranty.created_at,

                warranty.approved_at,

                warranty.resolved_at,

                warranty.cancelled_at
            },

            // CUSTOMER
            customer = new
            {
                warranty.service_booking.customer.id,

                warranty.service_booking.customer.first_name,

                warranty.service_booking.customer.middle_name,

                warranty.service_booking.customer.last_name,

                warranty.service_booking.customer.contact_no,

                warranty.service_booking.customer.email
            },

            // SERVICE BOOKING

            service_booking = new
            {
                warranty.service_booking.id,

                warranty.service_booking.booking_ref_code,

                warranty.service_booking.status,

                warranty.service_booking.paid_at,

                warranty.service_booking.created_at,

                warranty.service_booking.customer_note
            },
            // ATTACHMENTS
            attachments = warranty
                .service_warranty_attachments
                .Select(a => new
                {
                    a.id,

                    a.file_name,

                    a.file_path,

                    a.created_at
                })
                .ToList()
        });
    }

    /// <summary>
    /// Service Transaction Reference Code Generator
    /// </summary>
    /// <returns></returns>
    private string GenerateServiceTransactionRefCode()
    {
        var now = DateTime.Now;
        return $"SRV{now:MMdd}-{now:HHmmss}";
    }


    //Transaction Creation for Service_Warranty_Booking for (APPROVED warranty claims)
    [HttpPost("{id}/approve")]
    public async Task<IActionResult> ApproveWarrantyClaim(
    int id,

    [FromBody] ApproveWarrantyClaimDto dto)
    {
        await using var tx =
            await _context.Database.BeginTransactionAsync();

        try
        {

            // GET WARRANTY

            var warranty =
                await _context.service_warranty_bookings

                .Include(x => x.service_booking)

                .FirstOrDefaultAsync(x => x.id == id);

            if (warranty == null)
            {
                return NotFound(new
                {
                    message =
                        "Warranty claim not found."
                });
            }

            // VALIDATE STATUS

            if (warranty.status != "PENDING_REVIEW")
            {
                return BadRequest(new
                {
                    message =
                        "Only pending warranty claims can be approved."
                });
            }

            // VALIDATE DIAGNOSIS NOTES

            if (string.IsNullOrWhiteSpace(
                    dto.diagnosis_notes))
            {
                return BadRequest(new
                {
                    message =
                        "Diagnosis notes are required."
                });
            }

            if (dto.diagnosis_notes.Trim().Length < 5)
            {
                return BadRequest(new
                {
                    message =
                        "Diagnosis notes must contain at least 5 characters."
                });
            }

            // VALIDATE REPEAT ISSUE

            if (dto.is_repeat_issue == null)
            {
                return BadRequest(new
                {
                    message =
                        "Please specify whether this is a repeat issue."
                });
            }

            // VALIDATE TECHNICIANS

            if (dto.no_technicians_req <= 0)
            {
                return BadRequest(new
                {
                    message =
                        "Number of technicians is required."
                });
            }


            // VALIDATE DIFFICULTY

            if (dto.difficulty_rate <= 0)
            {
                return BadRequest(new
                {
                    message =
                        "Difficulty rate is required."
                });
            }

            // VALIDATE SCHEDULE


            var scheduled =
                dto.actual_scheduled_date.ToDateTime(
                    TimeOnly.FromTimeSpan(
                        dto.actual_scheduled_time
                    )
                );

            if (scheduled < DateTime.Now)
            {
                return BadRequest(new
                {
                    message =
                        "Scheduled date/time cannot be in the past."
                });
            }

            // VALIDATE ESTIMATED COMPLETION

            var estimated =
                dto.estimated_completion_date.ToDateTime(
                    TimeOnly.FromTimeSpan(
                        dto.estimated_completion_time
                    )
                );

            if (estimated <= scheduled)
            {
                return BadRequest(new
                {
                    message =
                        "Estimated completion must be after scheduled date/time."
                });
            }

            // VALIDATE RESERVICE FEE=

            if (dto.reservice_fee < 0)
            {
                return BadRequest(new
                {
                    message =
                        "Reservice fee cannot be negative."
                });
            }

            // GENERATE REF CODE
            var stRefCode =
                GenerateServiceTransactionRefCode();

            // COUNT SERVICE TRIES

            var tries =
                await _context.service_transactions
                .CountAsync(x =>

                    x.service_booking_id ==
                        warranty.service_booking_id
                );

            // UPDATE SERVICE BOOKING

            warranty.service_booking.status =
                "APPROVED_FOR_WARRANTY";

            warranty.service_booking.updated_at =
                DateTime.UtcNow;

            // UPDATE WARRANTY


            warranty.status =
                "APPROVED";

            warranty.approved_at =
                DateTime.UtcNow;

            warranty.diagnosis_notes =
                dto.diagnosis_notes.Trim();

            warranty.technician_notes =
                dto.technician_notes?.Trim();

            warranty.is_repeat_issue =
                dto.is_repeat_issue;

            // CREATE SERVICE TRANSACTION


            var transaction =
                new service_transaction
                {
                    service_booking_id =
                        warranty.service_booking_id,

                    st_ref_code =
                        stRefCode,

                    st_type =
                        "SERVICE_WARRANTY",

                    no_technicians_req =
                        dto.no_technicians_req,

                    difficulty_rate =
                        dto.difficulty_rate,

                    parts_needed =
                        dto.parts_needed,

                    tools_need =
                        dto.tools_needed,

                    actual_scheduled_date =
                        dto.actual_scheduled_date,

                    actual_scheduled_time =
                        dto.actual_scheduled_time,

                    estimated_completion_date =
                        dto.estimated_completion_date,

                    estimated_completion_time =
                        dto.estimated_completion_time,

                    reservice_fee =
                        dto.reservice_fee,

                    notes_to_technicians =
                        dto.notes_to_technicians,

                    service_tries =
                        tries + 1,

                    status =
                        "FOR_TECH_ASSIGNMENT"
                };

            _context.service_transactions
                .Add(transaction);

            await _context.SaveChangesAsync();


            // LINK WARRANTY TO TRANSACTION


            warranty.linked_service_transaction_id =
                transaction.id;

            await _context.SaveChangesAsync();

            // COMMIT

            await tx.CommitAsync();


            return Ok(new
            {
                message =
                    "Warranty approved successfully.",

                service_transaction_id =
                    transaction.id,

                st_ref_code =
                    transaction.st_ref_code
            });

        }
        catch (Exception ex)
        {
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

}
