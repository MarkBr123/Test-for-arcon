
using ARCon_Capstone_2.Data;
using ARCon_Capstone_2.DTOs;
using ARCon_Capstone_2.Models;
using ARCon_Capstone_2.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ARCon_Capstone_2.Services;

[AllowAnonymous]
[ApiController]
[Route("api/adminusers")]


public class AdminUsersApiController : ControllerBase
{
    private readonly ARCon_Capstone_2_DbContext _context;
    private readonly IEmailServices _emailService;
    public AdminUsersApiController(
       ARCon_Capstone_2_DbContext context,
       IEmailServices emailService)
    {
        _context = context;
        _emailService = emailService;
    }

    [HttpPost("create")]
    public async Task<IActionResult> Create([FromBody]CreateAdminUserDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        //username already exists
        if (await _context.admin_users
            .AnyAsync(au => au.user_name == dto.UserName))
        {
            return BadRequest("Username already exists.");
        }

        //email already exists
        if (await _context.admin_users
            .AnyAsync(au => au.email_address == dto.EmailAddress))
        {
            return BadRequest("Email address already exists.");
        }
        //contact number already exists
        if (await _context.admin_users
            .AnyAsync(au => au.contact_no == dto.ContactNo))
        {
            return BadRequest("Contact number already exists.");
        }

        const string DEFAULT_ADMIN_PASSWORD = "airconi-admin123";
        var hash = BCrypt.Net.BCrypt.HashPassword(DEFAULT_ADMIN_PASSWORD);



        foreach (var s in dto.Schedule)
        {
            if (!s.IsRestday && (!s.LoginTime.HasValue || !s.LogoutTime.HasValue))
                return BadRequest($"Login and Logout required for {s.DayOfWeek}");

            if (!s.IsRestday && s.LoginTime >= s.LogoutTime)
                return BadRequest($"Login time must be earlier than Logout time for {s.DayOfWeek}");
        }

        var accessId = await GenerateAccessIdAsync();

        var user = new admin_user
        {
            user_name = dto.UserName,
            first_name = dto.FirstName,
            last_name = dto.LastName,
            email_address = dto.EmailAddress,
            contact_no = dto.ContactNo,
            home_address = dto.HomeAddress,
            birthday =  dto.Birthday,
            status = dto.Status,
            password_hash = hash,
            created_at = DateTime.UtcNow,
            created_by = 1,
            airconi_access_id = accessId
        };

        _context.admin_users.Add(user);
        await _context.SaveChangesAsync();

        _context.user_roles.Add(new user_role
        {
            user_id = user.id,
            role_id = dto.RoleId
        });

        foreach (var s in dto.Schedule)
        {
            _context.work_schedules.Add(new work_schedule
            {
                employee_id = user.id,
                day_of_week = s.DayOfWeek.ToUpper(),
                login_time = s.IsRestday ? null : s.LoginTime,
                logout_time = s.IsRestday ? null : s.LogoutTime,
                is_restday = s.IsRestday,
                created_at = DateTime.UtcNow,
            });
        }
        await _context.SaveChangesAsync();

        // TEMPORARY: email later
        //await _emailService.SendAsync(
        //    user.email_address,
        //    "Your Account Is Ready",
        //    $"Username: {user.user_name}\nPassword: {tempPassword}"
        //);
        return Ok();
    }


    [HttpGet]
    public async Task<IActionResult> GetAll(int page = 1, int pageSize = 24, string sortBy = "date", string sortDir = "desc", string? search = null)
    {
        var query = _context.admin_users
            .Where(au => au.status.ToUpper() != "ARCHIVED")
            
            .AsQueryable();

       // SEARCH 
        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.Trim();

            query = query.Where(au =>
                EF.Functions.ILike(au.user_name ?? "", $"%{search}%") ||
                EF.Functions.ILike(au.first_name ?? "", $"%{search}%") ||
                EF.Functions.ILike(au.last_name ?? "", $"%{search}%") ||
                EF.Functions.ILike(au.email_address ?? "", $"%{search}%") ||
                EF.Functions.ILike(au.contact_no ?? "", $"%{search}%")
            );
        }

