using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ARCon_Capstone_2.Data;
using Newtonsoft.Json;
using ARCon_Capstone_2.Attributes;


namespace ARCon_Capstone_2.Areas.Admin.Controllers
{
    [Area("Admin")]
    [RoleAuthorize(
        "ADMIN",
        "SUPER_ADMIN",
        "CSM"
    )]
    public class WarrantyController : BaseAdminController
    {
        public IActionResult Service_Warranty_Request()
        {
            return View();
        }

        [HttpGet]
        [Route("Admin/Warranty/Warranty_Claim_Summary/{id}")]
        public IActionResult Warranty_Claim_Summary(int id)
        {
            ViewBag.WarrantyId = id;
            return View();
        }

        public IActionResult Outright_Replacement_Request()
        {
            return View();
        }

        [HttpGet]
        [Route("Admin/Warranty/Outright_Replacement_Summary/{id}")]
        public IActionResult Outright_Replacement_Summary(int id)
        {
            return View();
        }
    }

    
}


