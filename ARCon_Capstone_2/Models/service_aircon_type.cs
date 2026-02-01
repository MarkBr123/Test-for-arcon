using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;

[Table("service_aircon_type")]
[Index("name", Name = "service_aircon_type_name_key", IsUnique = true)]
public partial class service_aircon_type
{
    [Key]
    public int id { get; set; }

    [StringLength(100)]
    public string name { get; set; } = null!;

    [InverseProperty("service_aircon_type")]
    public virtual ICollection<service> services { get; set; } = new List<service>();
}
