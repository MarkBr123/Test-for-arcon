using System.ComponentModel.DataAnnotations;

namespace ARCon_Capstone_2.DTOs
{
    public class AddServiceRatingDto
    {
        [Required]
        [Range(1, 5)]
        public int rating { get; set; }

        [StringLength(255)]
        public string? comment { get; set; }
    }
}
