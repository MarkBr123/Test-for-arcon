

using ARCon_Capstone_2.Extensions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace ARCon_Capstone_2.Areas.Admin.Controllers
{
    [Area("Admin")]
    public abstract class BaseAdminController : Controller
    {
        public override void OnActionExecuting(ActionExecutingContext context)
        {
            var session = context.HttpContext.Session;

            if (session.GetString("UserType") != "ADMIN")
            {
                context.Result = new RedirectToActionResult(
                    "Login",
                    "Home",
                    new { area = "Shop" }
                );
            }

            base.OnActionExecuting(context);
        }
    }
}