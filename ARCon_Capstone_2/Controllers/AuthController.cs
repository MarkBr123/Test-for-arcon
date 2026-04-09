using ARCon_Capstone_2.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using ARCon_Capstone_2.Data;
using ARCon_Capstone_2.Extensions;

public class AuthController : Controller
{
    private readonly ARCon_Capstone_2_DbContext _context;

    public AuthController(ARCon_Capstone_2_DbContext context)
    {
        _context = context;
    }


    // LOGIN (POST)

    [HttpPost]
    public async Task<IActionResult> Login(string identifier, string password)
    {
        // Basic validation
        if (string.IsNullOrWhiteSpace(identifier) || string.IsNullOrWhiteSpace(password))
            return InvalidLogin();

        bool isEmail = identifier.Contains("@");


        // TRY STAFF LOGIN (ADMIN / CSM / TECHNICIAN)


        var adminQuery = _context.admin_users
            .Where(a => a.status == "ACTIVE");

        adminQuery = isEmail
            ? adminQuery.Where(a => a.email_address.ToLower() == identifier.ToLower())
            : adminQuery.Where(a => a.contact_no == identifier);

        var admin = await adminQuery.FirstOrDefaultAsync();

        if (admin != null)
        {
            // Check password
            if (!BCrypt.Net.BCrypt.Verify(password, admin.password_hash))
            {
                await HandleFailedAdminLogin(admin);
                return InvalidLogin();
            }

            // Load user roles
            var roles = await (
                from ur in _context.user_roles
                join r in _context.roles on ur.role_id equals r.id
                where ur.user_id == admin.id
                   && new[] { "ADMIN", "CSM", "AIRCON_TECHNICIAN" }.Contains(r.role_name) // ADMIN, CSM, AIRCON_TECHNICIAN
                select r.role_name
            ).ToListAsync();

            if (!roles.Any())
                return Unauthorized("No permitted role assigned.");

            // 4. Determine PRIMARY ROLE (priority-based)
            string primaryRole;

            if (roles.Contains("ADMIN"))
                primaryRole = "ADMIN";
            else if (roles.Contains("CSM"))
                primaryRole = "CSM";
            else
                primaryRole = "AIRCON_TECHNICIAN";

            // Update login info
            admin.login_attempts = 0;
            admin.last_login = DateTime.UtcNow;
            admin.is_online = true;

            await _context.SaveChangesAsync();

            // Store session (CRITICAL for chat system)
            HttpContext.Session.SetInt32("UserId", admin.id);
            HttpContext.Session.SetString("UserType", primaryRole); // 🔥 FIXED
            HttpContext.Session.SetString("Roles", string.Join(",", roles));

            // Redirect
            return RedirectToAction(
                "Index",
                "Dashboard",
                new { area = "Admin" }
            );
        }


        // TRY CUSTOMER LOGIN


        var customerQuery = _context.customers.AsQueryable();

        customerQuery = isEmail
            ? customerQuery.Where(c => c.email == identifier)
            : customerQuery.Where(c => c.contact_no == identifier);

        var customer = await customerQuery.FirstOrDefaultAsync();

        if (customer != null)
        {
            if (!BCrypt.Net.BCrypt.Verify(password, customer.password_hash))
                return InvalidLogin();

            //Update login info
            customer.last_login = DateTime.UtcNow;
            customer.is_online = true;

            await _context.SaveChangesAsync();

            //Store session
            HttpContext.Session.SetInt32("UserId", customer.id);
            HttpContext.Session.SetString("UserType", "CUSTOMER");
            HttpContext.Session.SetString("CustomerFirstName", customer.first_name);

            return RedirectToAction("Index", "Home");
        }

        //If both fail
        return InvalidLogin();
    }

    // INVALID LOGIN (CENTRALIZED)

    private IActionResult InvalidLogin()
    {
        TempData["Error"] = "Invalid credentials";
        return RedirectToAction("Login", "Home", new { area = "Shop" });
    }


    // FAILED ADMIN LOGIN HANDLER

    private async Task HandleFailedAdminLogin(admin_user admin)
    {
        admin.login_attempts++;
        admin.last_failed_login = DateTime.UtcNow;

        if (admin.login_attempts >= 5)
            admin.status = "SUSPEND";

        await _context.SaveChangesAsync();
    }


    [HttpGet]
    public async Task<IActionResult> Logout()
    {
        var userId = HttpContext.Session.GetInt32("UserId");
        var userType = HttpContext.Session.GetString("UserType");

        // Only update if CUSTOMER is logged in
        if (userId != null && userType == "CUSTOMER")
        {
            var customer = await _context.customers
                .FirstOrDefaultAsync(c => c.id == userId.Value);

            if (customer != null)
            {
                customer.is_online = false;
                customer.last_login = DateTime.UtcNow; // optional (last activity)

                await _context.SaveChangesAsync();
            }
        }

        HttpContext.Session.Remove("UserId");
        HttpContext.Session.Remove("UserType");
        HttpContext.Session.Clear();

        return RedirectToAction(
            "Login",
            "Home",
            new { area = "Shop" }
        );
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> LogoutPost()
    {
        var userId = HttpContext.Session.GetInt32("UserId");

        if (userId != null)
        {
            var admin = await _context.admin_users.FindAsync(userId);

            if (admin != null)
            {
                admin.is_online = false;
                admin.updated_at = DateTime.UtcNow; // optional but good
            }

            await _context.SaveChangesAsync();
        }

        HttpContext.Session.Clear();

        return RedirectToAction(
            "Login",
            "Home",
            new { area = "Shop" }
        );
    }


    [HttpGet]
    [ResponseCache(NoStore = false, Location = ResponseCacheLocation.Any)]
    public IActionResult Login()
    {
        return View("~/Areas/Shop/Views/Home/Login.cshtml");
    }

}
