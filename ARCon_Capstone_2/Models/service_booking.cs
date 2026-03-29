using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;

[Table("service_bookings")]
[Index("booking_ref_code", IsUnique = true)]
public class service_booking
{
    [Key]
    public int id { get; set; }

    public string? booking_ref_code { get; set; }

    public int customer_id { get; set; }

    public string? status { get; set; }

    public int customer_addresses_id { get; set; }

    public string? business_name { get; set; }

    public DateOnly? schedule_date { get; set; }
    public TimeSpan? preferred_time { get; set; }

    public string? customer_note { get; set; }

    public string payment_method { get; set; } = null!;
    public string payment_status { get; set; } = null!;

    public int? payment_transaction_id { get; set; }

    public string? payment_reference { get; set; }

    public DateTime? paid_at { get; set; }

    public string property_type { get; set; }

    public decimal? total_amount { get; set; }

    public DateTime? created_at { get; set; }

    public DateTime? date_confirmed { get; set; }
    public DateTime? date_rejected { get; set; }
    public DateTime? date_cancelled { get; set; }

    public DateTime? updated_at { get; set; }

    public int? failure_count { get; set; }

    public int? partial_complete_count { get; set; }

    /* ✅ RELATIONSHIPS */

    [ForeignKey("customer_id")]
    public virtual customer customer { get; set; } = null!;

    [ForeignKey("customer_addresses_id")]
    public virtual customer_address customer_addresses { get; set; } = null!;

    [ForeignKey("payment_transaction_id")]
    public virtual payment_transaction? payment_transaction { get; set; }

    public virtual ICollection<service_booking_item> service_booking_items { get; set; }
        = new List<service_booking_item>();

    public virtual ICollection<service_review> service_reviews { get; set; }
        = new List<service_review>();

    public virtual ICollection<service_transaction> service_transactions { get; set; }
        = new List<service_transaction>();
}
