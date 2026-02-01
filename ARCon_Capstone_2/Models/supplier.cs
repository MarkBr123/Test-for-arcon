using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;

[Index("dti_business_number", Name = "suppliers_dti_business_number_key", IsUnique = true)]
[Index("supplier_name", Name = "suppliers_supplier_name_key", IsUnique = true)]
[Index("tin_number", Name = "suppliers_tin_number_key", IsUnique = true)]
public partial class supplier
{
    [Key]
    public int id { get; set; }

    [StringLength(255)]
    public string supplier_name { get; set; } = null!;

    [StringLength(150)]
    public string? proprietor_name { get; set; }

    [StringLength(20)]
    public string? proprieto_contact_no { get; set; }

    [StringLength(50)]
    public string? dti_business_number { get; set; }

    [StringLength(20)]
    public string? tin_number { get; set; }

    [StringLength(255)]
    public string? offical_website { get; set; }

    [StringLength(20)]
    public string? landline_no { get; set; }

    [StringLength(150)]
    public string? supplier_rep { get; set; }

    [StringLength(255)]
    public string? rep_email { get; set; }

    [StringLength(20)]
    public string? rep_contact_no { get; set; }

    [StringLength(100)]
    public string? house_unit { get; set; }

    [StringLength(100)]
    public string? street_name { get; set; }

    [StringLength(100)]
    public string? barangay { get; set; }

    [StringLength(100)]
    public string? city { get; set; }

    [StringLength(100)]
    public string? province { get; set; }

    [StringLength(10)]
    public string? zip_code { get; set; }

    [StringLength(255)]
    public string? landmark { get; set; }

    public int? supplier_logo_media_id { get; set; }

    public string? notes { get; set; }

    [StringLength(10)]
    public string? status { get; set; }

    public DateTime? created_at { get; set; }

    public int? created_by { get; set; }

    public DateTime? updated_at { get; set; }

    [ForeignKey("created_by")]
    [InverseProperty("suppliers")]
    public virtual admin_user? created_byNavigation { get; set; }

    [InverseProperty("supplier")]
    public virtual ICollection<purchase_order> purchase_orders { get; set; } = new List<purchase_order>();

    [ForeignKey("supplier_logo_media_id")]
    [InverseProperty("suppliers")]
    public virtual media_url? supplier_logo_media { get; set; }

    [InverseProperty("supplier")]
    public virtual ICollection<supplier_return> supplier_returns { get; set; } = new List<supplier_return>();
}
