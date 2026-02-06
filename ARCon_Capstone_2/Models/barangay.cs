using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ARCon_Capstone_2.Models;

public class barangay
{
    [Key]
    public int id { get; set; }

    [Required]
    public string barangay_name { get; set; } = null!;

    // ✅ FK column MUST exist
    public int municipality_id { get; set; }

    // ✅ Navigation
    [ForeignKey(nameof(municipality_id))]
    [InverseProperty(nameof(municipality.barangays))]
    public virtual municipality municipality { get; set; } = null!;

    public ICollection<customer_address> customer_addresses { get; set; }
    = new List<customer_address>();


}

