namespace ARCon_Capstone_2.DTOs
{
    public class ProductUpdateDto
    {

        public string Part_Number_A {  get; set; }
        public string Part_Number_B { get; set; }
        public string Status { get; set; }
        public decimal Original_Selling_Price { get; set; }
        public decimal? Discounted_Selling_Price { get; set; }
        public string Discount_Type { get; set; }
        public decimal Discount_Value { get; set; } 
        public bool IsDiscounted { get; set; }
        public bool Has_Installation_Service { get; set; }
        public decimal Actual_Selling_Price { get; set; }
        public string Ar_url { get; set; }
        public int? Manufacturer_Warranty_Years { get; set; }
        public int? Outright_Replacement_Days { get; set; }
        public decimal? Gross_Weight_A { get; set; }
        public decimal? Gross_Weight_B { get; set; }

        public int ReorderLevel { get; set; }

    }
}
