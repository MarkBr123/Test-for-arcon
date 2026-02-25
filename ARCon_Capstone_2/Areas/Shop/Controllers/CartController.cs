using ARCon_Capstone_2.Models;
using Microsoft.AspNetCore.Mvc;

[Area("Shop")]
public class CartController : Controller
{

    private bool IsCustomer()
    {
        var customerId = HttpContext.Session.GetInt32("UserId");
        var userType = HttpContext.Session.GetString("UserType");

        return customerId != null && userType == "CUSTOMER";
    }


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
        if (!IsCustomer())
            return RedirectToAction("Login", "Home", new { area = "Shop" });

        return View();
    }

    [HttpPost]
    public IActionResult CheckoutSelected([FromBody] List<int> cartItemIds)
    {
        HttpContext.Session.SetString(
            "SelectedCartItems",
            string.Join(",", cartItemIds)
        );

        return Ok();
    }


}

