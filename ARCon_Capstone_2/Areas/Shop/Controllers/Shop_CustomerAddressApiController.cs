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
    public async Task<IActionResult> CreateAddress(
        [FromBody]
    CustomerAddressesDto dto
    )
    {
        /* =========================
           MODEL VALIDATION
        ========================= */

        if (!ModelState.IsValid)
        {
            var errors = ModelState

                .Where(x =>
                    x.Value!.Errors.Count > 0
                )

                .Select(x => new
                {
                    field = x.Key,

                    errors = x.Value.Errors
                        .Select(e =>
                            e.ErrorMessage
                        )
                });

            return BadRequest(new
            {
                message =
                    "Validation failed.",

                errors
            });
        }

        /* =========================
           SESSION CHECK
        ========================= */

        var customerId =
            HttpContext.Session
                .GetInt32("UserId");

        var userType =
            HttpContext.Session
                .GetString("UserType");

        if (
            customerId == null ||
            userType != "CUSTOMER"
        )
        {
            return Unauthorized(new
            {
                message =
                    "Customer is not authenticated."
            });
        }

        await using var trx =
            await _context.Database
                .BeginTransactionAsync();

        try
        {
            /* =========================
               VALIDATE LOCATION IDS
            ========================= */

            bool regionExists =
                await _context.regions
                    .AnyAsync(r =>
                        r.id == dto.RegionId
                    );

            bool provinceExists =
                await _context.provinces
                    .AnyAsync(p =>
                        p.id == dto.ProvinceId
                    );

            bool municipalityExists =
                await _context.municipality
                    .AnyAsync(m =>
                        m.id == dto.MunicipalityId
                    );

            bool barangayExists =
                await _context.barangay
                    .AnyAsync(b =>
                        b.id == dto.BarangayId
                    );

            if (
                !regionExists ||
                !provinceExists ||
                !municipalityExists ||
                !barangayExists
            )
            {
                return BadRequest(new
                {
                    message =
                        "Invalid address hierarchy."
                });
            }

            /* =========================
               REMOVE EXISTING DEFAULT
            ========================= */

            if (dto.IsDefault)
            {
                var existingDefaults =
                    await _context
                        .customer_addresses

                        .Where(a =>

                            a.customer_id ==
                                customerId

                            &&

                            a.is_default

                            &&

                            a.status !=
                                "ARCHIVED"
                        )

                        .ToListAsync();

                foreach (var addr
                    in existingDefaults)
                {
                    addr.is_default =
                        false;
                }

                await _context
                    .SaveChangesAsync();
            }
            /* =========================
               CREATE ADDRESS
            ========================= */

            var address =
                new customer_address
                {
                    customer_id =
                        customerId.Value,

                    house_unit =
                        dto.HouseUnit,

                    street_name =
                        dto.StreetName,

                    barangay_id =
                        dto.BarangayId,

                    municipality_id =
                        dto.MunicipalityId,

                    province_id =
                        dto.ProvinceId,

                    region_id =
                        dto.RegionId,

                    zip_code =
                        dto.ZipCode,

                    landmark =
                        dto.Landmark,

                    is_default =
                        dto.IsDefault,

                    location_long =
                        dto.LocationLong,

                    location_lat =
                        dto.LocationLat,

                    status =
                        "ACTIVE"
                };

            _context.customer_addresses
                .Add(address);

            await _context
                .SaveChangesAsync();

            await trx.CommitAsync();

            return Ok(new
            {
                message =
                    "Address added successfully.",

                address
            });
        }
        catch
        {
            await trx.RollbackAsync();
            throw;
        }
    }
}