namespace ARCon_Capstone_2.DTOs
{
    public class ProductDetailsDto
    {
        public int Id { get; set; }

        public string ProductModel { get; set; }
        public string ProductSeries { get; set; }
        public string Sku { get; set; }

        public string Manufacturer { get; set; }
        public int ManufacturerId { get; set; }

        public string FormFactor { get; set; }
        public int FormFactorId { get; set; }

        public decimal OriginalPrice { get; set; }
        public decimal ActualPrice { get; set; }

        public string Status { get; set; }

        public List<string> Technologies { get; set; } = new();
        public List<TagDto> Tags { get; set; } = new();
        public List<SpecificationValueDto> Specifications { get; set; } = new();
    }
}
