using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;

public partial class supplier_return_item_medium
{
    [Key]
    public int id { get; set; }

    public int supplier_return_item_id { get; set; }

    public int media_id { get; set; }

    [ForeignKey("media_id")]
    [InverseProperty("supplier_return_item_media")]
    public virtual media_url media { get; set; } = null!;

    [ForeignKey("supplier_return_item_id")]
    [InverseProperty("supplier_return_item_media")]
    public virtual supplier_return_item supplier_return_item { get; set; } = null!;
}
