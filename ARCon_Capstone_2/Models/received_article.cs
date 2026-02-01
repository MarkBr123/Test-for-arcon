using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;

public partial class received_article
{
    [Key]
    public int id { get; set; }

    public int purchased_order_received_id { get; set; }

    public int product_id { get; set; }

    public int qty_received { get; set; }

    [Precision(12, 2)]
    public decimal unit_price { get; set; }

    [Precision(12, 2)]
    public decimal? total_cost { get; set; }

    public DateTime? created_at { get; set; }

    [ForeignKey("product_id")]
    [InverseProperty("received_articles")]
    public virtual product product { get; set; } = null!;

    [ForeignKey("purchased_order_received_id")]
    [InverseProperty("received_articles")]
    public virtual purchased_order_received purchased_order_received { get; set; } = null!;
}
