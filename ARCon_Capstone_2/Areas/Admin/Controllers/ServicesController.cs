using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ARCon_Capstone_2.Data;
using Newtonsoft.Json;


namespace ARCon_Capstone_2.Areas.Admin.Controllers
{
    [Area("Admin")]
    public class ServicesController : BaseAdminController
    {
        public IActionResult Index() // done
        {
            return View();
        }
        public IActionResult For_Confirmation() //done
        {
            return View();
        }
        public IActionResult Processing() //done
        {
            return View();
        }
        public IActionResult Tech_Assign()
        {
            return View();
        }
        public IActionResult Scheduled()
        {
            return View();
        }
        public IActionResult All_Service_Transactions()
        {
            return View();
        }

        /// Summaries
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


