using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace ARCon_Capstone_2.Attributes
{
    public class RoleAuthorizeAttribute : ActionFilterAttribute
    {
        private readonly string[] _roles;

        public RoleAuthorizeAttribute(params string[] roles)
        {
            _roles = roles;
        }

        public override void OnActionExecuting(ActionExecutingContext context)
        {
            var role = context.HttpContext
                .Session
                .GetString("UserRole");

            // NOT LOGGED IN
            if (string.IsNullOrEmpty(role))
            {
                context.Result = new RedirectToActionResult(
                    "Login",
                    "Home",
                    new { area = "Shop" }
                );

                return;
            }

            // ACCESS DENIED
            if (!_roles.Contains(role))
            {
                context.Result = new ContentResult
                {
                    Content = "Access Denied: You do not have permission to perform this action or access this resource.",
                    StatusCode = 403
                };

                return;
            }

            base.OnActionExecuting(context);
        }
    }
}