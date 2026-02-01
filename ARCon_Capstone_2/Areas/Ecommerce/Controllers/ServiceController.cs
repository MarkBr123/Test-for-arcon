using Microsoft.AspNetCore.Mvc;

[Area("Ecommerce")]
public class ServiceController : Controller
{
    public IActionResult Index()
    {
        return View();
    }

}
