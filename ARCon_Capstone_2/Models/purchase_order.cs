using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;

[Table("purchase_order")]
[Index("po_number", Name = "purchase_order_po_number_key", IsUnique = true)]
public partial class purchase_order
{
    [Key]
    public int id { get; set; }

    public int revision { get; set; }   

    public int supplier_id { get; set; }

    [StringLength(50)]
    public string po_number { get; set; } = null!;

    [StringLength(50)]
    public string? payment_type { get; set; }

    public int? arcon_branch_address { get; set; }

    public DateOnly? expected_delivery { get; set; }

    [Precision(12, 2)]
    public decimal? freight_cost { get; set; }

    [Precision(14, 2)]
    public decimal? total_amount { get; set; }

    public DateTime? created_at { get; set; }

    public int? created_by { get; set; }

    public DateTime? updated_at { get; set; }

    [StringLength(30)]
    public string status { get; set; } = null!;

    [ForeignKey("arcon_branch_address")]
    [InverseProperty("purchase_orders")]
    public virtual arcon_store_branch arcon_store_branch { get; set; } = null!;
    //public virtual arcon_store_branch? arcon_branch_addressNavigation { get; set; }

    [ForeignKey("created_by")]
    [InverseProperty("purchase_orders")]
    public virtual admin_user? created_byNavigation { get; set; }

    [InverseProperty("purchase_order")]
    public virtual ICollection<purchase_order_article> purchase_order_articles { get; set; } = new List<purchase_order_article>();

    [InverseProperty("purchase_order")]
    public virtual ICollection<purchased_order_received> purchased_order_receiveds { get; set; } = new List<purchased_order_received>();

    [ForeignKey("supplier_id")]
    [InverseProperty("purchase_orders")]
    public virtual supplier supplier { get; set; } = null!;

    [InverseProperty("related_po")]
    public virtual ICollection<supplier_return> supplier_returns { get; set; } = new List<supplier_return>();
}
