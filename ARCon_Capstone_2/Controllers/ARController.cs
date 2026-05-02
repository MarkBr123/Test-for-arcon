using Microsoft.AspNetCore.Mvc;

namespace ARCon_Capstone_2.Controllers
{
    public class ARController : Controller
    {
        [HttpGet("ar/viewer")]
        public IActionResult Viewer(string sku, string name)
        {
            ViewBag.SKU = sku ?? "CAR-SPL00001";
            ViewBag.ProductName = name ?? "Air Conditioner";
            return View();
        }
    }
}