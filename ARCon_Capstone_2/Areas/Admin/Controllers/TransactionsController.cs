using Microsoft.AspNetCore.Mvc;

namespace ARCon_Capstone_2.Areas.Admin.Controllers
{
    [Area("Admin")]
    public class TransactionsController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }

        [HttpGet]
        public IActionResult Summary(int id)
        {
            ViewBag.TransactionId = id;
            return View();
        }
        [HttpGet]
        public IActionResult Processing()
        {
            return View();
        }

        [HttpGet]
        public IActionResult Details(int id)
        {
            ViewBag.TransactionId = id;
            return View();
        }
        public IActionResult CreateDelivery()
        {
            return View();
        }
        public IActionResult ForShipping()
        {
            return View();
        }
        public IActionResult InTransit()
        {
            return View();
        }
        public IActionResult Cancelled_Failed()
        {
            return View();
        }
            public IActionResult Delivered()
            {
                return View();
            }
        }
}
