using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ARCon_Capstone_2.Data;


namespace ARCon_Capstone_2.Areas.Admin.Controllers
{
    [Area("Admin")]
    public class PurchaseOrdersController : Controller
    {
        public IActionResult Index() => View();

        public IActionResult Create()
        {
            ViewBag.Mode = "CREATE";
            return View("Form");
        }

        public IActionResult Edit(int id)
        {
            ViewBag.Mode = "EDIT";
            ViewBag.PoId = id;
            return View("Form");
        }

        public IActionResult Summary(int id)
        {
            ViewBag.Mode = "SUMMARY";
            ViewBag.PoId = id;
            return View("Form");
        }
    }

}

