using System.ComponentModel.DataAnnotations;

namespace ARCon_Capstone_2.DTOs
{
    public class RejectOutrightReplacementDto
    {
        [Required]
        public string RejectionReason { get; set; }

        public string? AdminNotes { get; set; }
    }
}
