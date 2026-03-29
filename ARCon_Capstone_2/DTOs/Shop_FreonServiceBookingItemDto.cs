using System.ComponentModel.DataAnnotations;

namespace ARCon_Capstone_2.DTOs
{
    public class Shop_FreonServiceBookingItemDto
    {
        public int services_id { get; set; }
        public int service_price_tiers_id { get; set; }

        public int unit_count { get; set; }
        public string? unit_brand { get; set; }
        public string? unit { get; set; }
        public string? capacity_range { get; set; }

        public decimal price { get; set; }

        public string? refrigerant_type { get; set; }

        public DateOnly? last_charge_date { get; set; }
    }
}
