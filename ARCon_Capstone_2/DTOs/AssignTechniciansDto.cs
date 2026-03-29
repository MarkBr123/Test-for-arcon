using System.ComponentModel.DataAnnotations;

public class AssignTechniciansDto
{
    [Required]
    [MinLength(1, ErrorMessage = "At least one technician is required.")]
    public List<int> TechnicianIds { get; set; } = new();
}