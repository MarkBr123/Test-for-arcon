using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ARCon_Capstone_2.Data;
using Newtonsoft.Json;
using ARCon_Capstone_2.Attributes;


namespace ARCon_Capstone_2.Areas.Admin.Controllers
{
    [Area("Admin")]

    public class ServicesController : BaseAdminController
    {
        [RoleAuthorize(
            "ADMIN",
            "SUPER_ADMIN",
            "CSM"
        )]
        public IActionResult Index() // done
        {
            return View();
        }

        [RoleAuthorize(
            "ADMIN",
            "SUPER_ADMIN",
            "CSM"
        )]
        public IActionResult For_Confirmation() 
        {
            return View();
        }

        [RoleAuthorize(
        "ADMIN",
        "SUPER_ADMIN",
        "CSM"
        )]
        public IActionResult Processing() 
        {
            return View();
        }

        [RoleAuthorize(
            "ADMIN",
            "SUPER_ADMIN",
            "CSM"
        )]
        public IActionResult Service_Payments() 
        {
            return View();
        }

        [RoleAuthorize(
            "ADMIN",
            "SUPER_ADMIN",
            "CSM"
        )]
        public IActionResult Tech_Assign()
        {
            return View();
        }

        [RoleAuthorize(
            "ADMIN",
            "SUPER_ADMIN",
            "CSM"
        )]
        public IActionResult Scheduled()
        {
            return View();
        }

        [RoleAuthorize(
            "ADMIN",
            "SUPER_ADMIN",
            "CSM"
        )]
        public IActionResult All_Bookings()
        {
            return View();
        }

        public IActionResult All_Service_Transactions()
        {
            return View();
        }

        [RoleAuthorize(
        "ADMIN",
        "SUPER_ADMIN",
        "CSM"
        )]
        public IActionResult SBooking_Summary(int id)
        {
            ViewBag.BookingId = id; 
            return View();
        }

        public IActionResult SB_ST_Summary(int id)
        {
            ViewBag.TransactionId = id;
            return View();
        }

    }
}


