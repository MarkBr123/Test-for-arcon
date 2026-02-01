using System.Security.Cryptography;

namespace ARCon_Capstone_2.Helpers
{
    public class PasswordHelper
    {
        public static string GenerateTemporaryPassword(int length = 10)
        {
            var bytes = RandomNumberGenerator.GetBytes(length);
            return Convert.ToBase64String(bytes)
                .Replace("+", "")
                .Replace("/", "")
                .Substring(0, length);
        }
    }
}
