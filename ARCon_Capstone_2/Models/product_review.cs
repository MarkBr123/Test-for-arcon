using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;

public partial class product_review
{
    [Key]
    public int id { get; set; }

    public int product_id { get; set; }

    public int customer_id { get; set; }

    public int order_id { get; set; }

    public int rating { get; set; }

    [StringLength(255)]
    public string? review_title { get; set; }

    public string? review_text { get; set; }

    public bool? is_verified_purchase { get; set; }

    [StringLength(20)]
    public string? status { get; set; }

    public DateTime? created_at { get; set; }

    public DateTime? updated_at { get; set; }

    [ForeignKey("customer_id")]
    [InverseProperty("product_reviews")]
    public virtual customer customer { get; set; } = null!;

    [ForeignKey("order_id")]
    [InverseProperty("product_reviews")]
    public virtual order order { get; set; } = null!;

    [ForeignKey("product_id")]
    [InverseProperty("product_reviews")]
    public virtual product product { get; set; } = null!;
}
