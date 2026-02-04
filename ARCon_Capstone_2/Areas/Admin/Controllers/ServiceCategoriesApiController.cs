using ARCon_Capstone_2.Data;
using ARCon_Capstone_2.DTOs;
using ARCon_Capstone_2.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;


[AllowAnonymous]
[ApiController]
[Route("api/service-categories")]


public class ServiceCategoriesApiController : ControllerBase
{
    private readonly ARCon_Capstone_2_DbContext _context;

    public ServiceCategoriesApiController(ARCon_Capstone_2_DbContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateServiceCategoriesDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest("Category name is required.");
        if (string.IsNullOrWhiteSpace(dto.Description))
            return BadRequest("Brief description is required.");

        var name = dto.Name.Trim();
        var desc = dto.Description.Trim();

        var exists = await _context.service_categories
            .AnyAsync(sc => sc.service_name.ToUpper() == name.ToUpper());

        if (exists)
            return Conflict("Aircon type already exists.");

        var cat = new service_category { service_name = name,
            description = desc
        };
        _context.service_categories.Add(cat);
        await _context.SaveChangesAsync();

        return Ok(cat);
    }

    [HttpGet("dropdown")]
    public async Task<IActionResult> GetServiceCategoriesDropdown()
    {
        var servCategories = await _context.service_categories
            .OrderBy(ac => ac.service_name)
            .Select(ac => new
            {
                id = ac.id,
                name = ac.service_name
            })
            .ToListAsync();
        return Ok(servCategories);
    }
}