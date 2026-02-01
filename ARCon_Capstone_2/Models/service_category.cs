using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;

public partial class service_category
{
    [Key]
    public int id { get; set; }

    [StringLength(255)]
    public string service_name { get; set; } = null!;

    public string? description { get; set; }

    [InverseProperty("service_categories")]
    public virtual ICollection<service> services { get; set; } = new List<service>();
}
