using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;

public partial class airconi_notification
{
    [Key]
    public int id { get; set; }

    public int? sender_customer_id { get; set; }

    public int? sender_admin_user_id { get; set; }

    public int? recipient_customer_id { get; set; }

    public int? recipient_admin_user_id { get; set; }

    [StringLength(255)]
    public string title { get; set; } = null!;

    public string message { get; set; } = null!;

    [StringLength(50)]
    public string category { get; set; } = null!;

    public int? reference_id { get; set; }

    [StringLength(50)]
    public string? reference_type { get; set; }

    public bool? is_read { get; set; }

    public DateTime? created_at { get; set; }

    public int? created_by { get; set; }


    // CUSTOMER RELATIONSHIPS

    [ForeignKey("sender_customer_id")]
    [InverseProperty("sent_notifications_customer")]
    public virtual customer? sender_customer { get; set; }

    [ForeignKey("recipient_customer_id")]
    [InverseProperty("received_notifications_customer")]
    public virtual customer? recipient_customer { get; set; }


    // ADMIN RELATIONSHIPS


    [ForeignKey("sender_admin_user_id")]
    [InverseProperty("sent_notifications_admin")]
    public virtual admin_user? sender_admin_user { get; set; }

    [ForeignKey("recipient_admin_user_id")]
    [InverseProperty("received_notifications_admin")]
    public virtual admin_user? recipient_admin_user { get; set; }

    [ForeignKey("created_by")]
    [InverseProperty("created_notifications_admin")]
    public virtual admin_user? created_by_admin { get; set; }
}