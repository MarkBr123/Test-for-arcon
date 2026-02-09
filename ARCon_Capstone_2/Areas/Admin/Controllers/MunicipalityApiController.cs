using ARCon_Capstone_2.Models;
using ARCon_Capstone_2.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ARCon_Capstone_2.Services;
using System.Runtime.CompilerServices;
using ARCon_Capstone_2.Data;

namespace ARCon_Capstone_2.Controllers;


[AllowAnonymous]
[ApiController]
[Route("api/municipality")]

public class MunicipalityApiController : ControllerBase
{
    private readonly ARCon_Capstone_2_DbContext _context;
    public MunicipalityApiController(ARCon_Capstone_2_DbContext context)
    {
        _context = context;
    }

    [HttpGet("provinceID/{provID:int}")]
    public async Task<IActionResult> GetMunicipality(int provID)
    {
        var municipalities = await _context.municipality
            .Where(m => m.province_id == provID)
            .OrderBy(m => m.municipality_name)
            .Select(m => new
            {
                m.id,
                m.municipality_name
            })
            .ToListAsync();
        return Ok(municipalities);
    }
}