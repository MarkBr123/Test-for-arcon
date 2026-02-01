using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;

public partial class customer_transaction
{
    [Key]
    public int id { get; set; }

    public int checkout_id { get; set; }

    public int? payment_transaction_id { get; set; }

    public int customer_id { get; set; }

    [Precision(12, 2)]
    public decimal? delivery_cost { get; set; }

    [Precision(12, 2)]
    public decimal? total_item_cost { get; set; }

    [Precision(12, 2)]
    public decimal? grand_total { get; set; }

    [StringLength(20)]
    public string? payment_method { get; set; }

    [StringLength(50)]
    public string? shipping_method { get; set; }

    public DateTime? created_at { get; set; }

    [StringLength(30)]
    public string? status { get; set; }

    [ForeignKey("checkout_id")]
    [InverseProperty("customer_transactions")]
    public virtual checkout checkout { get; set; } = null!;

    [ForeignKey("customer_id")]
    [InverseProperty("customer_transactions")]
    public virtual customer customer { get; set; } = null!;

    [InverseProperty("customer_transaction")]
    public virtual ICollection<order> orders { get; set; } = new List<order>();

    [ForeignKey("payment_transaction_id")]
    [InverseProperty("customer_transactions")]
    public virtual payment_transaction? payment_transaction { get; set; }
}
