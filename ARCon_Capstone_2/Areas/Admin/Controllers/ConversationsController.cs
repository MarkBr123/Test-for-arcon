using ARCon_Capstone_2.Areas.Admin.Controllers;
using ARCon_Capstone_2.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Areas.Admin.Controllers
{
    [Area("Admin")]
    public class ConversationsController: BaseAdminController
    {
        public IActionResult Index(string type = "INTERNAL")
        {
            ViewBag.ChatType = type;
            return View();
        }

    }
}
