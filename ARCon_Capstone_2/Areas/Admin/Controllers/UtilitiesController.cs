using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ARCon_Capstone_2.Data;
using ARCon_Capstone_2.Attributes;


namespace ARCon_Capstone_2.Areas.Admin.Controllers
{
    [Area("Admin")]
    [RoleAuthorize(
        "ADMIN",
        "SUPER_ADMIN"
    )]

    public class UtilitiesController : BaseAdminController
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}


