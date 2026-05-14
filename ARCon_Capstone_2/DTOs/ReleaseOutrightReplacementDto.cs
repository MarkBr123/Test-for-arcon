namespace ARCon_Capstone_2.DTOs
{
    public class ReleaseOutrightReplacementDto
    {
        public string? ReleaseMethod { get; set; }

        public string? DeliveryType { get; set; }

        public string? CourierName { get; set; }

        public string? TrackingNumber { get; set; }

        public DateTime? DeliveryDate { get; set; }

        public DateTime? PickupDate { get; set; }
    }
}
