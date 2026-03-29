using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ARCon_Capstone_2.Data;


namespace ARCon_Capstone_2.Areas.Admin.Controllers
{
    [Area("Admin")]
    public class UtilitiesController : BaseAdminController
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}


