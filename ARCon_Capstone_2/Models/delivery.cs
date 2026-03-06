using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;

public partial class delivery
{
    [Key]
    public int id { get; set; }

    [Required]
    public int customer_transaction_id { get; set; }

    [Required]
    [MaxLength(50)]
    public string delivery_ref_code { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? courier { get; set; }  // LALAMOVE, INHOUSE, PICKUP

    [MaxLength(30)]
    public string status { get; set; } = "BOOKED";

    [Column(TypeName = "numeric(8,2)")]
    public decimal? deliverytotalweight { get; set; }

    [MaxLength(100)]
    public string? tracking_number { get; set; }

    public bool? failed_delivery { get; set; }
    public DateTime? failed_at  { get; set;}
    public string? fail_reason { get; set; }
    [MaxLength(50)]
    public string? fail_reason_code { get; set; }

    public DateOnly? scheduled_at { get; set; } // DATE

            public DateTime? delivered_at { get; set; } // TIMESTAMPTZ

            public DateTime created_at { get; set; } = DateTime.UtcNow;

            public DateTime date_cancelled { get; set; }
            
            public string? cancellation_reason { get; set; }
            
            public int delivery_tries { get; set; }

            public DateTime? in_transit_at { get; set; }

            [MaxLength(30)]
            public string schedule_status { get; set; }
 
            // 🔗 Navigation
            
            [ForeignKey("customer_transaction_id")]
            [InverseProperty("deliveries")]
            public virtual customer_transaction? customer_transaction { get; set; }

            [InverseProperty("delivery")]
            public virtual ICollection<delivery_item> delivery_items { get; set; } = new List<delivery_item>();
}

