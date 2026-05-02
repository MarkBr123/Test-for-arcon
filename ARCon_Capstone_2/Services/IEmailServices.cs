using System.Net;
using System.Net.Mail;

/*
namespace ARCon_Capstone_2.Services
{
    public interface IEmailServices
    {
        Task SendAsync(string to, string subject, string body);
    }
}


*/

using System.Threading.Tasks;

namespace ARCon_Capstone_2.Services
{
    public interface IEmailServices
    {
        Task SendAsync(string to, string subject, string body);
    }
}