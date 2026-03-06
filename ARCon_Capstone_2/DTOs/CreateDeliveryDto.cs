namespace ARCon_Capstone_2.DTOs
{
    public class CreateDeliveryDto
    {
        public int TransactionId { get; set; }

        public string Courier { get; set; }

        public DateOnly ScheduledDate { get; set; }

        public string? TrackingNumber { get; set; }

        public List<DeliverySelectionDto> SelectedInventory { get; set; }
            = new List<DeliverySelectionDto>();
    }
}