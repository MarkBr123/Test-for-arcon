using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;

[Table("manufacturer")]
[Index("brand_name", Name = "manufacturer_brand_name_key", IsUnique = true)]
[Index("manufacturer_name", Name = "manufacturer_manufacturer_name_key", IsUnique = true)]
public partial class manufacturer
{
    public int ID { get; set; }

    [StringLength(100)]
    public string manufacturer_name { get; set; } = null!;

    [StringLength(100)]
    public string brand_name { get; set; } = null!;

    [StringLength(255)]
    public string? manufacturer_logo { get; set; }

    [StringLength(255)]
    public string? official_website { get; set; }

    public DateTime? added_at { get; set; }

    public int? added_by { get; set; }

    public DateTime? updated_at { get; set; }

    public int? updated_by { get; set; }

    [ForeignKey("added_by")]
    [InverseProperty("manufactureradded_byNavigations")]
    public virtual admin_user? added_byNavigation { get; set; }

    [InverseProperty("manufacturer")]
    public virtual ICollection<product> products { get; set; } = new List<product>();

    [ForeignKey("updated_by")]
    [InverseProperty("manufacturerupdated_byNavigations")]
    public virtual admin_user? updated_byNavigation { get; set; }
}
