using Microsoft.AspNetCore.Mvc;
using ARCon_Capstone_2.Models;
using System.Diagnostics;
using Microsoft.EntityFrameworkCore;
using ARCon_Capstone_2.Data;
using Microsoft.AspNetCore.Identity;
using ARCon_Capstone_2.Filters;



[Area("Shop")]
[CustomerAuthorization]
public class OrdersController : Controller
{
    private readonly ARCon_Capstone_2_DbContext _context;

    public OrdersController(ARCon_Capstone_2_DbContext context)
    {
        _context = context;
    }

    public async Task<IActionResult> MyPurchases()
    {
        var customerId = HttpContext.Session.GetInt32("UserId");

        var orders = await _context.customer_transactions
            .Where(x => x.customer_id == customerId.Value)
            .ToListAsync();

        return View(orders);
    }

    public async Task<IActionResult> PurchaseSummary()
    {
        var customerId = HttpContext.Session.GetInt32("UserId");

        var orders = await _context.customer_transactions
            .Where(x => x.customer_id == customerId.Value)
            .ToListAsync();

        return View(orders);
    }


    public async Task<IActionResult> MyServices()
    {
        var customerId = HttpContext.Session.GetInt32("UserId");

        var orders = await _context.service_bookings
            .Where(x => x.customer_id == customerId.Value)
            .ToListAsync();

        return View(orders);
    }
}

