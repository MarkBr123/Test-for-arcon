using Microsoft.AspNetCore.Mvc;

[Area("Shop")]
public class ServiceController : Controller
{
    private void SetLoginState()
    {
        var customerId = HttpContext.Session.GetInt32("UserId");
        var userType = HttpContext.Session.GetString("UserType");

        ViewBag.IsLoggedIn = (customerId != null && userType == "CUSTOMER");
    }

    public IActionResult Cleaning()
    {
        SetLoginState();
        return View();
    }

    public IActionResult Repair()
    {
        SetLoginState();
        return View();
    }

    public IActionResult FreonCharging()
    {
        SetLoginState();
        return View();
    }

    public IActionResult Installing()
    {
        SetLoginState();
        return View();
    }
}