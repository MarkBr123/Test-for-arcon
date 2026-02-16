namespace ARCon_Capstone_2.DTOs
{
    public class Shop_GetProductCardDto
    {
        public int Id { get; set; }
        public string BrandName { get; set; }
        public string ProductSeries { get; set; }
        public string ProductModel { get; set; }
        public decimal? ActualSellingPrice { get; set; }
        public bool InStock { get; set; }
        public int AvailableStock { get; set; }
        public string HorsePower { get; set; }
        public string? PrimaryImageUrl { get; set; }
    }
}
