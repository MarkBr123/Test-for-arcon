namespace ARCon_Capstone_2.DTOs
{
    public class UploadChatFileDto
        {
            public int ConversationId { get; set; }
            public IFormFile File { get; set; }
        }
}
