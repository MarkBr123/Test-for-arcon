using System.ComponentModel.DataAnnotations;

namespace ARCon_Capstone_2.DTOs;

public class ChangePasswordDto
{
    [Required(ErrorMessage =
        "Current password is required.")]
    public string current_password { get; set; } = null!;

    [Required(ErrorMessage =
        "New password is required.")]
    [MinLength(8,
        ErrorMessage =
        "Password must be at least 8 characters.")]
    [MaxLength(100,
        ErrorMessage =
        "Password cannot exceed 100 characters.")]
    [RegularExpression(
        @"^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$",
        ErrorMessage =
        "Password must contain uppercase, lowercase, number, and symbol."
    )]
    public string new_password { get; set; } = null!;

    [Required(ErrorMessage =
        "Confirm password is required.")]
    [Compare(nameof(new_password),
        ErrorMessage =
        "Passwords do not match.")]
    public string confirm_password { get; set; } = null!;
}