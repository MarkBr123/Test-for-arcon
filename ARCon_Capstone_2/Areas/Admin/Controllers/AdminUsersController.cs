using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ARCon_Capstone_2.Data;


namespace ARCon_Capstone_2.Areas.Admin.Controllers
{
    [Area("Admin")]
    public class AdminUsersController : Controller
    {
        private readonly ARCon_Capstone_2_DbContext _context;

        public AdminUsersController(ARCon_Capstone_2_DbContext context)
        {
            _context = context;
        }

        public async Task<IActionResult> Index()
        {
            ViewBag.Roles = await _context.roles
                .OrderBy(r => r.role_name)
                .ToListAsync();

            return View();
        }

  
    }

    
}


