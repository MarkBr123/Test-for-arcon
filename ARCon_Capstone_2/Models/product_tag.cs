using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;

public partial class product_tag
{
    [Key]
    public int id { get; set; }

    public int product_id { get; set; }

    public int tag_id { get; set; }

    [ForeignKey("product_id")]
    [InverseProperty("product_tags")]
    public virtual product product { get; set; } = null!;

    [ForeignKey("tag_id")]
    [InverseProperty("product_tags")]
    public virtual tag tag { get; set; } = null!;
}
