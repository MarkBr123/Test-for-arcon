using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;

[Index("order_ref_code", Name = "orders_order_ref_code_key", IsUnique = true)]
public partial class order
{
    [Key]
    public int id { get; set; }

    public int customer_transaction_id { get; set; }

    public DateTime? created_at { get; set; }

    [StringLength(30)]
    public string? status { get; set; }

    [StringLength(255)]
    public string order_ref_code { get; set; } = null!;

    [ForeignKey("customer_transaction_id")]
    [InverseProperty("orders")]
    public virtual customer_transaction customer_transaction { get; set; } = null!;

    [InverseProperty("order")]
    public virtual ICollection<order_item> order_items { get; set; } = new List<order_item>();

    [InverseProperty("order")]
    public virtual ICollection<product_review> product_reviews { get; set; } = new List<product_review>();
}
