using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;

public partial class payment_transaction
{
    [Key]
    public int id { get; set; }

    public int checkout_id { get; set; }

    [StringLength(20)]
    public string payment_method { get; set; } = null!;

    [StringLength(255)]
    public string? paymongo_source_id { get; set; }

    [StringLength(255)]
    public string? paymongo_payment_id { get; set; }

    [StringLength(50)]
    public string? paymongo_status { get; set; }

    public DateTime? paid_at { get; set; }

    [StringLength(20)]
    public string? cod_status { get; set; }

    [Precision(12, 2)]
    public decimal amount { get; set; }

    public DateTime? created_at { get; set; }

    [ForeignKey("checkout_id")]
    [InverseProperty("payment_transactions")]
    public virtual checkout checkout { get; set; } = null!;

    [InverseProperty("payment_transaction")]
    public virtual ICollection<customer_transaction> customer_transactions { get; set; } = new List<customer_transaction>();

    [InverseProperty("payment_transaction")]
    public virtual ICollection<service_booking> service_bookings { get; set; } = new List<service_booking>();
}
