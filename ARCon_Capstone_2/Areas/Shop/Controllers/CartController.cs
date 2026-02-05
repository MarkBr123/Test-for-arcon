using Microsoft.AspNetCore.Mvc;

[Area("Shop")]
public class CartController : Controller
{
    public IActionResult CartIndex()
    {
        return View();
    }

    public IActionResult Checkout()
    {
        return View();
    }
}
