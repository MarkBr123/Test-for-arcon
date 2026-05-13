namespace ARCon_Capstone_2.DTOs
{
    public class CreateOutrightReplacementDto
    {
        public string? customer_notes { get; set; }

        public List<CreateOutrightReplacementItemDto> items { get; set; }
            = new();

        public List<IFormFile>? attachments { get; set; }
    }

    public class CreateOutrightReplacementItemDto
    {
        public int delivery_item_id { get; set; }

        public int original_inventory_id { get; set; }

        public int product_id { get; set; }

        public string? issue_description { get; set; }
    }
}