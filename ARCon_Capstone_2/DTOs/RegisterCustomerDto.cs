using ARCon_Capstone_2.Helpers;
using System.ComponentModel.DataAnnotations;

namespace ARCon_Capstone_2.DTOs;

public class RegisterCustomerDto
{
    [Required(ErrorMessage = "First name is required.")]
    [MaxLength(150, ErrorMessage = "First name cannot exceed 150 characters.")]
    public string first_name { get; set; } = null!;


    [Required(ErrorMessage = "Last name is required.")]
    [MaxLength(150, ErrorMessage = "Last name cannot exceed 150 characters.")]
    public string last_name { get; set; } = null!;


    [MaxLength(150, ErrorMessage = "Middle name cannot exceed 150 characters.")]
    public string? middle_name { get; set; }


    [Required(ErrorMessage = "Birthday is required.")]
    [AgeRange(18, 120)]
    public DateOnly birthday { get; set; }


    [Required(ErrorMessage = "Email is required.")]
    [EmailAddress(ErrorMessage = "Invalid email format.")]
    [MaxLength(255, ErrorMessage = "Email cannot exceed 255 characters.")]
    public string email { get; set; } = null!;


    [Required(ErrorMessage = "Contact number is required.")]
    [MaxLength(20, ErrorMessage = "Contact number cannot exceed 20 characters.")]
    [RegularExpression(
        @"^(09\d{9}|\+639\d{9})$",
        ErrorMessage = "Invalid Philippine contact number format."
    )]
    public string contact_no { get; set; } = null!;


    [Required(ErrorMessage = "Password is required.")]
    [MinLength(8, ErrorMessage = "Password must be at least 8 characters.")]
    [MaxLength(100, ErrorMessage = "Password cannot exceed 100 characters.")]
    [RegularExpression(
        @"^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$",
        ErrorMessage = "Password must contain uppercase, lowercase, number, and symbol."
    )]
    public string password { get; set; } = null!;


    // ───── Address ─────

    [Required(ErrorMessage = "Address information is required.")]
    public CreateCustomerAddressDto address { get; set; } = null!;
}