using ARCon_Capstone_2.Data;
using ARCon_Capstone_2.DTOs;
using ARCon_Capstone_2.Models;
using Humanizer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Areas.Shop.Controllers;


[ApiController]
[Route("api/customer-notifications")]
public class Shop_NotificationApiController : ControllerBase
{
        public readonly ARCon_Capstone_2_DbContext _context;
    public Shop_NotificationApiController(ARCon_Capstone_2_DbContext context)
    { 
        _context = context;
    }

    [HttpGet("unread-count")]
    public async Task<IActionResult>
            GetUnreadCount()
                {
                    var customerId =
                        HttpContext.Session.GetInt32("UserId");

                    if (customerId == null)
                        return Unauthorized();

                    var count =
                        await _context.airconi_notifications
                            .CountAsync(x =>
                                x.recipient_customer_id ==
                                    customerId &&
                                x.is_read == false);

                    return Ok(new
                    {
                        count
                    });
                }


    [HttpGet("my-notifications")]
    public async Task<IActionResult>
            GetMyNotifications()
                {
                    var customerId =
                        HttpContext.Session.GetInt32("UserId");

                    if (customerId == null)
                        return Unauthorized();

                    var notifications =
                        await _context.airconi_notifications

                            .Where(x =>
                                x.recipient_customer_id ==
                                customerId)

                            .OrderByDescending(x =>
                                x.created_at)

                            .Take(20)

                            .Select(x => new
                            {
                                x.id,

                                x.title,

                                x.message,

                                x.category,

                                x.is_read,

                                x.created_at
                            })

                            .ToListAsync();

                    return Ok(notifications);
                }


    [HttpPut("{id}/mark-read")]
    public async Task<IActionResult>
    MarkRead(int id)
    {
        var notification =
            await _context.airconi_notifications
                .FirstOrDefaultAsync(x =>
                    x.id == id);

        if (notification == null)
            return NotFound();

        notification.is_read = true;

        await _context.SaveChangesAsync();

        return Ok();
    }







}

