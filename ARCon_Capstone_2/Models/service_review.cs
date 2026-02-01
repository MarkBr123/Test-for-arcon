using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;

public partial class service_review
{
    [Key]
    public int id { get; set; }

    public int service_booking_id { get; set; }

    public int customer_id { get; set; }

    public int rating { get; set; }

    public string? review_text { get; set; }

    public DateTime? created_at { get; set; }

    [ForeignKey("customer_id")]
    [InverseProperty("service_reviews")]
    public virtual customer customer { get; set; } = null!;

    [ForeignKey("service_booking_id")]
    [InverseProperty("service_reviews")]
    public virtual service_booking service_booking { get; set; } = null!;
}
