using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;

public partial class service_warranty_attachment
{
    [Key]
    public int id { get; set; }

    [Required]
    public long service_warranty_booking_id { get; set; }

    [Required]
    public string file_name { get; set; } = string.Empty;

    [Required]
    public string file_path { get; set; } = string.Empty;

    [Required]
    [StringLength(50)]
    public string file_type { get; set; } = string.Empty;

    public DateTime created_at { get; set; }


    /* =========================
       Relationships
    ========================= */

    [ForeignKey(nameof(service_warranty_booking_id))]
    public virtual service_warranty_booking?
        service_warranty_booking
    { get; set; }

}
