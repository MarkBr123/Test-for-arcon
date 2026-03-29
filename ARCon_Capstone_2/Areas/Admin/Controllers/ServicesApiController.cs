using ARCon_Capstone_2.Data;
using ARCon_Capstone_2.DTOs;
using ARCon_Capstone_2.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;


[AllowAnonymous]
[ApiController]
[Route("api/services")]
public class ServicesApiController : ControllerBase
{
    private readonly ARCon_Capstone_2_DbContext _context;
    public ServicesApiController(ARCon_Capstone_2_DbContext context)
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
    public async Task<IActionResult> CreateService(CreateServiceDto dto)
    {
        // if someone passes a non-existent ID, Postgres will throw an FK error
        var acExists = await _context.service_aircon_types
        .AnyAsync(x => x.id == dto.ServiceAirconTypeId);

        var catExists = await _context.service_categories
            .AnyAsync(x => x.id == dto.ServiceCategoryId);

        if (!acExists || !catExists)
            return BadRequest("Invalid AC type or service category.");

        if (dto.ServiceAirconTypeId <= 0 || dto.ServiceCategoryId <= 0)
            return BadRequest("Invalid Selection");

        var rows = await _context.Database.ExecuteSqlRawAsync(
            """
                INSERT INTO services (service_aircon_type_id, service_categories_id)
                VALUES ({0}, {1})
                ON CONFLICT (service_aircon_type_id, service_categories_id)
                DO NOTHING;
                """,
                dto.ServiceAirconTypeId,
                dto.ServiceCategoryId
            );
        return Ok( new
        { 
            created = rows > 0
        });
    }
    // this will be the parent row of services
    [HttpGet("services-list")]
            public async Task<IActionResult> GetServices(
            int page = 1,
            int pageSize = 24,
            string sortBy = "airconType",
            string sortDir = "asc",
            string? search = null)
            {
                var query = _context.services
                    .Include(s => s.service_aircon_type)
                    .Include(s => s.service_categories)
                    .AsQueryable();

     
                if (!string.IsNullOrWhiteSpace(search))
                {
                    search = search.Trim().ToLower();

                    query = query.Where(s =>
                    EF.Functions.ILike(s.service_aircon_type.name ?? "", $"%{search}%") ||
                    EF.Functions.ILike(s.service_categories.service_name ?? "", $"%{search}%") 
                    );
                }

                bool asc = sortDir.ToLower() == "asc";

                query = sortBy switch
                {
                    "serviceName" =>  asc ? query.OrderBy(s => s.service_categories.service_name) : query.OrderByDescending(s => s.service_categories.service_name),
                    _ => asc ? query.OrderBy(s => s.service_aircon_type.name) : query.OrderByDescending(s => s.service_aircon_type.name)
                };

                // 📄 PAGINATION
                var totalCount = await query.CountAsync();

                var data = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(s => new
                    {   
                        serviceId =s.id,
                        airconType = s.service_aircon_type.name,
                        serviceName = s.service_categories.service_name
                    })
                    .ToListAsync();

                return Ok(new
                {
                    totalCount,
                    page,
                    pageSize,
                    data
                });
            }

    // this will be the child row of services
    [HttpGet("{serviceId}/price-tiers")]
    public async Task<IActionResult> GetPriceTiers(int serviceId)
    {
        var tiers = await _context.service_price_tiers
            .Where(t => t.services_id == serviceId && !t.is_deleted)
            .OrderBy(t => t.sort_order)
            .ThenBy(t => t.capacity_min_range)
            .Select(t => new
            {
                id = t.id,
                minHp = t.capacity_min_range,
                maxHp = t.capacity_max_range,
                price = t.price
            })
            .ToListAsync();

        return Ok(tiers);
    }

    /// <summary>
    /// Service ID (Category + Aircon Type Combo)
    /// fetch the bridge record.
    /// </summary>

    [HttpGet("by-combo")]
    public async Task<IActionResult> GetServiceByCombo(
    int categoryId, int airconTypeId)
    {
        var service = await _context.services
            .Where(s =>
                s.service_categories_id == categoryId &&
                s.service_aircon_type_id == airconTypeId)
            .Select(s => new {
                id = s.id
            })
            .FirstOrDefaultAsync();

        if (service == null)
            return NotFound("Service not available.");

        return Ok(service);
    }
}