namespace ARCon_Capstone_2.DTOs
{
    public class CreateCustomerRatingDto
    {
        public int transactionId { get; set; }
        public int productId { get; set; }
        public int? deliveryItemId { get; set; }

        public int rating { get; set; }
        public string comment { get; set; }
    }
}
