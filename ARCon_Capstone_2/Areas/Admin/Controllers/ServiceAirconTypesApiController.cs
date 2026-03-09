using ARCon_Capstone_2.Data;
using ARCon_Capstone_2.DTOs;
using ARCon_Capstone_2.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using static QuestPDF.Helpers.Colors;
using System.Drawing;


[AllowAnonymous]
[ApiController]
[Route("api/service-aircon-types")]


public class ServiceAirconTypesApiController : ControllerBase
{
    private readonly ARCon_Capstone_2_DbContext _context;

    public ServiceAirconTypesApiController(ARCon_Capstone_2_DbContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateServiceAirconTypeDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest("Name is required.");

        var name = dto.Name.Trim();

        var exists = await _context.service_aircon_types
            .AnyAsync(x => x.name.ToUpper() == name.ToUpper());

        if (exists)
            return Conflict("Aircon type already exists.");

        var actype = new service_aircon_type { name = name };

        _context.service_aircon_types.Add(actype);
        await _context.SaveChangesAsync();

        return Ok(actype);
    }

    [HttpGet("dropdown")]
    public async Task<IActionResult> GetACTypeDropdown()
    {
        var acTypes = await _context.service_aircon_types
            .OrderBy(ac => ac.name)
            .Select(ac => new
            {
                id = ac.id,
                name = ac.name
            })
            .ToListAsync();
        return Ok(acTypes);
    }


    /// <summary>
    /// Aircon Types by Category
    //  So user can pick aircon type after category.
    /// </summary>
    /// <returns></returns>

        [HttpGet("aircon-types/{categoryId}")]
    public async Task<IActionResult> GetAirconTypes(int categoryId)
    {
        var data = await _context.services
            .Where(s => s.service_categories_id == categoryId)
            .Select(s => new {
                id = s.service_aircon_type.id,
                name = s.service_aircon_type.name
            })
            .Distinct()
            .OrderBy(x => x.name)
            .ToListAsync();

        return Ok(data);
    }
}