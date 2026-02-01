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

    public int quantity { get; set; }

    [StringLength(50)]
    public string? capacity_range { get; set; }

    [Precision(12, 2)]
    public decimal price { get; set; }

    [Precision(12, 2)]
    public decimal? total_amount { get; set; }

    [ForeignKey("service_bookings_id")]
    [InverseProperty("service_booking_items")]
    public virtual service_booking service_bookings { get; set; } = null!;

    [ForeignKey("services_id")]
    [InverseProperty("service_booking_items")]
    public virtual service services { get; set; } = null!;
}
