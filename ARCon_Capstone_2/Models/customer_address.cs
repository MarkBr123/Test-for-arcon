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


    //barangay
    // -------------------------
    public int barangay_id { get; set; }

    [ForeignKey(nameof(barangay_id))]
    [InverseProperty(nameof(barangay.customer_addresses))]
    public virtual barangay barangay { get; set; } = null!;

    //municipality
    public int municipality_id { get; set; }

    [ForeignKey(nameof(municipality_id))]
    [InverseProperty(nameof(municipality.customer_addresses))]
    public virtual municipality municipality { get; set; } = null!;

    //province
    public int province_id { get; set; }

    [ForeignKey(nameof(province_id))]
    [InverseProperty(nameof(province.customer_addresses))]
    public virtual province province { get; set; } = null!;
    //region
    public int region_id { get; set; }

    [ForeignKey(nameof(region_id))]
    [InverseProperty(nameof(region.customer_addresses))]
    public virtual region region { get; set; } = null!;

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
