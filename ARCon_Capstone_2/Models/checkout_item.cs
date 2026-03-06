using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;

public partial class checkout_item
{
    [Key]
    public int id { get; set; }

    public int checkout_id { get; set; }

    public int product_id { get; set; }

    public int qty { get; set; }

    [Precision(12, 2)]
    public decimal? product_price { get; set; }
    [Precision(12, 2)]
    public decimal? std_installation_price { get; set; }
    [Precision(12, 2)]
    public decimal? additional_installation_price { get; set; }

    [Precision(12, 2)]
    public decimal? total_item_amount { get; set; }

    public int? std_installation_option_id { get; set; }

    public int? additional_installation_option_id { get; set; }

    [ForeignKey("additional_installation_option_id")]
    [InverseProperty("checkout_items")]
    public virtual installation_additional_service_option? additional_installation_option { get; set; }

    [ForeignKey("checkout_id")]
    [InverseProperty("checkout_items")]
    public virtual checkout checkout { get; set; } = null!;

    [ForeignKey("product_id")]
    [InverseProperty("checkout_items")]
    public virtual product product { get; set; } = null!;

    [ForeignKey("std_installation_option_id")]
    [InverseProperty("checkout_items")]
    public virtual installation_std_service_option? std_installation_option { get; set; }

    [InverseProperty("checkout_item")]
    public virtual ICollection<delivery_item> delivery_items { get; set; } = new List<delivery_item>();
}
