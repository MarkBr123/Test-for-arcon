using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

 namespace ARCon_Capstone_2.Models;

public class delivery_item
{

    [Key]
    public int id { get; set; }

    [Required]
    public int delivery_id { get; set; }

    [Required]
    public int checkout_item_id { get; set; }

    [Required]
    public int inventory_id { get; set; }

    public DateTime created_at { get; set; } = DateTime.UtcNow;

    // 🔗 Navigation

    [ForeignKey("delivery_id")]
    [InverseProperty("delivery_items")]
    public virtual delivery? delivery { get; set; }

    [ForeignKey("checkout_item_id")]
    [InverseProperty("delivery_items")]
    public virtual checkout_item? checkout_item { get; set; }

    [ForeignKey("inventory_id")]
    [InverseProperty("delivery_item")]  // must match property name in inventory
    public virtual inventory? inventory { get; set; }
}
