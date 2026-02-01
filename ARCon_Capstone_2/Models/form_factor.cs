using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;

[Index("form_factor1", Name = "form_factors_form_factor_key", IsUnique = true)]
public partial class form_factor
{
    [Key]
    public int id { get; set; }

    [Column("form_factor")]
    [StringLength(50)]
    public string form_factor1 { get; set; } = null!;

    public string? form_factor_description { get; set; }

    public DateTime? created_at { get; set; }

    public int? created_by { get; set; }

    public DateTime? updated_at { get; set; }

    public int? updated_by { get; set; }

    [ForeignKey("created_by")]
    [InverseProperty("form_factorcreated_byNavigations")]
    public virtual admin_user? created_byNavigation { get; set; }

    [InverseProperty("form_factor")]
    public virtual ICollection<product> products { get; set; } = new List<product>();

    [ForeignKey("updated_by")]
    [InverseProperty("form_factorupdated_byNavigations")]
    public virtual admin_user? updated_byNavigation { get; set; }
}
