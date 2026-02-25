using ARCon_Capstone_2.Data;
using ARCon_Capstone_2.DTOs;
using ARCon_Capstone_2.Models;
using ARCon_Capstone_2.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ARCon_Capstone_2.Services;
using Microsoft.AspNetCore.Http;

namespace ARCon_Capstone_2.Areas.Shop.Controllers;

[Route("api/shop/addresses")]
public class Shop_CustomerAddressApiController : ControllerBase
{
    private readonly ARCon_Capstone_2_DbContext _context;

    public Shop_CustomerAddressApiController(ARCon_Capstone_2_DbContext context)
    {
        _context = context;
    }

    // GET all addresses of logged in customer
    [HttpGet]
    public async Task<IActionResult> GetAddresses()
    {
        var customerId = HttpContext.Session.GetInt32("UserId");
        var userType = HttpContext.Session.GetString("UserType");

        if (customerId == null || userType != "CUSTOMER")
            return Unauthorized();

        var addresses = await _context.customer_addresses
            .Where(a => a.customer_id == customerId)
            .Select(a => new
            {
                a.id,
                a.house_unit,
                a.street_name,
                Barangay = a.barangay.barangay_name,
                Municipality = a.municipality.municipality_name,
                Province = a.province.province_name,
                Region = a.region.region_name,
                a.zip_code,
                a.landmark,
                a.is_default
            })
            .ToListAsync();

        return Ok(addresses);
    }

    // POST create new address
    [HttpPost]
    public async Task<IActionResult> CreateAddress(CustomerAddressesDto dto)
    {
        var customerId = HttpContext.Session.GetInt32("UserId");
        var userType = HttpContext.Session.GetString("UserType");

        if (customerId == null || userType != "CUSTOMER")
            return Unauthorized();

        // If new address is default → remove old default
        if (dto.IsDefault)
        {
            var existingDefaults = await _context.customer_addresses
                .Where(a => a.customer_id == customerId && a.is_default)
                .ToListAsync();

            foreach (var addr in existingDefaults)
                addr.is_default = false;
        }

        var address = new customer_address
        {
            customer_id = customerId.Value,
            house_unit = dto.HouseUnit,
            street_name = dto.StreetName,
            barangay_id = dto.BarangayId,
            municipality_id = dto.MunicipalityId,
            province_id = dto.ProvinceId,
            region_id = dto.RegionId,
            zip_code = dto.ZipCode,
            landmark = dto.Landmark,
            is_default = dto.IsDefault,
            location_long = dto.LocationLong,
            location_lat = dto.LocationLat
        };

        _context.customer_addresses.Add(address);
        await _context.SaveChangesAsync();

        return Ok(address);
    }
}