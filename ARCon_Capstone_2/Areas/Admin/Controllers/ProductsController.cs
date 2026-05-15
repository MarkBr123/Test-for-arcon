using ARCon_Capstone_2.Areas.Admin.Controllers;
using ARCon_Capstone_2.Attributes;
using ARCon_Capstone_2.Data;

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Areas.Admin.Controllers
{
    [Area("Admin")]

    [RoleAuthorize(
        "ADMIN",
        "SUPER_ADMIN",
        "CSM"
    )]

    public class ProductsController
        : BaseAdminController
    {
        private readonly
            ARCon_Capstone_2_DbContext
            _context;



        public ProductsController(
            ARCon_Capstone_2_DbContext context)
        {
            _context = context;
        }



        public async Task<IActionResult>
            Index()
        {
            // Manufacturers

            ViewBag.Manufacturers =
                await _context.manufacturers

                    .OrderBy(m =>
                        m.manufacturer_name)

                    .ToListAsync();



            // Form Factors

            ViewBag.FormFactors =
                await _context.form_factors

                    .OrderBy(f =>
                        f.form_factor1)

                    .ToListAsync();



            // Spec Keys

            ViewBag.SpecKeys =
                await _context.specification_keys

                    .OrderBy(k =>
                        k.id)

                    .ToListAsync();



            return View();
        }
    }
}