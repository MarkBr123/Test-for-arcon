using ARCon_Capstone_2.Data;
using ARCon_Capstone_2.DTOs;
using ARCon_Capstone_2.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;


[AllowAnonymous]
[ApiController]
[Route("api/service-price-tiers")]
public class ServicesPriceTiersApiController : ControllerBase
{
    private readonly ARCon_Capstone_2_DbContext _context;
    public ServicesPriceTiersApiController(ARCon_Capstone_2_DbContext context)
    {
        _context = context;
    }
    private static string? Clean(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        return value.Trim();
    }
    [HttpPost("service-price-tiers")]
    public async Task<IActionResult> CreatePriceTier(CreateServicePriceTierDto dto)
    {
        if (dto.ServiceId <= 0)
            return BadRequest("Invalid service.");

        if (dto.CapacityMin >= dto.CapacityMax)
            return BadRequest("Invalid capacity range.");

        var serviceExists = await _context.services
            .AnyAsync(s => s.id == dto.ServiceId);

        if (!serviceExists)
            return BadRequest("Service does not exist.");

        var tier = new service_price_tier
        {
            services_id = dto.ServiceId,
            capacity_min_range = dto.CapacityMin,
            capacity_max_range = dto.CapacityMax,
            price = dto.Price,
            sort_order = dto.SortOrder
        };

        _context.service_price_tiers.Add(tier);
        await _context.SaveChangesAsync();

        return Ok(tier);
    }

}