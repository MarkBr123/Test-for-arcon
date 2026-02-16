using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;

[Table("products_media")]
public partial class products_media
{
    [Key]
    public int id { get; set; }

    [Required]
    public int product_id { get; set; }

    [Required]
    public int media_id { get; set; }

    public bool is_primary { get; set; } = false;

    // Navigation Properties
    public virtual product product { get; set; } = null!;
    public virtual media_url media { get; set; } = null!;
}