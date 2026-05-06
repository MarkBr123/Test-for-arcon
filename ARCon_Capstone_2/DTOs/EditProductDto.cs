namespace ARCon_Capstone_2.DTOs
{
    public class EditProductDto
    {
        public string ProductModel { get; set; }

        public string ProductSeries { get; set; }

        public string PartNumberA { get; set; }

        public string? PartNumberB { get; set; }
        // Pricing
        public decimal OriginalSellingPrice { get; set; }
        public decimal DiscountValue { get; set; }
        public string DiscountType { get; set; }

        // 🔹 OPTIONAL (computed but still allowed input if needed)
        public decimal? DiscountedSellingPrice { get; set; }
        public decimal? ActualSellingPrice { get; set; }

        // Meta
        public string? ArUrl { get; set; }

        // Waranty and weight
        public int ManufacturerWarrantyYears { get; set; }
        public int OutrightReplacementDays { get; set; }

        public decimal GrossWeightA { get; set; }
        public decimal GrossWeightB { get; set; }
        public decimal TotalGrossWeight { get; set; }

        // relations
        public List<TechnologyDto> Technologies { get; set; } = new();
        public List<ProductSpecificationDto> Specifications { get; set; } = new();
        public List<string> Tags { get; set; } = new();
    }
}