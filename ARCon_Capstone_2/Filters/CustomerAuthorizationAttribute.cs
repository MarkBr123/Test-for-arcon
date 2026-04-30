
///CREATE AUTH FILTER
///This avoids repeating checks in every controller

using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc;

namespace ARCon_Capstone_2.Filters
{
    public class CustomerAuthorizationAttribute : ActionFilterAttribute
    {
        public override void OnActionExecuting(ActionExecutingContext context)
        {
            var session = context.HttpContext.Session;

            var userId = session.GetInt32("UserId");
            var userType = session.GetString("UserType");

            if (userId == null || userType != "CUSTOMER")
            {
                context.Result = new RedirectToActionResult(
                    "Login",
                    "Home",
                    new { area = "Shop" }
                );
            }
        }
    }
}
