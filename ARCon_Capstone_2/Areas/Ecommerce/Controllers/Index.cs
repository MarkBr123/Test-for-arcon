using ARCon_Capstone_2.Models;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;

namespace ARCon_Capstone_2.Areas.Controllers
{
    [Area("Ecommerce")]
    public class Index : Controller
    {
        public IActionResult Cleaning()
        {
            return View("~/Views/Service/Cleaning.cshtml");
        }

        public IActionResult Repair()
        {
            return View("~/Views/Service/Repair.cshtml");
        }

        public IActionResult FreonCharging()
        {
            return View("~/Views/Service/Freoncharging.cshtml");
        }

        public IActionResult Installing()
        {
            return View("~/Views/Service/Installing.cshtml");
        }
    }


}
