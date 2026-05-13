using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ARCon_Capstone_2.Models;

public partial class outright_replacement_warranty_attachment
{
    [Key]
    public int id { get; set; }

    public int outright_replacement_warranty_id { get; set; }

    public string? file_name { get; set; }

    public string? file_path { get; set; }

    [StringLength(50)]
    public string? file_type { get; set; }

    public DateTime? created_at { get; set; }

    [ForeignKey("outright_replacement_warranty_id")]
    [InverseProperty("outright_replacement_warranty_attachments")]
    public virtual outright_replacement_warranty outright_replacement_warranty { get; set; } = null!;
}