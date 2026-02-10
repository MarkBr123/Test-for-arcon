using Microsoft.AspNetCore.Http;
using System.Linq;

namespace ARCon_Capstone_2.Extensions
{
    public static class SessionExtensions
    {
        public static bool HasRole(this ISession session, string role)
        {
            var roles = session.GetString("Roles");
            if (string.IsNullOrWhiteSpace(roles)) return false;

            return roles
                .Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Any(r => r.Equals(role, StringComparison.OrdinalIgnoreCase));
        }
    }
}
