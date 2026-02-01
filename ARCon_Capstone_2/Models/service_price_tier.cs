using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;

public partial class service_price_tier
{
    [Key]
    public int id { get; set; }

    public int services_id { get; set; }

    [StringLength(50)]
    public string capacity_range { get; set; } = null!;

    [Precision(12, 2)]
    public decimal price { get; set; }

    public int? sort_order { get; set; }

    [ForeignKey("services_id")]
    [InverseProperty("service_price_tiers")]
    public virtual service services { get; set; } = null!;
}
