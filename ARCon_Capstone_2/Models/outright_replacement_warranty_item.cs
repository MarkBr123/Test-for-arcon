using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ARCon_Capstone_2.Models;

public partial class outright_replacement_warranty_item
{
    [Key]
    public int id { get; set; }

    public int outright_replacement_warranty_id { get; set; }

    public int original_delivery_item_id { get; set; }

    public int product_id { get; set; }

    public int original_inventory_id { get; set; }

    public int? replacement_inventory_id { get; set; }

    public string? complaint { get; set; }

    [StringLength(30)]
    public string item_status { get; set; } = "PENDING";

    public bool? is_defective_received { get; set; }

    public DateTime? defective_received_at { get; set; }

    public DateTime? created_at { get; set; }

    public DateTime? updated_at { get; set; }

    [ForeignKey("original_delivery_item_id")]
    [InverseProperty("outright_replacement_warranty_items")]
    public virtual delivery_item original_delivery_item { get; set; } = null!;

    [ForeignKey("original_inventory_id")]
    [InverseProperty("outright_replacement_warranty_itemoriginal_inventories")]
    public virtual inventory original_inventory { get; set; } = null!;

    [ForeignKey("outright_replacement_warranty_id")]
    [InverseProperty("outright_replacement_warranty_items")]
    public virtual outright_replacement_warranty outright_replacement_warranty { get; set; } = null!;

    [ForeignKey("product_id")]
    [InverseProperty("outright_replacement_warranty_items")]
    public virtual product product { get; set; } = null!;

    [ForeignKey("replacement_inventory_id")]
    [InverseProperty("outright_replacement_warranty_itemreplacement_inventories")]
    public virtual inventory? replacement_inventory { get; set; }
}