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

            // =====================================
            // WARRANTY BOOKING
            // =====================================

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


            // =====================================
            // CUSTOMER
            // =====================================

            customer = new
            {
                warranty.service_booking.customer.id,

                warranty.service_booking.customer.first_name,

                warranty.service_booking.customer.middle_name,

                warranty.service_booking.customer.last_name,

                warranty.service_booking.customer.contact_no,

                warranty.service_booking.customer.email
            },


            // =====================================
            // SERVICE BOOKING
            // =====================================

            service_booking = new
            {
                warranty.service_booking.id,

                warranty.service_booking.booking_ref_code,

                warranty.service_booking.status,

                warranty.service_booking.paid_at,

                warranty.service_booking.created_at,

                warranty.service_booking.customer_note
            },


            // =====================================
            // ATTACHMENTS
            // =====================================

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

}
