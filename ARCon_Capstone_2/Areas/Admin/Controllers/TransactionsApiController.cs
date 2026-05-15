using ARCon_Capstone_2.Data;
using ARCon_Capstone_2.DTOs;
using ARCon_Capstone_2.Models;
using ARCon_Capstone_2.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ARCon_Capstone_2.Services;
using Humanizer;
using System.Text.Json;
using System.Reflection.Metadata;
using System.Security.Cryptography;
using System.Text;
using System.Net.Http.Headers;
using System.Text.Json.Nodes;
using ARCon_Capstone_2.Helpers.LalamoveHelpers;
using System.Data;
namespace ARCon_Capstone_2.Areas.Admin.Controllers;


[Route("api/tech-calendar")]
public class TechnicianCalendarApiController : ControllerBase
{
    public readonly ARCon_Capstone_2_DbContext _context;

    public TechnicianCalendarApiController(ARCon_Capstone_2_DbContext context)
    {
        _context = context;
    }

    [HttpGet("technician/{technicianId}/calendar-bookings")]
    public async Task<IActionResult> GetTechnicianCalendarBookings(
    int technicianId,
    DateTime? start = null,
    DateTime? end = null)
    {
        try
        {
            // 🔹 Session Authentication
            var sessionTechnicianId =
                HttpContext.Session.GetInt32("UserId");

            var userType =
                HttpContext.Session.GetString("UserType");

            if (sessionTechnicianId == null ||
                userType != "AIRCON_TECHNICIAN")
            {
                return Unauthorized();
            }

            // 🔹 Override URL technicianId
            technicianId = sessionTechnicianId.Value;

            // 🔹 Optional date filtering
            var rangeStart = start ?? DateTime.Today.AddMonths(-1);
            var rangeEnd = end ?? DateTime.Today.AddMonths(3);

            var bookings = await _context.service_transaction_technicians

                .Include(x => x.service_transaction)
                    .ThenInclude(st => st.service_booking)
                        .ThenInclude(sb => sb.customer)

                .Where(x => x.technician_id == technicianId)

                .Where(x =>
                    x.service_transaction.status != "CANCELLED" &&
                    x.service_transaction.status != "FAILED"
                )

                .Select(x => new
                {
                    assignment_id = x.id,

                    service_transaction_id =
                        x.service_transaction.id,

                    transaction_status =
                        x.service_transaction.status,

                    difficulty =
                        x.service_transaction.difficulty_rate,

                    booking_id =
                        x.service_transaction.service_booking.id,

                    booking_status =
                        x.service_transaction.service_booking.status,

                    customer_name =
                        x.service_transaction.service_booking.customer.first_name +
                        " " +
                        x.service_transaction.service_booking.customer.last_name,

                    start =
                        x.service_transaction.actual_scheduled_date
                            .ToDateTime(
                                TimeOnly.FromTimeSpan(
                                    x.service_transaction.actual_scheduled_time
                                )
                            ),

                    end =
                        x.service_transaction.estimated_completion_date
                            .ToDateTime(
                                TimeOnly.FromTimeSpan(
                                    x.service_transaction.estimated_completion_time
                                )
                            ),

                    transaction_code =
                        x.service_transaction.st_ref_code,

                    notes =
                        x.service_transaction.notes_to_technicians
                })

                .OrderBy(x => x.start)

                .ToListAsync();

            return Ok(new
            {
                technician_id = technicianId,
                total = bookings.Count,
                data = bookings
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = "Error loading technician calendar bookings",
                error = ex.Message
            });
        }
    }



}
