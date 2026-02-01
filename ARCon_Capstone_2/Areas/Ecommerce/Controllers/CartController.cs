using Microsoft.AspNetCore.Mvc;

[Area("Ecommerce")]
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
