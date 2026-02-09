using System.Security.Cryptography;
using BCrypt.Net;

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

        public static string Hash(string password)
        => BCrypt.Net.BCrypt.HashPassword(password);

        public static bool Verify(string password, string hash)
            => BCrypt.Net.BCrypt.Verify(password, hash);
    }
}
