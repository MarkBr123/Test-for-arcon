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

[Route("api/shop")]
public class Shop_CustomerAddressApiController : ControllerBase
{
    private readonly ARCon_Capstone_2_DbContext _context;

    public Shop_CustomerAddressApiController(ARCon_Capstone_2_DbContext context)
    {
        _context = context;
    }

    // GET all addresses of logged in customer
    [HttpGet("addresses")]
    public async Task<IActionResult> GetAddresses()
    {
        var customerId = HttpContext.Session.GetInt32("UserId");
        var userType = HttpContext.Session.GetString("UserType");

        if (customerId == null || userType != "CUSTOMER")
            return Unauthorized();

        var addresses = await _context.customer_addresses
            .Where(a =>
                a.customer_id == customerId &&
                a.status == "ACTIVE"
            )
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

    [HttpPut("addresses/{id}/archive")]
    public async Task<IActionResult> ArchiveAddress(int id)
    {
        var customerId =
            HttpContext.Session
                .GetInt32("UserId");

        var userType =
            HttpContext.Session
                .GetString("UserType");

        /* =========================
           SESSION CHECK
        ========================= */

        if (
            customerId == null ||
            userType != "CUSTOMER"
        )
        {
            return Unauthorized();
        }

        /* =========================
           GET ADDRESS
        ========================= */

        var address = await _context
            .customer_addresses

            .FirstOrDefaultAsync(a =>

                a.id == id &&

                a.customer_id == customerId
            );

        if (address == null)
        {
            return NotFound(new
            {
                message =
                    "Address not found."
            });
        }

        /* =========================
           PREVENT LAST ADDRESS
        ========================= */

        var activeAddressCount = await _context
            .customer_addresses

            .CountAsync(a =>

                a.customer_id == customerId &&

                a.status != "ARCHIVED"
            );

        if (activeAddressCount <= 1)
        {
            return BadRequest(new
            {
                message =
                    "You cannot archive your last active address."
            });
        }

        /* =========================
           ARCHIVE ADDRESS
        ========================= */

        address.status = "ARCHIVED";

        address.is_default = false;

        address.archived_at =
            DateTime.UtcNow;

        /* =========================
           ASSIGN NEW DEFAULT
        ========================= */

        var newDefaultAddress = await _context
            .customer_addresses

            .Where(a =>

                a.customer_id == customerId &&

                a.status != "ARCHIVED" &&

                a.id != id
            )

            .OrderByDescending(a =>
                a.created_at
            )

            .FirstOrDefaultAsync();

        if (newDefaultAddress != null)
        {
            newDefaultAddress.is_default = true;
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message =
                "Address archived successfully."
        });
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