using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ARCon_Capstone_2.Data;
using Newtonsoft.Json;


namespace ARCon_Capstone_2.Areas.Admin.Controllers
{
    [Area("Admin")]
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
            return View();
        }
    }

    
}


