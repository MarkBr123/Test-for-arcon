using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;

public partial class service_booking_item
{
    [Key]
    public int id { get; set; }

    public int service_bookings_id { get; set; }

    public int services_id { get; set; }

    // ✅ Missing FK (important)
    public int service_price_tier_id { get; set; }

    public int unit_count { get; set; }

    [StringLength(50)]
    public string? capacity_range { get; set; }

    [Precision(12, 2)]
    public decimal price { get; set; }

    [Precision(12, 2)]
    public decimal? total_amount { get; set; }

    [StringLength(15)]
    public string unit_brand { get; set; }
    [StringLength(2)]
    public string unit { get; set; }

    // 🔗 Booking
    [ForeignKey(nameof(service_bookings_id))]
    [InverseProperty(nameof(service_booking.service_booking_items))]
    public virtual service_booking service_bookings { get; set; } = null!;

    // 🔗 Service
    [ForeignKey(nameof(services_id))]
    [InverseProperty(nameof(service.service_booking_items))]
    public virtual service services { get; set; } = null!;

    // 🔗 Price Tier
    [ForeignKey(nameof(service_price_tier_id))]
    [InverseProperty(nameof(service_price_tier.service_booking_items))]
    public virtual service_price_tier service_price_tier { get; set; } = null!;
}
