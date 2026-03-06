using Microsoft.AspNetCore.Mvc;

[Area("Shop")]
public class ProductController : Controller
{
    public IActionResult Details(int id)
    {
        ViewBag.ProductId = id;

        var customerId = HttpContext.Session.GetInt32("UserId");
        var userType = HttpContext.Session.GetString("UserType");

        ViewBag.IsLoggedIn = (customerId != null && userType == "CUSTOMER");

        return View();
    }
}
