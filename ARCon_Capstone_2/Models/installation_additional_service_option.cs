using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;

[Index("option_code", Name = "installation_additional_service_options_option_code_key", IsUnique = true)]
public partial class installation_additional_service_option
{
    [Key]
    public int id { get; set; }

    [StringLength(10)]
    public string? option_code { get; set; }

    public string? description { get; set; }

    [Precision(12, 2)]
    public decimal? price { get; set; }

    public bool? is_default { get; set; }

    public bool? is_active { get; set; }

    public DateTime? created_at { get; set; }

    [InverseProperty("additional_installation_service_option")]
    public virtual ICollection<cart_item> cart_items { get; set; } = new List<cart_item>();

    [InverseProperty("additional_installation_option")]
    public virtual ICollection<checkout_item> checkout_items { get; set; } = new List<checkout_item>();
}
