using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ARCon_Capstone_2.Data;
using Newtonsoft.Json;


namespace ARCon_Capstone_2.Areas.Admin.Controllers
{
    [Area("Admin")]
    public class ReturnOrdersController : BaseAdminController
    {
        public IActionResult Index() => View();

        public IActionResult ReturnIndex() 
        {
            return View();
        }

        public IActionResult NewReturnOrder()
        {
            ViewBag.Mode = "CREATE";

            return View();
        }


    }
}


