using System.ComponentModel.DataAnnotations;

namespace ARCon_Capstone_2.DTOs
{
    public class Shop_CreateServiceBookingDto
    {
        public int customer_addresses_id { get; set; }
        public DateOnly? schedule_date { get; set; }
        public TimeSpan? preferred_time { get; set; }

        public string property_type { get; set; }
        public string? customer_note { get; set; }

        public string payment_method { get; set; }
        public string business_name { get; set; }

        public List<Shop_CreateServiceBookingItemDto> sbitems { get; set; } = new();
    }
}