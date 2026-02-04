namespace ARCon_Capstone_2.DTOs
{
    public class CreateServicePriceTierDto
    {
        public int ServiceId { get; set; }
        public decimal CapacityMin { get; set; }
        public decimal CapacityMax { get; set; }
        public decimal Price { get; set; }
        public int SortOrder { get; set; } = 1;
    }
}
