using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;

public partial class checkout
{
    [Key]
    public int id { get; set; }

    public int customer_id { get; set; }

    public int? delivery_address_id { get; set; }

    public int? arcon_store_branches_id { get; set; }

    [Precision(12, 2)]
    public decimal? delivery_cost { get; set; }

    [StringLength(20)]
    public string? payment_method { get; set; }

    [StringLength(50)]
    public string? shipping_method { get; set; }

    public DateTime? created_at { get; set; }

    [StringLength(20)]
    public string? status { get; set; }

    [ForeignKey("arcon_store_branches_id")]
    [InverseProperty("checkouts")]
    public virtual arcon_store_branch? arcon_store_branches { get; set; }

    [InverseProperty("checkout")]
    public virtual ICollection<checkout_item> checkout_items { get; set; } = new List<checkout_item>();

    [ForeignKey("customer_id")]
    [InverseProperty("checkouts")]
    public virtual customer customer { get; set; } = null!;

    [InverseProperty("checkout")]
    public virtual ICollection<customer_transaction> customer_transactions { get; set; } = new List<customer_transaction>();

    [ForeignKey("delivery_address_id")]
    [InverseProperty("checkouts")]
    public virtual customer_address? delivery_address { get; set; }

    [InverseProperty("checkout")]
    public virtual ICollection<payment_transaction> payment_transactions { get; set; } = new List<payment_transaction>();
}
