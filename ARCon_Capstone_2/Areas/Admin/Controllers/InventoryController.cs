using ARCon_Capstone_2.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;



namespace ARCon_Capstone_2.Areas.Admin.Controllers
{
    [Area("Admin")]
    [Route("Admin/Inventory")]
    public class InventoryController : BaseAdminController
    {
        // GET: /Admin/Inventory
        [HttpGet("")]
        public IActionResult Index()
        {
            return View();
        }

        // GET: /Admin/Inventory/receive-po
        [HttpGet("receive-po")]
        public IActionResult ReceivePo()
        {
            return View();
        }

        // GET: /Admin/Inventory/receive-replacement
        [HttpGet("receive-replacement")]
        public IActionResult ReceiveReplacement()
        {
            return View();
        }
    }
}
