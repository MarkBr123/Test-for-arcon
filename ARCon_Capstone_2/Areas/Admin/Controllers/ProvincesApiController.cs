
using ARCon_Capstone_2.Data;
using ARCon_Capstone_2.DTOs;
using ARCon_Capstone_2.Models;
using ARCon_Capstone_2.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ARCon_Capstone_2.Services;
using System.Runtime.CompilerServices;
namespace ARCon_Capstone_2.Controllers;

[AllowAnonymous]
[ApiController]
[Route ("api/provinces")]
public class ProvincesApiController: ControllerBase
{
    private readonly ARCon_Capstone_2_DbContext _context;
    public ProvincesApiController(ARCon_Capstone_2_DbContext context)
    { 
        _context = context;
    }

    [HttpGet("regionID/{regionID:int}")]
    public async Task<IActionResult> GetProvinces(int regionID)
    {
        var provinces = await _context.provinces
            .Where(p => p.region_id == regionID)
            .OrderBy(p => p.province_name)
            .Select(p => new { p.id, p.province_name})
            .ToListAsync();
    return Ok(provinces);
    }
}

