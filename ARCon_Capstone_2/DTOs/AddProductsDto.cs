namespace ARCon_Capstone_2.DTOs
{
    public class AddProductsDto
    {
        public int ManufacturerId { get; set; }

        public string ProductModel { get; set; }

        public string ProductSeries {  get; set; }
        public string Sku { get; set; }
        public string PartNumberA { get; set; }
        public string? PartNumberB { get; set; }
        public int FormFactorID { get; set; }

        
        public decimal OriginalSellingPrice { get; set; }

        public decimal? DiscountedSellingPrice { get; set; }
        public decimal DiscountValue { get; set; }

        public string DiscountType { get; set; }

        public decimal? ActualSellingPrice { get; set; }

        public string? ArUrl { get; set; }
       

        public int ManufacturerWarrantyYears { get; set; }

        public int OutrightReplacementDays { get; set; }

        public decimal GrossWeightA { get; set; }
        public decimal GrossWeightB { get; set; }

        public decimal TotalGrossWeight {  get; set; }

        public int ReorderLevel {get; set;}



        public List<TechnologyDto> Technologies { get; set; } = new();
        public List<ProductSpecificationDto> Specifications { get; set; } = new();
        public List<string> Tags { get; set; } = new();
    }
}
