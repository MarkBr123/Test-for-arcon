using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;

[Index("product_id", "technology_id", Name = "product_technologies_product_id_technology_id_key", IsUnique = true)]
public partial class product_technology
{
    [Key]
    public int id { get; set; }

    public int product_id { get; set; }

    public int technology_id { get; set; }

    [ForeignKey("product_id")]
    [InverseProperty("product_technologies")]
    public virtual product product { get; set; } = null!;

    [ForeignKey("technology_id")]
    [InverseProperty("product_technologies")]
    public virtual technology_type technology { get; set; } = null!;
}
