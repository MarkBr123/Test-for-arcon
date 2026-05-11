using System.ComponentModel.DataAnnotations;
namespace ARCon_Capstone_2.DTOs
{
    public class ToBeApproveDto
    {


        public string? DiagnosisNotes { get; set; }

        public string? TechnicianNotes { get; set; }
        [Required]
        public bool IsRepeatIssue { get; set; }
        [Required]
        public int NoTechniciansReq { get; set; }
        [Range(1.0, 5.0, ErrorMessage = "Difficulty must be between 1.0 and 5.0")]
        public decimal DifficultyRate { get; set; }

        public string? PartsNeeded { get; set; }

        public string? ToolsNeeded { get; set; }

        [Required]
        public DateOnly ActualSchedDate { get; set; }

        [Required]
        public TimeSpan ActualSchedTime { get; set; }
        [Required]
        public DateOnly EstimatedCompletionDate { get; set; }
        [Required]
        public TimeSpan EstimatedCompletionTime { get; set; }
        [Required]
        [Range(0, double.MaxValue, ErrorMessage = "Fee must be 0 or higher.")]
        public decimal ReserviceFee { get; set; }

        public string? NotesToTechnician { get; set; }
    }
}
