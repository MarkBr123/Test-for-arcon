
using ARCon_Capstone_2.Data;
using ARCon_Capstone_2.DTOs;
using ARCon_Capstone_2.Models;
using ARCon_Capstone_2.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ARCon_Capstone_2.Services;
using System.Reflection.Metadata.Ecma335;
namespace ARCon_Capstone_2.Controllers;

[AllowAnonymous]
[ApiController]
[Route ("api/regions")]
public class RegionsApiController: ControllerBase 
{
    private readonly ARCon_Capstone_2_DbContext _context;
    public RegionsApiController(ARCon_Capstone_2_DbContext context)
    {   
        _context = context;
    }
    [HttpGet]
    public async Task<IActionResult> GetRegions()
    { 
        var region = await _context.regions
            .OrderBy(r => r.region_name)
            .Select(r => new
            {
                r.id,
                r.region_name
            })
            .ToListAsync();
        return Ok(region); 
    }
}

