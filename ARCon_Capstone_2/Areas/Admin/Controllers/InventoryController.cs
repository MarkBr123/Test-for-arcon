using ARCon_Capstone_2.Attributes;
using ARCon_Capstone_2.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;



namespace ARCon_Capstone_2.Areas.Admin.Controllers
{

    [Route("Admin/Inventory")]

    [Area("Admin")]

    [RoleAuthorize(
        "ADMIN",
        "SUPER_ADMIN",
        "CSM"
    )]

    public class InventoryController : BaseAdminController
    {
        // GET: /Admin/Inventory
        [HttpGet("")]
        public IActionResult Index()
        {
            return View();
        }

        [RoleAuthorize(
        "ADMIN"
        )]
        // GET: /Admin/Inventory/receive-po
        [HttpGet("receive-po")]
        public IActionResult ReceivePo()
        {
            return View();
        }

        [RoleAuthorize(
        "ADMIN"
        )]
        // GET: /Admin/Inventory/receive-ro
        [HttpGet("receive-ro")]
        public IActionResult ReceiveRo()
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
