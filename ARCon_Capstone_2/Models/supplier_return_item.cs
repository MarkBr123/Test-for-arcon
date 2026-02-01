using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;

public partial class supplier_return_item
{
    [Key]
    public int id { get; set; }

    public int supplier_return_id { get; set; }

    public int product_id { get; set; }

    public int? inventory_id { get; set; }

    [StringLength(150)]
    public string? serial_number { get; set; }

    [Precision(12, 2)]
    public decimal? unit_cost { get; set; }

    [Precision(12, 2)]
    public decimal? total_cost { get; set; }

    [StringLength(255)]
    public string? return_reason { get; set; }

    public string? condition_notes { get; set; }

    [InverseProperty("supplier_return_item")]
    public virtual ICollection<inventory> inventories { get; set; } = new List<inventory>();

    [ForeignKey("inventory_id")]
    [InverseProperty("supplier_return_items")]
    public virtual inventory? inventory { get; set; }

    [ForeignKey("product_id")]
    [InverseProperty("supplier_return_items")]
    public virtual product product { get; set; } = null!;

    [ForeignKey("supplier_return_id")]
    [InverseProperty("supplier_return_items")]
    public virtual supplier_return supplier_return { get; set; } = null!;

    [InverseProperty("supplier_return_item")]
    public virtual ICollection<supplier_return_item_medium> supplier_return_item_media { get; set; } = new List<supplier_return_item_medium>();
}
