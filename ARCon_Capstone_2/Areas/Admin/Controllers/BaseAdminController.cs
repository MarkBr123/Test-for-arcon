using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using ARCon_Capstone_2.Attributes;

namespace ARCon_Capstone_2.Areas.Admin.Controllers
{
    [Area("Admin")]

    [ResponseCache(
        NoStore = true,
        Location = ResponseCacheLocation.None
    )]

    public abstract class BaseAdminController
        : Controller
    {
        public override void OnActionExecuting(
            ActionExecutingContext context)
        {
            var httpContext =
                context.HttpContext;

            var session =
                httpContext.Session;

            var response =
                httpContext.Response;



            // =====================================
            // PREVENT BROWSER CACHE
            // =====================================

            response.Headers["Cache-Control"] =
                "no-store, no-cache, must-revalidate, max-age=0";

            response.Headers["Pragma"] =
                "no-cache";

            response.Headers["Expires"] =
                "0";



            // =====================================
            // CHECK LOGIN
            // =====================================

            var userType =
                session.GetString(
                    "UserType"
                );



            // Not logged in

            if (string.IsNullOrEmpty(userType))
            {
                context.Result =
                    new RedirectToActionResult(
                        "Login",
                        "Home",
                        new { area = "Shop" }
                    );

                return;
            }



            // =====================================
            // OPTIONAL:
            // MAKE ROLE AVAILABLE TO VIEWS
            // =====================================

            ViewBag.UserRole =
                session.GetString(
                    "UserRole"
                );



            ViewBag.AdminName =
                session.GetString(
                    "AdminName"
                );



            base.OnActionExecuting(
                context
            );
        }
    }
}