using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;

public partial class order_item
{
    [Key]
    public int id { get; set; }

    public int order_id { get; set; }

    public int product_id { get; set; }

    public int qty { get; set; }

    [Precision(12, 2)]
    public decimal? product_price { get; set; }

    [Precision(12, 2)]
    public decimal? std_service_price { get; set; }

    [Precision(12, 2)]
    public decimal? additional_service_price { get; set; }

    [Precision(12, 2)]
    public decimal? total_item_amount { get; set; }

    public int? std_installation_option_id { get; set; }

    public int? additional_installation_option_id { get; set; }

    [ForeignKey("order_id")]
    [InverseProperty("order_items")]
    public virtual order order { get; set; } = null!;

    [ForeignKey("product_id")]
    [InverseProperty("order_items")]
    public virtual product product { get; set; } = null!;
}
