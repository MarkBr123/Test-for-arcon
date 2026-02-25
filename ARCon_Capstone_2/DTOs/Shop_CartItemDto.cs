namespace ARCon_Capstone_2.DTOs
{
    public class Shop_CartItemDto
    {
        public int CartItemId { get; set; }

        public int ProductId { get; set; }

        public string BrandName { get; set; } = string.Empty;

        public string? ProductSeries { get; set; }

        public string ProductModel { get; set; } = string.Empty;

        public string Sku { get; set; } = string.Empty;

        public decimal? ProductPrice { get; set; }

        public int? Quantity { get; set; }

        public bool IsSelected { get; set; }

        // Installation
        public string? StdDescription { get; set; }
        public decimal? StdPrice { get; set; }

        public string? AddDescription { get; set; }
        public decimal? AddPrice { get; set; }

        // Computed
        public decimal? UnitTotal { get; set; }
        public decimal? Subtotal { get; set; }





    }
}