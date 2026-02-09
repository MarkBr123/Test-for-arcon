using ARCon_Capstone_2.Models;
using ARCon_Capstone_2.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ARCon_Capstone_2.Services;
using System.Runtime.CompilerServices;
using ARCon_Capstone_2.Data;

namespace ARCon_Capstone_2.Areas.Admin.Controllers;


[AllowAnonymous]
[ApiController]
[Route("api/barangay")]

public class BarangayApiController : ControllerBase
{
    private readonly ARCon_Capstone_2_DbContext _context;
    public BarangayApiController(ARCon_Capstone_2_DbContext context)
    {
        _context = context;
    }
    [HttpGet("municipalityID/{munID}")]
    public async Task<IActionResult> GetBarangay(int munID)
    {
        var brgy = await _context.barangay
            .Where(b => b.municipality_id == munID)
            .OrderBy(b => b.barangay_name)
            .Select(b => new
            {
                b.id,
                b.barangay_name
            })
            .ToListAsync();
        return Ok(brgy);
    }
}

