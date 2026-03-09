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

    [Precision(4, 2)]
    public decimal capacity_min_range { get; set; }

    [Precision(4, 2)]
    public decimal capacity_max_range { get; set; }

    [Precision(12, 2)]
    public decimal price { get; set; }

    public int? sort_order { get; set; }

    public bool is_deleted { get; set; }

    public DateTime? deleted_at { get; set; }

    [StringLength(2)]
    public string? unit { get; set; }

    // 🔗 Belongs to Service
    [ForeignKey(nameof(services_id))]
    [InverseProperty(nameof(service.service_price_tiers))]
    public virtual service services { get; set; } = null!;

    // 🔗 Referenced by many booking items
    [InverseProperty(nameof(service_booking_item.service_price_tier))]
    public virtual ICollection<service_booking_item> service_booking_items { get; set; }
        = new List<service_booking_item>();
}
