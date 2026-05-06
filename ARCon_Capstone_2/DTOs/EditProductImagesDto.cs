public class EditProductImagesDto
{
    // existing images to KEEP
    public List<int> ExistingMediaIds { get; set; }
        = new();

    // selected primary
    public int? PrimaryMediaId { get; set; }

    // new uploads
    public List<IFormFile> NewFiles { get; set; }
        = new();
}