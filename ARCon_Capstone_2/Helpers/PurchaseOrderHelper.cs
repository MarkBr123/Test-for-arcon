using Microsoft.EntityFrameworkCore;
using ARCon_Capstone_2.Data;


namespace ARCon_Capstone_2.Helpers
{
    public class PurchaseOrderHelper
    {
        public static async Task<string> GeneratePONumberAsync(
        ARCon_Capstone_2_DbContext context)
        {
            var today = DateTime.UtcNow.Date;
            var tomorrow = today.AddDays(1);
            var datePart = today.ToString("MMddyy");

            var countToday = await context.purchase_orders
                .CountAsync(po =>
                    po.created_at >= today &&
                    po.created_at < tomorrow
                );

            return $"PO-{datePart}-{countToday + 1}";
        }
    }
}