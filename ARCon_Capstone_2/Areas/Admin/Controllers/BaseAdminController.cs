using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace ARCon_Capstone_2.Areas.Admin.Controllers
{
    [Area("Admin")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public abstract class BaseAdminController : Controller
    {
        public override void OnActionExecuting(ActionExecutingContext context)
        {
            var httpContext = context.HttpContext;
            var session = httpContext.Session;
            var response = httpContext.Response;

            // 🔥 Prevent browser caching
            response.Headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0";
            response.Headers["Pragma"] = "no-cache";
            response.Headers["Expires"] = "0";

            // 🔐 Get user session
            var userType = session.GetString("UserType");

            // ✅ Allowed roles (internal users)
            var allowedRoles = new[] { "ADMIN", "CSM", "AIRCON_TECHNICIAN" };

            // 🚫 Block access if not logged in or not allowed
            if (string.IsNullOrEmpty(userType) || !allowedRoles.Contains(userType))
            {
                context.Result = new RedirectToActionResult(
                    "Login",
                    "Home",
                    new { area = "Shop" }
                );
                return;
            }

            base.OnActionExecuting(context);
        }
    }
}