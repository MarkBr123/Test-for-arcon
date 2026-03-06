namespace ARCon_Capstone_2.DTOs
{
    public class DeliverySelectionDto
    {
        public int CheckoutItemId { get; set; }

        public List<int> InventoryIds { get; set; }
            = new List<int>();
    }
}