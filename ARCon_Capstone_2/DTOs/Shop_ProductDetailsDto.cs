namespace ARCon_Capstone_2.DTOs
{
    public class Shop_ProductDetailsDto
    {
        // --- BASIC INFO

        public int ProductId { get; set; }
        public string Sku { get; set; }
        public string ProductModel { get; set; }
        public string ProductSeries { get; set; }
        public string PartNumberA { get; set; }
        public string PartNumberB { get; set; }

        public string FormFactor { get; set; }
        public string BrandName { get; set; }

        public string Status { get; set; }

        public decimal? OriginalSellingPrice { get; set; }
        public decimal? DiscountedSellingPrice { get; set; }

        public string DiscountType { get; set; }
        public decimal? DiscountValue { get; set; }

        public decimal? ActualSellingPrice { get; set; }

        public string ArUrl { get; set; }

        public int? ManufacturerWarrantyYears { get; set; }
        public int? OutrightReplacementDays { get; set; }

        public decimal? GrossWeightA { get; set; }
        public decimal? GrossWeightB { get; set; }
        public decimal? TotalGrossWeight { get; set; }

        public int? ReorderLevel { get; set; }

        // --- STOCK
        public int AvailableStock { get; set; }
        public bool InStock { get; set; }

        // --- IMAGES
        public List<string> Images { get; set; }

        // --- RELATED DATA
        public List<Shop_SpecificationDto> Specifications { get; set; }
        public List<string> Tags { get; set; }
        public List<Shop_TechnologyDto> Technologies { get; set; }

    }
}