        bool asc = sortDir.ToLower() == "asc";

        query = sortBy switch
        {
            "user_name" => asc ? query.OrderBy(au => au.user_name) : query.OrderByDescending(au => au.user_name),
            "last_name" => asc ? query.OrderBy(au => au.last_name) : query.OrderByDescending(au => au.last_name),
            "first_name" => asc ? query.OrderBy(au => au.first_name) : query.OrderByDescending(au => au.first_name),
            "status" => asc ? query.OrderBy(au => au.status) : query.OrderByDescending(au => au.status),
            "email" => asc ? query.OrderBy(au => au.email_address) : query.OrderByDescending(au => au.email_address),
            "birthday" => asc ? query.OrderBy(au => au.birthday) : query.OrderByDescending(au => au.birthday),
            "created_at" => asc ? query.OrderBy(au => au.created_at) : query.OrderByDescending(au => au.created_at),
            "updated_at" => asc ? query.OrderBy(au => au.updated_at) : query.OrderByDescending(au => au.updated_at),
            _ => asc ? query.OrderBy(au => au.created_at) : query.OrderByDescending(au => au.created_at),
        };

        var totalCount = await query.CountAsync();
        var items = await query
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .Select(au => new
        { 
            au.id,
            au.user_name,
            au.last_name,
            au.first_name,
            au.contact_no,
            au.status,
            au.email_address,
            au.home_address,
            au.created_at,
            au.airconi_access_id,
            au.updated_at,
            au.birthday,
            au.last_login,

            roles = au.user_roles
                .Select(ur => ur.Role.role_name)
                .ToList()

        })
        .ToListAsync();
        return Ok(new
        {
            items,
            totalCount
        });
    }

    //soft delete (ARCHIVE)
    [HttpDelete("{id}")]
    public async Task<IActionResult> Archive(int id)
    {
        var admin_user = await _context.admin_users.FindAsync(id);
        if (admin_user == null)
            return NotFound();

        admin_user.status = "ARCHIVED";
        admin_user.updated_at = DateTime.UtcNow;

        var affected = await _context.SaveChangesAsync();
        Console.WriteLine($"ROWS AFFECTED: {affected}");

        return Ok(new
        {
            id = admin_user.id,
            status = admin_user.status,
            affected
        });
    }

    //summary of a user account
    [HttpGet("{id}/summary")]
    public async Task<IActionResult> GetSummary(int id)
    {
        var user = await _context.admin_users
            .Where(au => au.id == id)
            .Select(au => new
            {
                au.id,
                au.user_name,
                au.first_name,
                au.last_name,
                au.email_address,
                au.contact_no,
                au.home_address,
                au.status,
                au.birthday,
                au.created_at,
                au.last_login,
                au.airconi_access_id,

                // roles
                roles = au.user_roles
                    .Select(ur => ur.Role.role_name)
                    .ToList(),

                // work schedule
                schedule = _context.work_schedules
                    .Where(ws => ws.employee_id == au.id)
                    .OrderBy(ws => ws.day_of_week)
                    .Select(ws => new
                    {
                        ws.day_of_week,
                        ws.login_time,
                        ws.logout_time,
                        ws.is_restday
                    })
                    .ToList()
            })
            .FirstOrDefaultAsync();

        if (user == null)
            return NotFound();

        return Ok(user);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateAdminUser(
    int id,
    [FromBody] AdminUserUpdateDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var au = await _context.admin_users
            .Include(au => au.user_roles)
            .FirstOrDefaultAsync(au => au.id == id);

        if (au == null)
            return NotFound("Admin user not found");


       //UNIQUE USERNAME (EXCLUDE SELF)

        if (await _context.admin_users.AnyAsync(au =>
            au.user_name == dto.UserName &&
            au.id != id))
        {
            return BadRequest("Username already exists.");
        }


       //UNIQUE EMAIL (EXCLUDE SELF)

        if (await _context.admin_users.AnyAsync(au =>
            au.email_address == dto.EmailAddress &&
            au.id != id))
        {
            return BadRequest("Email address already exists.");
        }

        // =========================
        // 🔥 VALIDATE SCHEDULE AGAINST ACTIVE ASSIGNMENTS
        // =========================
        var activeAssignments = await _context.service_transaction_technicians
            .Where(stt => stt.technician_id == au.id && stt.isactiveservicetransac)
            .Select(stt => stt.service_transaction)
            .ToListAsync();

        foreach (var st in activeAssignments)
        {
            var start = st.actual_scheduled_date
                .ToDateTime(TimeOnly.FromTimeSpan(st.actual_scheduled_time));

            var end = st.estimated_completion_date
                .ToDateTime(TimeOnly.FromTimeSpan(st.estimated_completion_time));

            var day = start.ToString("dddd").ToUpper();

            var newSchedule = dto.Schedule
                .FirstOrDefault(s => s.DayOfWeek.ToUpper() == day);

            // ❌ No schedule for that day
            if (newSchedule == null)
            {
                return BadRequest(
                    $"Schedule conflict: Technician has an assigned service on {day}.");
            }

            // ❌ Rest day conflict
            if (newSchedule.IsRestday)
            {
                return BadRequest(
                    $"Schedule conflict: {day} is set as rest day but technician has an assigned service.");
            }

            // ❌ Time conflict
            if (newSchedule.LoginTime.HasValue && newSchedule.LogoutTime.HasValue)
            {
                var login = newSchedule.LogoutTime.Value;
                var logout = newSchedule.LogoutTime.Value;

                var startTime = start.TimeOfDay;
                var endTime = end.TimeOfDay; ;

                bool isValid;

                if (login <= logout)
                {
                    // Normal shift
                    isValid = startTime >= login && endTime <= logout;
                }
                else
                {
                    // Night shift
                    isValid = startTime >= login || endTime <= logout;
                }

                if (!isValid)
                {
                    return BadRequest(
                        $"Schedule conflict: Existing service on {day} is outside new working hours.");
                }
            }
        }

        au.user_name = dto.UserName;
        au.first_name = dto.FirstName;
        au.last_name = dto.LastName;
        au.email_address = dto.EmailAddress;
        au.contact_no = dto.ContactNo;
        au.home_address = dto.HomeAddress;
        au.birthday = dto.Birthday;
        au.status = dto.Status;
        au.updated_at = DateTime.UtcNow;

        _context.user_roles.RemoveRange(au.user_roles);

        au.user_roles.Add(new user_role
        {
            user_id = au.id,
            role_id = dto.RoleId
        });

        var existingSchedule = await _context.work_schedules
            .Where(ws => ws.employee_id == au.id)
            .ToListAsync();

        _context.work_schedules.RemoveRange(existingSchedule);

        foreach (var s in dto.Schedule)
        {
            _context.work_schedules.Add(new work_schedule
            {
                employee_id = au.id,
                day_of_week = s.DayOfWeek.ToUpper(),
                login_time = s.IsRestday ? null : s.LoginTime,
                logout_time = s.IsRestday ? null : s.LogoutTime,
                is_restday = s.IsRestday
            });
        }

        await _context.SaveChangesAsync();

        return Ok("Admin user updated successfully");
    }


    //airconi accces id generator
    private async Task<string> GenerateAccessIdAsync()
    {
        const string letters =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

        string accessId;

        do
        {
            // 3 RANDOM LETTERS

            var prefix =
                new string(
                    Enumerable.Range(0, 3)
                        .Select(_ =>
                            letters[
                                Random.Shared.Next(
                                    letters.Length
                                )
                            ])
                        .ToArray()
                );

            // 3 RANDOM DIGITS

            var suffix =
                Random.Shared
                    .Next(0, 1000)
                    .ToString("D3");

            accessId =
                $"{prefix}{suffix}";
        }
        while (
            await _context.admin_users
                .AnyAsync(x => x.airconi_access_id == accessId)
        );

        return accessId;
    }

}

