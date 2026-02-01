using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;

public partial class purchase_order_article
{
    [Key]
    public int id { get; set; }

    public int purchase_order_id { get; set; }

    public int product_id { get; set; }

    public int qty_ordered { get; set; }

    [Precision(12, 2)]
    public decimal? unit_price { get; set; }

    [Precision(12, 2)]
    public decimal? total_cost { get; set; }

    public DateTime? created_at { get; set; }

    [ForeignKey("product_id")]
    [InverseProperty("purchase_order_articles")]
    public virtual product product { get; set; } = null!;

    [ForeignKey("purchase_order_id")]
    [InverseProperty("purchase_order_articles")]
    public virtual purchase_order purchase_order { get; set; } = null!;
}
