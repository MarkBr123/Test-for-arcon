using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;
[Table("service_transaction")]
public class service_transaction
{
    [Key]
    public int id { get; set; }

    [Required]
    public int service_booking_id { get; set; }

    [Required]
    public string st_ref_code { get; set; }

    [Required]
    public int no_technicians_req { get; set; }

    public DateTime created_at { get; set; }

    public decimal? difficulty_rate { get; set; }

    public string? parts_needed { get; set; }

    public string? tools_need { get; set; }

    public DateOnly actual_scheduled_date { get; set; }

    public TimeSpan actual_scheduled_time { get; set; }

    public DateOnly estimated_completion_date { get; set; }
    public TimeSpan estimated_completion_time { get; set; }

    public DateOnly? date_completed { get; set; }
    public TimeOnly? time_completed { get; set; }

    public decimal? service_rating { get; set; }

    public bool? iscustomeragreed { get; set; }

    public string? status { get; set; }

    public decimal? reservice_fee { get; set; }

    public string? notes_to_technicians { get; set; }

    public DateTime? date_cancelled { get; set; }
    public string? cancellation_reason { get; set; }

    public int? service_tries { get; set; }

    public bool failed { get; set; }

    public string? fail_reason { get; set; }

    public DateTime? failed_at { get; set; }

    public bool? ispartiallycompleted { get; set; }
    public string? partially_completed_reason { get; set; }
    public DateTime? partially_at { get; set; }

    public bool? isrebooked { get; set; }
    public string? rebooking_reason { get; set; }
    public DateTime? rebooked_at { get; set; }

    public int? actual_assigned_technicians { get; set; }

    public DateTime? updated_at { get; set; }
    public DateTime? started_at { get; set; }

    /* ✅ RELATIONSHIPS */

    [ForeignKey("service_booking_id")]
    public virtual service_booking? service_booking { get; set; }

    public virtual ICollection<service_transaction_item> service_transaction_items { get; set; }
        = new List<service_transaction_item>();

    public virtual ICollection<service_transaction_technician> service_transaction_technicians { get; set; }
        = new List<service_transaction_technician>();
}

