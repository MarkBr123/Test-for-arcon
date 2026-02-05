using Microsoft.AspNetCore.Mvc;

[Area("Shop")]
public class ServiceController : Controller
{
    public IActionResult Index()
    {
        return View();
    }

}
