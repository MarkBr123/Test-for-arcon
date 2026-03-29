using ARCon_Capstone_2.Areas.Admin.Controllers;
using ARCon_Capstone_2.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[Area("Admin")]
public class ProductsController : BaseAdminController
{
    private readonly ARCon_Capstone_2_DbContext _context;

    public ProductsController(ARCon_Capstone_2_DbContext context)
    {
        _context = context;
    }

    public async Task<IActionResult> Index()
    {
        // For dropdowns
        ViewBag.Manufacturers = await _context.manufacturers
            .OrderBy(m => m.manufacturer_name)
            .ToListAsync();

        ViewBag.FormFactors = await _context.form_factors
        .OrderBy(f => f.form_factor1)
        .ToListAsync();

        ViewBag.SpecKeys = await _context.specification_keys
        .OrderBy(k => k.id)
         .ToListAsync();

        return View();
    }
}
