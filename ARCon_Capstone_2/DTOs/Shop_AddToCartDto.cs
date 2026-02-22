namespace ARCon_Capstone_2.DTOs
{
    public class Shop_AddToCartDto
    {
        public int ProductId {  get; set; }
        public int Quantity { get; set; } = 1;
        public int? StdInstallationServiceOptionId { get; set; }
        public int? AdditionalInstallationServiceOptionId { get; set; }
    }
}
