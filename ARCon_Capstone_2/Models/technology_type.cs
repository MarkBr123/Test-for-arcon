using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;

[Index("technology_name", Name = "technology_types_technology_name_key", IsUnique = true)]
public partial class technology_type
{
    [Key]
    public int id { get; set; }

    [StringLength(50)]
    public string technology_name { get; set; } = null!;

    public string? technology_desc { get; set; }

    public DateTime? created_at { get; set; }

    public int? created_by { get; set; }

    public DateTime? updated_at { get; set; }

    public int? updated_by { get; set; }

    [ForeignKey("created_by")]
    [InverseProperty("technology_typecreated_byNavigations")]
    public virtual admin_user? created_byNavigation { get; set; }

    [InverseProperty("technology")]
    public virtual ICollection<product_technology> product_technologies { get; set; } = new List<product_technology>();

    [ForeignKey("updated_by")]
    [InverseProperty("technology_typeupdated_byNavigations")]
    public virtual admin_user? updated_byNavigation { get; set; }
}
