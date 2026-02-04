using ARCon_Capstone_2.Data;
using ARCon_Capstone_2.DTOs;
using ARCon_Capstone_2.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Diagnostics.Contracts;


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
    [HttpPost]
    public async Task<IActionResult> CreatePriceTier(CreateServicePriceTierDto dto)
    {
        // Prevent hp overlaps
        var conflictExists = await _context.service_price_tiers.AnyAsync(t =>
            !t.is_deleted &&
            t.services_id == dto.ServiceId &&
            dto.CapacityMin <= t.capacity_max_range &&
            dto.CapacityMax >= t.capacity_min_range
        );

        if (conflictExists)
        {
            return Conflict("Horsepower range overlaps or touches an existing range.");
        }




        if (dto.ServiceId <= 0)
            return BadRequest("Invalid service.");

        if (dto.CapacityMin >= dto.CapacityMax)
            return BadRequest("Minimum HP cannot be higher than or equal to Maximum  HP");

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

    [HttpPut("edit/{id}")]
    public async Task<IActionResult> EditPriceTier(int id, UpdateServicePriceTierDto dto)
    {
        if (dto.CapacityMin >= dto.CapacityMax)
            return BadRequest("Minimum HP must be less than maximum HP");


        var tier = await _context.service_price_tiers.FirstOrDefaultAsync(t => t.id == id);

        if (tier == null)   
            return NotFound("Price tier not found");

        //ONLY check conflicts if range actually changed
        bool rangeChanged =
            dto.CapacityMin != tier.capacity_min_range ||
            dto.CapacityMax != tier.capacity_max_range;

        if (rangeChanged)
        {
            // 🔒 OVERLAP / DUPLICATE CHECK (exclude current tier)
            var conflictExists = await _context.service_price_tiers.AnyAsync(t =>
                     !t.is_deleted &&
                     t.services_id == tier.services_id &&
                     t.id != id &&
                     dto.CapacityMin <= t.capacity_max_range &&
                     dto.CapacityMax >= t.capacity_min_range
                );

            if (conflictExists)
                    {
                        return Conflict("Horsepower range overlaps or touches an existing range.");
                    }
        }

        // ✅ Update
        tier.capacity_min_range = dto.CapacityMin;
            tier.capacity_max_range = dto.CapacityMax;
            tier.price = dto.Price;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                id = tier.id,
                minHp = tier.capacity_min_range,
                maxHp = tier.capacity_max_range,
                price = tier.price
            });
        }

    //get by id
    [HttpGet("{id}")]
    public async Task<IActionResult> GetPriceTier(int id)
    {
        var tier = await _context.service_price_tiers
            .Where(t => t.id == id)
            .Select(t => new
            {
                id = t.id,
                serviceId = t.services_id,
                capacityMin = t.capacity_min_range,
                capacityMax = t.capacity_max_range,
                price = t.price
            })
            .FirstOrDefaultAsync();

        if (tier == null)
            return NotFound("Price tier not found");

        return Ok(tier);
    }

    //delete
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePriceTier(int id)
    {
        var tier = await _context.service_price_tiers
            .FirstOrDefaultAsync(t => t.id == id && !t.is_deleted);

        if (tier == null)
            return NotFound("Price tier not found");

        tier.is_deleted = true;
        tier.deleted_at = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return NoContent();
    }



}