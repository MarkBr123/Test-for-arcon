using Microsoft.AspNetCore.Mvc;

namespace ARCon_Capstone_2.Controllers
{
    public class HomeController : Controller
    {
        public IActionResult Index()
        {
            return RedirectToAction(
                "Index",
                "Home",
                new { area = "Ecommerce" }
            );
        }
    }
}
