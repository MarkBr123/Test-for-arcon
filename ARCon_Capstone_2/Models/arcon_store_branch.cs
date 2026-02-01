using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;

[Index("branch_code", Name = "arcon_store_branches_branch_code_key", IsUnique = true)]
public partial class arcon_store_branch
{
    [Key]
    public int id { get; set; }

    [StringLength(50)]
    public string branch_code { get; set; } = null!;

    [StringLength(150)]
    public string? branch_name { get; set; }

    [StringLength(20)]
    public string? contact_number { get; set; }

    [StringLength(255)]
    public string? email { get; set; }

    public int? contact_admin { get; set; }

    public bool? is_main_branch { get; set; }

    public DateTime? created_at { get; set; }

    [Precision(9, 6)]
    public decimal? location_lat { get; set; }

    [Precision(9, 6)]
    public decimal? location_long { get; set; }

    [StringLength(100)]
    public string? address { get; set; }

    [InverseProperty("arcon_store_branches")]
    public virtual ICollection<checkout> checkouts { get; set; } = new List<checkout>();

    [ForeignKey("contact_admin")]
    [InverseProperty("arcon_store_branches")]
    public virtual admin_user? contact_adminNavigation { get; set; }

    [InverseProperty("arcon_store_branch")]
    public virtual ICollection<purchase_order> purchase_orders { get; set; } = new List<purchase_order>();

    //[InverseProperty("arcon_branch_addressNavigation")]
    //public virtual ICollection<purchase_order> purchase_orders { get; set; } = new List<purchase_order>();
}

