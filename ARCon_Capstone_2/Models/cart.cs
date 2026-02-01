using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;

public partial class cart
{
    [Key]
    public int id { get; set; }

    public int customer_id { get; set; }

    public DateTime? created_at { get; set; }

    public DateTime? updated_at { get; set; }

    [InverseProperty("cart")]
    public virtual ICollection<cart_item> cart_items { get; set; } = new List<cart_item>();

    [ForeignKey("customer_id")]
    [InverseProperty("carts")]
    public virtual customer customer { get; set; } = null!;
}
