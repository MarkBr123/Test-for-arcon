using ARCon_Capstone_2.Models;
using Microsoft.AspNetCore.Mvc;

[Area("Shop")]
public class CartController : Controller
{   

    // This will check if user is logged in when clicking the cart icon, if not redirect to login
    public IActionResult MyCart()
    {
        var customerId = HttpContext.Session.GetInt32("UserId");
        var userType = HttpContext.Session.GetString("UserType");

        if (customerId == null || userType != "CUSTOMER")
        {
            return RedirectToAction("Login", "Home", new { area = "Shop" });
        }

        ViewBag.CustomerId = customerId;

        return View();
    }

    public IActionResult Checkout()
    {
        var customerId = HttpContext.Session.GetInt32("UserId");
        var userType = HttpContext.Session.GetString("UserType");

        ViewBag.CustomerId = customerId;

        return View();
    }
}

