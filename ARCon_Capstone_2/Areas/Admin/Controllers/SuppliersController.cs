using ARCon_Capstone_2.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;


namespace ARCon_Capstone_2.Areas.Admin.Controllers
{

    [Area("Admin")]
    public class SupplierController : BaseAdminController
    {
        private readonly ARCon_Capstone_2_DbContext _context;
        public SupplierController(ARCon_Capstone_2_DbContext context)
        {
            _context = context;
        }

        public async Task<IActionResult> Index()
        {

            return View();
        }
    }
}