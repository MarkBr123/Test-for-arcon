using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;

public partial class cart_item
{
    [Key]
    public int id { get; set; }

    public int cart_id { get; set; }

    public int product_id { get; set; }

    public int quantity { get; set; }

    public int? std_installation_service_option_id { get; set; }

    public int? additional_installation_service_option_id { get; set; }

    public DateTime? created_at { get; set; }

    public DateTime? updated_at { get; set; }

    [ForeignKey("additional_installation_service_option_id")]
    [InverseProperty("cart_items")]
    public virtual installation_additional_service_option? additional_installation_service_option { get; set; }

    [ForeignKey("cart_id")]
    [InverseProperty("cart_items")]
    public virtual cart cart { get; set; } = null!;

    [ForeignKey("product_id")]
    [InverseProperty("cart_items")]
    public virtual product product { get; set; } = null!;

    [ForeignKey("std_installation_service_option_id")]
    [InverseProperty("cart_items")]
    public virtual installation_std_service_option? std_installation_service_option { get; set; }
}
