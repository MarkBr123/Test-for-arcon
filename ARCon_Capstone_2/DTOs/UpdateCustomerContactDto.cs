using System.ComponentModel.DataAnnotations;

namespace ARCon_Capstone_2.DTOs;

public class UpdateCustomerContactDto
{
    [Required(ErrorMessage =
        "Email is required.")]
    [EmailAddress(ErrorMessage =
        "Invalid email format.")]
    [MaxLength(255,
        ErrorMessage =
        "Email cannot exceed 255 characters.")]
    public string email { get; set; } = null!;

    [Required(ErrorMessage =
        "Contact number is required.")]
    [MaxLength(20,
        ErrorMessage =
        "Contact number cannot exceed 20 characters.")]
    [RegularExpression(
        @"^(09\d{9}|\+639\d{9})$",
        ErrorMessage =
        "Invalid Philippine contact number format."
    )]
    public string contact_no { get; set; } = null!;
}