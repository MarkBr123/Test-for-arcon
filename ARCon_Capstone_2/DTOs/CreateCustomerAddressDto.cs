using System.ComponentModel.DataAnnotations;

namespace ARCon_Capstone_2.DTOs;

public class CreateCustomerAddressDto
{
    // Location hierarchy
    [Required]
    public int region_id { get; set; }

    [Required]
    public int province_id { get; set; }

    [Required]
    public int municipality_id { get; set; }

    [Required]
    public int barangay_id { get; set; }

    // Address details
    [MaxLength(100)]
    public string? house_unit { get; set; }

    [MaxLength(100)]
    public string? street_name { get; set; }

    [MaxLength(10)]
    public string? zip_code { get; set; }

    [MaxLength(255)]
    public string? landmark { get; set; }
}
