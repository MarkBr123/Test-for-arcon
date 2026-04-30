using ARCon_Capstone_2.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using ARCon_Capstone_2.Data;
using ARCon_Capstone_2.Extensions;
using System.Net.Mail;
using System.Net;

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


            ///OTP Insertion for admin users
            var otp = GenerateOtp();

            // delete old OTP
            var oldOtp = _context.auth_otps
                .Where(x => x.user_id == admin.id && x.user_type == primaryRole);

            _context.auth_otps.RemoveRange(oldOtp);

            // insert new OTP
            _context.auth_otps.Add(new auth_otp
            {
                user_id = admin.id,
                user_type = primaryRole,
                otp_code = otp,
                expires_at = DateTime.UtcNow.AddMinutes(5),
                attempt_count = 0
            });

            await _context.SaveChangesAsync();

            // send email
            await SendOtpEmail(admin.email_address, otp);

            // temp session
            HttpContext.Session.SetInt32("OtpUserId", admin.id);
            HttpContext.Session.SetString("OtpUserType", primaryRole);
            HttpContext.Session.SetString("OtpRoles", string.Join(",", roles));

            return RedirectToAction("VerifyOtp", "Home", new { area = "Shop" });
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


            //OTP insertion for customers
            var otp = GenerateOtp();

            // delete old OTP
            var oldOtp = _context.auth_otps
                .Where(x => x.user_id == customer.id && x.user_type == "CUSTOMER");

            _context.auth_otps.RemoveRange(oldOtp);

            // insert OTP
            _context.auth_otps.Add(new auth_otp
            {
                user_id = customer.id,
                user_type = "CUSTOMER",
                otp_code = otp,
                expires_at = DateTime.UtcNow.AddMinutes(5),
                attempt_count = 0
            });

            await _context.SaveChangesAsync();

            // send email
            await SendOtpEmail(customer.email, otp);

            // temp session
            HttpContext.Session.SetInt32("OtpUserId", customer.id);
            HttpContext.Session.SetString("OtpUserType", "CUSTOMER");

            return RedirectToAction("VerifyOtp", "Home", new { area = "Shop" });
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




    [HttpPost]
    public async Task<IActionResult> VerifyOtp(string code)
    {
        var userId = HttpContext.Session.GetInt32("OtpUserId");
        var userType = HttpContext.Session.GetString("OtpUserType");

        if (userId == null || userType == null)
            return RedirectToAction("Login");

        var otpRecord = await _context.auth_otps
            .Where(x => x.user_id == userId && x.user_type == userType)
            .OrderByDescending(x => x.created_at)
            .FirstOrDefaultAsync();

        if (otpRecord == null)
        {
            TempData["Error"] = "Too many attempts. Try again later.";
            return RedirectToAction("VerifyOtp", "Home", new { area = "Shop" }); 
        }

        // 🔒 LOCK
        if (otpRecord.locked_until != null &&
            otpRecord.locked_until > DateTime.UtcNow)
        {
            TempData["Error"] = "Too many attempts. Try again later.";
            return RedirectToAction("VerifyOtp", "Home", new { area = "Shop" }); 
        }

        // EXPIRY
        if (otpRecord.expires_at < DateTime.UtcNow)
        {
            _context.auth_otps.Remove(otpRecord);
            await _context.SaveChangesAsync();

            TempData["Error"] = "OTP expired. Please login again.";
            return RedirectToAction("Login");
        }

        // WRONG OTP
        if (otpRecord.otp_code != code)
        {
            otpRecord.attempt_count++;

            if (otpRecord.attempt_count >= 3)
            {
                otpRecord.locked_until = DateTime.UtcNow.AddMinutes(3);
                otpRecord.attempt_count = 0;
            }

            await _context.SaveChangesAsync();

            TempData["Error"] = "Invalid OTP";
            return RedirectToAction("VerifyOtp", "Home", new { area = "Shop" }); 
        }

        // SUCCESS
        _context.auth_otps.Remove(otpRecord);
        await _context.SaveChangesAsync();

        HttpContext.Session.Remove("OtpUserId");
        HttpContext.Session.Remove("OtpUserType");

        HttpContext.Session.SetInt32("UserId", userId.Value);
        HttpContext.Session.SetString("UserType", userType);


        if (userType == "CUSTOMER")
        {
            var customer = await _context.customers.FindAsync(userId.Value);

            HttpContext.Session.SetString("CustomerFirstName", customer.first_name);

            return RedirectToAction("Index", "Home");
        }

        if (userType != "CUSTOMER")
        {
            var roles = HttpContext.Session.GetString("OtpRoles");
            HttpContext.Session.SetString("Roles", roles ?? "");
            return RedirectToAction("Index", "Dashboard", new { area = "Admin" });
        }

        return RedirectToAction("Index", "Home");
    }




    /// <summary>
    /// OPT Generator
    /// </summary>
    /// <returns></returns>
    private string GenerateOtp()
    {
        return new Random().Next(100000, 999999).ToString();
    }




    /// <summary>
    /// Send OTP thru email
    /// </summary>
    /// <param name="email"></param>
    /// <param name="otp"></param>
    /// <returns></returns>
    public async Task SendOtpEmail(string email, string otp)
    {
        var message = new MailMessage();

        message.From = new MailAddress("marvincayobit@gmail.com"); // 🔥 REQUIRED
        message.To.Add(email);
        message.Subject = "Your OTP Code";
        message.Body = $"Your OTP is: {otp}";

        using var smtp = new SmtpClient("smtp.gmail.com", 587)
        {
            Credentials = new NetworkCredential("marvincayobit@gmail.com", "uiovnfytnmjfpnxo"),
            EnableSsl = true
        };

        await smtp.SendMailAsync(message);
    }

}
