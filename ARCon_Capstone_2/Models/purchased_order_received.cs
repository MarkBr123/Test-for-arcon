using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;

[Table("purchased_order_received")]
public partial class purchased_order_received
{
    [Key]
    public int id { get; set; }

    public int purchase_order_id { get; set; }

    public DateTime? received_date { get; set; }

    [Precision(14, 2)]
    public decimal? total_received_amount { get; set; }

    public int? received_by { get; set; }

    public DateTime? updated_at { get; set; }

    public DateTime? created_at { get; set; }

    [InverseProperty("purchased_order_received")]
    public virtual ICollection<inventory> inventories { get; set; } = new List<inventory>();

    [ForeignKey("purchase_order_id")]
    [InverseProperty("purchased_order_receiveds")]
    public virtual purchase_order purchase_order { get; set; } = null!;

    [InverseProperty("purchased_order_received")]
    public virtual ICollection<received_article> received_articles { get; set; } = new List<received_article>();

    [ForeignKey("received_by")]
    [InverseProperty("purchased_order_receiveds")]
    public virtual admin_user? received_byNavigation { get; set; }
}
