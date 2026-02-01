using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;

public partial class customer_address
{
    [Key]
    public int id { get; set; }

    public int customer_id { get; set; }

    [StringLength(100)]
    public string? house_unit { get; set; }

    [StringLength(100)]
    public string? street_name { get; set; }

    [StringLength(100)]
    public string? barangay { get; set; }

    [StringLength(100)]
    public string? city { get; set; }

    [StringLength(100)]
    public string? province { get; set; }

    [StringLength(10)]
    public string? zip_code { get; set; }

    [StringLength(255)]
    public string? landmark { get; set; }

    public bool? is_default { get; set; }

    [Column(TypeName = "timestamp without time zone")]
    public DateTime? created_at { get; set; }

    public DateTime? updated_at { get; set; }

    [StringLength(15)]
    public string? address_label { get; set; }

    [StringLength(255)]
    public string? receiver_name { get; set; }

    public string? additional_notes { get; set; }

    [Precision(9, 6)]
    public decimal? location_long { get; set; }

    [Precision(9, 6)]
    public decimal? location_lat { get; set; }

    [InverseProperty("delivery_address")]
    public virtual ICollection<checkout> checkouts { get; set; } = new List<checkout>();

    [ForeignKey("customer_id")]
    [InverseProperty("customer_addresses")]
    public virtual customer customer { get; set; } = null!;

    [InverseProperty("customer_addresses")]
    public virtual ICollection<service_booking> service_bookings { get; set; } = new List<service_booking>();
}
