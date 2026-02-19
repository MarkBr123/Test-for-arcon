using ARCon_Capstone_2.Models;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;

namespace ARCon_Capstone_2.Areas.Controllers
{
    [Area("Shop")]
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;

        public HomeController(ILogger<HomeController> logger)
        {
            _logger = logger;
        }

        public IActionResult Index()
        {
            return View();
        }

        public IActionResult Contact()
        {
            return View();
        }
        public IActionResult Product(int id)
        {
            ViewBag.ProductId = id;
            return View("Product"); // cleaner
        }

        public IActionResult About()
        {
            return View();
        }

        public IActionResult Featured()
        {
            return View("~/Areas/Shop/Views/Product/Featured.cshtml");
        }

        public IActionResult Search()
        {
            return View("~/Areas/Shop/Views/Product/Search_results.cshtml");
        }

        public IActionResult Login()
        {
            return View();
        }

        public IActionResult Signin()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}
