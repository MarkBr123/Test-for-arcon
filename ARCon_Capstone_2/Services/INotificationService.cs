using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;

namespace ARCon_Capstone_2.Services
{
    public interface INotificationService
    {
        Task SendToCustomerAsync(
            int customerId,
            string title,
            string message,
            string category,
            int? referenceId = null,
            string? referenceType = null);

        Task SendToAdminAsync(
            int adminId,
            string title,
            string message,
            string category,
            int? referenceId = null,
            string? referenceType = null);
    }
}