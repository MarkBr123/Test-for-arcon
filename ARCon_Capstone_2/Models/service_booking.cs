using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;

[Index("booking_ref_code", Name = "service_bookings_booking_ref_code_key", IsUnique = true)]
public partial class service_booking
{
    [Key]
    public int id { get; set; }

    [StringLength(255)]
    public string? booking_ref_code { get; set; }

    public int customer_id { get; set; }

    [StringLength(50)]
    public string? status { get; set; }

    public int customer_addresses_id { get; set; }

    [Column(TypeName = "timestamp without time zone")]
    public DateTime schedule_date { get; set; }

    public string? customer_note { get; set; }

    [StringLength(50)]
    public string payment_method { get; set; } = null!;

    [StringLength(50)]
    public string payment_status { get; set; } = null!;

    [StringLength(255)]
    public string? payment_reference { get; set; }

    [Column(TypeName = "timestamp without time zone")]
    public DateTime? paid_at { get; set; }

    [Precision(12, 2)]
    public decimal? total_amount { get; set; }

    [Column(TypeName = "timestamp without time zone")]
    public DateTime? created_at { get; set; }

    [Column(TypeName = "timestamp without time zone")]
    public DateTime? approx_completion_date { get; set; }

    [ForeignKey("customer_id")]
    [InverseProperty("service_bookings")]
    public virtual customer customer { get; set; } = null!;

    [ForeignKey("customer_addresses_id")]
    [InverseProperty("service_bookings")]
    public virtual customer_address customer_addresses { get; set; } = null!;

    [InverseProperty("service_bookings")]
    public virtual ICollection<service_booking_item> service_booking_items { get; set; } = new List<service_booking_item>();

    [InverseProperty("booking")]
    public virtual ICollection<service_booking_technician> service_booking_technicians { get; set; } = new List<service_booking_technician>();

    [InverseProperty("service_booking")]
    public virtual ICollection<service_review> service_reviews { get; set; } = new List<service_review>();
}
