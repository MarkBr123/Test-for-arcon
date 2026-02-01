using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;

[Index("return_number", Name = "supplier_returns_return_number_key", IsUnique = true)]
public partial class supplier_return
{
    [Key]
    public int id { get; set; }

    public int supplier_id { get; set; }

    [StringLength(50)]
    public string return_number { get; set; } = null!;

    public int? related_po_id { get; set; }

    public DateOnly? return_date { get; set; }

    [StringLength(30)]
    public string return_method { get; set; } = null!;

    [StringLength(100)]
    public string? courier_name { get; set; }

    [StringLength(100)]
    public string? tracking_number { get; set; }

    public DateOnly? pickup_date { get; set; }

    public DateOnly? shipped_date { get; set; }

    [Precision(12, 2)]
    public decimal? shipping_cost { get; set; }

    [StringLength(30)]
    public string? status { get; set; }

    public int? total_items { get; set; }

    [Precision(14, 2)]
    public decimal? total_amount { get; set; }

    public string? remarks { get; set; }

    public DateTime? created_at { get; set; }

    public int? created_by { get; set; }

    [ForeignKey("created_by")]
    [InverseProperty("supplier_returns")]
    public virtual admin_user? created_byNavigation { get; set; }

    [ForeignKey("related_po_id")]
    [InverseProperty("supplier_returns")]
    public virtual purchase_order? related_po { get; set; }

    [ForeignKey("supplier_id")]
    [InverseProperty("supplier_returns")]
    public virtual supplier supplier { get; set; } = null!;

    [InverseProperty("supplier_return")]
    public virtual ICollection<supplier_return_item> supplier_return_items { get; set; } = new List<supplier_return_item>();
}
