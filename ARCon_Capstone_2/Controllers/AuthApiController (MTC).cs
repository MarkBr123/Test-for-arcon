


using ARCon_Capstone_2.Data;
using ARCon_Capstone_2.DTOs;
using ARCon_Capstone_2.Models;
using ARCon_Capstone_2.Services;
using Microsoft.AspNetCore.Authorization;
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
        {
            var errors = ModelState
                .Where(x => x.Value!.Errors.Count > 0)
                .Select(x => new
                {
                    field = x.Key,
                    errors = x.Value.Errors
                        .Select(e => e.ErrorMessage)
                });

            return BadRequest(new
            {
                message = "Validation failed.",
                errors
            });
        }

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


    /// GEt Specific User Profile
    /// 
    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        try
        {
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

            /* =========================
               GET CUSTOMER
            ========================= */

            var customer = await _context
                .customers

                .Where(c =>
                    c.id == customerId
                )

                .Select(c => new
                {
                    id = c.id,

                    first_name = c.first_name,

                    last_name = c.last_name,

                    middle_name = c.middle_name,

                    birthday = c.birthday,

                    email = c.email,

                    contact_no = c.contact_no,

                    created_at = c.created_at
                })

                .FirstOrDefaultAsync();

            if (customer == null)
            {
                return NotFound(new
                {
                    message =
                        "Customer not found."
                });
            }

            return Ok(customer);
        }
        catch
        {
            throw;
        }
    }


    /// Change Password
    /// 
    [Authorize]
    [HttpPut("change-password")]
    public async Task<IActionResult> ChangePassword(
    [FromBody] ChangePasswordDto dto
)
    {
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

        try
        {
            /* 
               SESSION CHECK
                               */

            var customerIdClaim =
                User.FindFirst("CustomerId")
                    ?.Value;

            if (
                string.IsNullOrWhiteSpace(
                    customerIdClaim
                )
            )
            {
                return Unauthorized(new
                {
                    message =
                        "Customer is not authenticated."
                });
            }

            int customerId =
                int.Parse(customerIdClaim);

            /* 
               GET CUSTOMER
                            */

            var customer =
                await _context.customers
                    .FirstOrDefaultAsync(c =>

                        c.id == customerId
                    );

            if (customer == null)
            {
                return NotFound(new
                {
                    message =
                        "Customer not found."
                });
            }

            /* 
               VERIFY CURRENT PASSWORD   */

            bool isPasswordCorrect =

                BCrypt.Net.BCrypt.Verify(

                    dto.current_password,

                    customer.password_hash
                );

            if (!isPasswordCorrect)
            {
                return BadRequest(new
                {
                    message =
                        "Current password is incorrect."
                });
            }

            /* 
                PREVENT SAME PASSWORD   */

            bool samePassword =

                BCrypt.Net.BCrypt.Verify(

                    dto.new_password,

                    customer.password_hash
                );

            if (samePassword)
            {
                return BadRequest(new
                {
                    message =
                        "New password must be different from current password."
                });
            }

            /* 
               HASH NEW PASSWORD  */

            customer.password_hash =

                BCrypt.Net.BCrypt.HashPassword(
                    dto.new_password
                );

            customer.updated_at =
                DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Password updated successfully."
            });
        }
        catch
        {
            throw;
        }
    }








    /// <summary>
    /// Update Contact
    /// </summary>
    /// <param name="dto"></param>
    /// <returns></returns>

    [HttpPut("profile/contact")]
    public async Task<IActionResult> UpdateContactInfo(
        [FromBody]
    UpdateCustomerContactDto dto
    )
    {
        /* 
            VALIDATION    */

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

        /* 
              SESSION CHECK      */

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
            /* 
                   GET CUSTOMER       */

            var customer = await _context
                .customers

                .FirstOrDefaultAsync(c =>

                    c.id == customerId
                );

            if (customer == null)
            {
                return NotFound(new
                {
                    message =
                        "Customer not found."
                });
            }

            /* 
                EMAIL UNIQUENESS    */

            bool emailExists = await _context
                .customers

                .AnyAsync(c =>

                    c.email == dto.email &&

                    c.id != customerId
                );

            if (emailExists)
            {
                return Conflict(new
                {
                    message =
                        "Email already exists."
                });
            }

            /* 
               CONTACT UNIQUENESS   */

            bool contactExists = await _context
                .customers

                .AnyAsync(c =>

                    c.contact_no == dto.contact_no &&

                    c.id != customerId
                );

            if (contactExists)
            {
                return Conflict(new
                {
                    message =
                        "Contact number already exists."
                });
            }

            /* 
               UPDATE   */

            customer.email =
                dto.email;

            customer.contact_no =
                dto.contact_no;

            customer.updated_at =
                DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await trx.CommitAsync();

            return Ok(new
            {
                message =
                    "Contact information updated successfully."
            });
        }
        catch (Exception ex)
        {
            await trx.RollbackAsync();
            var fullError =
                ex.InnerException?.Message ??
                ex.Message;

            Console.WriteLine(
                "========== FULL ERROR =========="
            );

            Console.WriteLine(
                ex.ToString()
            );

            Console.WriteLine(
                "================================"
            );

            return StatusCode(500, new
            {
                message =
                    fullError,

                error =
                    ex.Message
            });
        }
    }






}

