using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ARCon_Capstone_2.Data;
using Newtonsoft.Json;
using ARCon_Capstone_2.Attributes;


namespace ARCon_Capstone_2.Areas.Admin.Controllers
{
    [Area("Admin")]

    public class TechnicianCalendarController : BaseAdminController
    {

        public IActionResult MyWorkSchedule()
        {
            return View();
        }
    }
}


