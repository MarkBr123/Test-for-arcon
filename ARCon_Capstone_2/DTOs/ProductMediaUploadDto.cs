namespace ARCon_Capstone_2.DTOs
{
    public class ProductMediaUploadDto
    {
        public int product_id { get; set; }
        public int? PrimaryIndex { get; set; }
        public List<IFormFile> files { get; set; }
    }
}
