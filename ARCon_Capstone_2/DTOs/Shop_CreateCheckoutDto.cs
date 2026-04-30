namespace ARCon_Capstone_2.DTOs
{
    public class Shop_CreateCheckoutDto
    {
        public string PaymentMethod { get; set; }     
        public string ShippingMethod { get; set; }    
        public int? DeliveryAddressId { get; set; }    
        public string? PaymentMethodId { get; set; }
    }
}

