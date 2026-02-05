using ARCon_Capstone_2.Models;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;

namespace ARCon_Capstone_2.Areas.Controllers
{
    [Area("Shop")]
    public class Index : Controller
    {
        public IActionResult Cleaning()
        {
            return View("~/Areas/Ecommerce/Views/Service/Cleaning.cshtml");

        }

        public IActionResult Repair()
        {
            return View("~/Areas/Ecommerce/Views/Service/Repair.cshtml");
        }

        public IActionResult FreonCharging()
        {
            return View("~/Areas/Ecommerce/Views/Service/FreonCharging.cshtml");

        }

        public IActionResult Installing()
        {
            return View("~/Areas/Ecommerce/Views/Service/Installing.cshtml");

        }
    }


}
