namespace ARCon_Capstone_2.DTOs
{
    public class CreateSupplierReturnDto
    {
        public int SupplierId { get; set; }

        public string ReturnMethod { get; set; }

        public string? CourierName { get; set; }

        public string? TrackingNumber { get; set; }

        public DateOnly? PickupDate { get; set; }

        public DateOnly? ShippedDate { get; set; }

        public decimal ShippingCost { get; set; }

        public string? Remarks { get; set; }

        public string? ReturnReason { get; set; }

        public string? ConditionNotes { get; set; }

        public List<CreateSupplierReturnItemDto>
            Items
        { get; set; } = new();
    }
}
