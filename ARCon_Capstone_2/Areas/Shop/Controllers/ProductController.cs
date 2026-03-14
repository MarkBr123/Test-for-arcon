using Microsoft.AspNetCore.Mvc;

namespace ARCon_Capstone_2.Areas.Shop.Controllers
{
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

        // ✅ Add this action
        public IActionResult Search_results()
        {
            // This will look for: Areas/Shop/Views/Product/Search_results.cshtml
            return View();
        }
    }
}