using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;

[Table("inventory")]
public partial class inventory
{
    [Key]
    public int id { get; set; }

    public int product_id { get; set; }

    [StringLength(150)]
    public string? serial_number { get; set; }

    public int? purchased_order_received_id { get; set; }

    [StringLength(50)]
    public string received_as { get; set; } = null!;

    [StringLength(50)]
    public string status { get; set; } = null!;

    public string? remarks { get; set; }

    public DateTime? created_at { get; set; }

    public int? added_by { get; set; }

    public DateTime? updated_at { get; set; }

    public int? updated_by { get; set; }

    public int? supplier_return_item_id { get; set; }

    [ForeignKey("added_by")]
    [InverseProperty("inventoryadded_byNavigations")]
    public virtual admin_user? added_byNavigation { get; set; }

    [ForeignKey("product_id")]
    [InverseProperty("inventories")]
    public virtual product product { get; set; } = null!;

    [ForeignKey("purchased_order_received_id")]
    [InverseProperty("inventories")]
    public virtual purchased_order_received? purchased_order_received { get; set; }

    [ForeignKey("supplier_return_item_id")]
    [InverseProperty("inventories")]
    public virtual supplier_return_item? supplier_return_item { get; set; }

    [InverseProperty("inventory")]
    public virtual ICollection<supplier_return_item> supplier_return_items { get; set; } = new List<supplier_return_item>();

    [ForeignKey("updated_by")]
    [InverseProperty("inventoryupdated_byNavigations")]
    public virtual admin_user? updated_byNavigation { get; set; }
}
