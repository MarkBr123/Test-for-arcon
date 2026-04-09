using CloudinaryDotNet;
using CloudinaryDotNet.Actions;

public class CloudinaryService
{
    private readonly Cloudinary _cloudinary;

    public CloudinaryService(IConfiguration config)
    {
        var section = config.GetSection("Cloudinary");

        var cloudName = section["CloudName"];
        var apiKey = section["ApiKey"];
        var apiSecret = section["ApiSecret"];

        if (string.IsNullOrEmpty(cloudName))
            throw new Exception("Cloudinary config not loaded ❌");

        var account = new Account(cloudName, apiKey, apiSecret);
        _cloudinary = new Cloudinary(account);
    }

    public async Task<string> UploadImageAsync(IFormFile file)
    {
        using var stream = file.OpenReadStream();

        var uploadParams = new ImageUploadParams
        {
            File = new FileDescription(file.FileName, stream),
            Folder = "arcon_uploads"
        };

        var result = await _cloudinary.UploadAsync(uploadParams);

        return result.SecureUrl.ToString();
    }


    public async Task<string> UploadFileAsync(IFormFile file)
    {
        var allowedTypes = new[]
        {
        "image/png",
        "image/jpeg",
        "application/pdf",
        "video/mp4"
    };

        if (!allowedTypes.Contains(file.ContentType))
            throw new Exception("Invalid file type");

        if (file.Length > 15 * 1024 * 1024)
            throw new Exception("File exceeds 15MB");

        using var stream = file.OpenReadStream();

        // 🎥 VIDEO
        if (file.ContentType.StartsWith("video"))
        {
            var videoParams = new VideoUploadParams
            {
                File = new FileDescription(file.FileName, stream),
                Folder = "arcon_uploads",
                UseFilename = true,
                UniqueFilename = true,
                Overwrite = false
            };

            var videoResult = await _cloudinary.UploadAsync(videoParams);

            if (videoResult.Error != null)
                throw new Exception(videoResult.Error.Message);

            return videoResult.SecureUrl.ToString();
        }

        // 📄 PDF (🔥 FIXED — USE IMAGE UPLOAD)
        if (file.ContentType == "application/pdf")
        {
            var pdfParams = new ImageUploadParams
            {
                File = new FileDescription(file.FileName, stream),
                Folder = "arcon_uploads",
                UseFilename = true,
                UniqueFilename = true,
                Overwrite = false
            };

            var pdfResult = await _cloudinary.UploadAsync(pdfParams);

            if (pdfResult.Error != null)
                throw new Exception(pdfResult.Error.Message);

            return pdfResult.SecureUrl.ToString();
        }

        // 🖼 IMAGE
        var imageParams = new ImageUploadParams
        {
            File = new FileDescription(file.FileName, stream),
            Folder = "arcon_uploads",
            UseFilename = true,
            UniqueFilename = true,
            Overwrite = false
        };

        var imageResult = await _cloudinary.UploadAsync(imageParams);

        if (imageResult.Error != null)
            throw new Exception(imageResult.Error.Message);

        return imageResult.SecureUrl.ToString();
    }

}
