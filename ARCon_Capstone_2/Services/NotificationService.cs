using ARCon_Capstone_2.Data;
using ARCon_Capstone_2.Models;

namespace ARCon_Capstone_2.Services
{
    public class NotificationService
        : INotificationService
    {
        private readonly ARCon_Capstone_2_DbContext
            _context;

        public NotificationService(
            ARCon_Capstone_2_DbContext context)
        {
            _context = context;
        }



        public async Task SendToCustomerAsync(
            int customerId,
            string title,
            string message,
            string category,
            int? referenceId = null,
            string? referenceType = null)
        {
            var notification =
                new airconi_notification
                {
                    recipient_customer_id =
                        customerId,

                    title =
                        title,

                    message =
                        message,

                    category =
                        category,

                    reference_id =
                        referenceId,

                    reference_type =
                        referenceType,

                    is_read =
                        false,

                    created_at =
                        DateTime.UtcNow
                };

            _context.airconi_notifications
                .Add(notification);

            await _context.SaveChangesAsync();
        }



        public async Task SendToAdminAsync(
            int adminId,
            string title,
            string message,
            string category,
            int? referenceId = null,
            string? referenceType = null)
        {
            var notification =
                new airconi_notification
                {
                    recipient_admin_user_id =
                        adminId,

                    title =
                        title,

                    message =
                        message,

                    category =
                        category,

                    reference_id =
                        referenceId,

                    reference_type =
                        referenceType,

                    is_read =
                        false,

                    created_at =
                        DateTime.UtcNow
                };

            _context.airconi_notifications
                .Add(notification);

            await _context.SaveChangesAsync();
        }
    }
}