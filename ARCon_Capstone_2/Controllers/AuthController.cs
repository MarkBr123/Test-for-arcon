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
        if (string.IsNullOrWhiteSpace(identifier) || string.IsNullOrWhiteSpace(password))
            return InvalidLogin();

        bool isEmail = identifier.Contains("@");

        //  TRY ADMIN LOGIN

        var adminQuery = _context.admin_users
            .Where(a => a.status == "ACTIVE");

        adminQuery = isEmail
            ? adminQuery.Where(a => a.email_address.ToLower() == identifier.ToLower())
            : adminQuery.Where(a => a.contact_no == identifier);

        var admin = await adminQuery.FirstOrDefaultAsync();

        if (admin != null)
        {
            if (!BCrypt.Net.BCrypt.Verify(password, admin.password_hash))
            {
                await HandleFailedAdminLogin(admin);
                return InvalidLogin();
            }

            // Load allowed roles only
            var roles = await (
                from ur in _context.user_roles
                join r in _context.roles on ur.role_id equals r.id
                where ur.user_id == admin.id
                   && new[] { 4, 5, 6 }.Contains(r.id)
                select r.role_name
            ).ToListAsync();

            if (!roles.Any())
                return Unauthorized("No permitted role assigned.");

            // Reset attempts + update login info
            admin.login_attempts = 0;
            admin.last_login = DateTime.UtcNow;
            admin.is_online = true;
            await _context.SaveChangesAsync();

            // CREATE ADMIN SESSION
            HttpContext.Session.SetInt32("UserId", admin.id);
            HttpContext.Session.SetString("UserType", "ADMIN");
            HttpContext.Session.SetString("Roles", string.Join(",", roles));

            return RedirectToAction(
                "Index",
                "Dashboard",
                new { area = "Admin" }
            );

        }


        // 2 TRY CUSTOMER LOGIN

        var customerQuery = _context.customers.AsQueryable();

        customerQuery = isEmail
            ? customerQuery.Where(c => c.email == identifier)
            : customerQuery.Where(c => c.contact_no == identifier);

        var customer = await customerQuery.FirstOrDefaultAsync();

        if (customer != null)
        {
            if (!BCrypt.Net.BCrypt.Verify(password, customer.password_hash))
                return InvalidLogin();

            customer.last_login = DateTime.UtcNow;
            customer.is_online  = true;
            await _context.SaveChangesAsync();

            // ✅ CREATE CUSTOMER SESSION
            HttpContext.Session.SetInt32("UserId", customer.id);
            HttpContext.Session.SetString("UserType", "CUSTOMER");

            return RedirectToAction("Index", "Home");
        }

        return InvalidLogin();
    }

    // INVALID LOGIN (CENTRALIZED)

    private IActionResult InvalidLogin()
    {
        TempData["Error"] = "Invalid credentials";
        return RedirectToAction("Login", "Home", new { area = "Shop" });
    }

    // ==========================
    // FAILED ADMIN LOGIN HANDLER
    // ==========================
    private async Task HandleFailedAdminLogin(admin_user admin)
    {
        admin.login_attempts++;
        admin.last_failed_login = DateTime.UtcNow;

        if (admin.login_attempts >= 5)
            admin.status = "SUSPEND";

        await _context.SaveChangesAsync();
    }

    // ==========================
    // LOGOUT
    // ==========================
    public IActionResult Logout()
    {
        HttpContext.Session.Clear();
        return RedirectToAction("Login");
    }
    [HttpGet]
    public IActionResult Login()
    {
        return View("~/Areas/Shop/Views/Home/Login.cshtml");
    }

}
