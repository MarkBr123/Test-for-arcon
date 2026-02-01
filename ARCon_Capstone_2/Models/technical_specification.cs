using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;

public partial class technical_specification
{
    [Key]
    public int id { get; set; }

    public int product_id { get; set; }

    public int key_id { get; set; }

    [StringLength(255)]
    public string value { get; set; } = null!;

    [ForeignKey("key_id")]
    [InverseProperty("technical_specifications")]
    public virtual specification_key key { get; set; } = null!;

    [ForeignKey("product_id")]
    [InverseProperty("technical_specifications")]
    public virtual product product { get; set; } = null!;
}
