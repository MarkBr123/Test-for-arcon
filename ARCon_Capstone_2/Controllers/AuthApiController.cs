


using ARCon_Capstone_2.Data;
using ARCon_Capstone_2.DTOs;
using ARCon_Capstone_2.Models;
using ARCon_Capstone_2.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Controllers;

/// <summary>
/// This is the authenticator when creating a customer data
/// </summary>

[ApiController]
[Route("api/auth")]
public class AuthApiController : ControllerBase
{
    private readonly ARCon_Capstone_2_DbContext _context;
    private readonly IGeocodingService _geocoding;

    public AuthApiController(
        ARCon_Capstone_2_DbContext context,
        IGeocodingService geocoding)
    {
        _context = context;
        _geocoding = geocoding;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterCustomerDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        await using var trx = await _context.Database.BeginTransactionAsync();

        try
        {
            // 🔒 Uniqueness checks
            if (await _context.customers.AnyAsync(c => c.email == dto.email))
            {
                return Conflict(new
                {
                    message = "Email already exists."
                });
            }

            if (await _context.customers.AnyAsync(c => c.contact_no == dto.contact_no))
            {
                return Conflict(new
                {
                    message = "Contact number already exists."
                });
            }

            // 🔐 Hash password
            var hashedPassword = BCrypt.Net.BCrypt.HashPassword(dto.password);

            // 👤 Create customer (NO created_at here)
            var customer = new customer
            {
                first_name = dto.first_name,
                last_name = dto.last_name,
                middle_name = dto.middle_name,
                birthday = dto.birthday,
                email = dto.email,
                contact_no = dto.contact_no,
                password_hash = hashedPassword
            };

            _context.customers.Add(customer);
            await _context.SaveChangesAsync();

            // 📍 Build full address string from DB (trusted source)
            var barangay = await _context.barangay.FindAsync(dto.address.barangay_id);
            var municipality = await _context.municipality.FindAsync(dto.address.municipality_id);
            var province = await _context.provinces.FindAsync(dto.address.province_id);

            var fullAddress =
                $"{dto.address.street_name}, " +
                $"{barangay.barangay_name}, " +
                $"{municipality.municipality_name}, {province.province_name}, Philippines";


            decimal? lat = null;
            decimal? lon = null;

            // 🌍 Geocoding (non-blocking)
            try
            {
                (lat, lon) = await _geocoding.GetCoordinatesAsync(fullAddress);
                Console.WriteLine("GEOCODING ADDRESS:");
                Console.WriteLine(fullAddress);
            }
            catch
            {
                // Intentionally ignored
                // Address will still be saved, coordinates can be filled later
            }

            // 🏠 Save address
            var address = new customer_address
            {
                customer_id = customer.id,
                region_id = dto.address.region_id,
                province_id = dto.address.province_id,
                municipality_id = dto.address.municipality_id,
                barangay_id = dto.address.barangay_id,

                house_unit = dto.address.house_unit,
                street_name = dto.address.street_name,
                zip_code = dto.address.zip_code,
                landmark = dto.address.landmark,

                location_lat = lat,
                location_long = lon,

                is_default = true
                // created_at handled by PostgreSQL
            };

            _context.customer_addresses.Add(address);
            await _context.SaveChangesAsync();

            await trx.CommitAsync();

            return Ok(new
            {
                message = "Account created successfully"
            });
        }
        catch
        {
            await trx.RollbackAsync();
            throw;
        }
    }
}

