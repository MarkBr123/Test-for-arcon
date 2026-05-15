using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ARCon_Capstone_2.Data;
using ARCon_Capstone_2.Attributes;


namespace ARCon_Capstone_2.Areas.Admin.Controllers
{
    [Area("Admin")]
    [RoleAuthorize(
        "ADMIN",
        "SUPER_ADMIN",
        "CSM"
    )]
    public class PurchaseOrdersController : BaseAdminController
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

