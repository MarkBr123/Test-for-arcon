namespace ARCon_Capstone_2.DTOs
{
    public class Shop_CreateCheckoutDto
    {
        public string PaymentMethod { get; set; }      // COD or PAYMONGO
        public string ShippingMethod { get; set; }     // Pickup, In-house, Lalamove
        public int? DeliveryAddressId { get; set; }    // Required if not Pickup

    }
}

