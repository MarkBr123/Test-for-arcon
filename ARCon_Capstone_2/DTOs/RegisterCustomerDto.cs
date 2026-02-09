using ARCon_Capstone_2.Helpers;
using System.ComponentModel.DataAnnotations;

namespace ARCon_Capstone_2.DTOs;

public class RegisterCustomerDto
{

    [Required]
    [MaxLength(150)]
    public string first_name { get; set; } = null!;

    [Required]
    [MaxLength(150)]
    public string last_name { get; set; } = null!;

    [MaxLength(150)]
    public string? middle_name { get; set; }

    [Required]
    [AgeRange(18, 120)]
    public DateOnly birthday { get; set; }



    [Required]
    [EmailAddress]
    public string email { get; set; } = null!;

    [Required]
    [MaxLength(20)]
    public string contact_no { get; set; } = null!;

    [Required]
    [MinLength(8)]
    [RegularExpression(
        @"^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$",
        ErrorMessage = "Password must contain a letter, number, and symbol."
    )]
    public string password { get; set; } = null!;


    // ───── Address (REQUIRED on signup) ─────
    [Required]
    public CreateCustomerAddressDto address { get; set; } = null!;
}
