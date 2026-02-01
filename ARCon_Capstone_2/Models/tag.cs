using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;

[Index("tag_name", Name = "tags_tag_name_key", IsUnique = true)]
public partial class tag
{
    [Key]
    public int id { get; set; }

    [StringLength(50)]
    public string tag_name { get; set; } = null!;

    public DateTime? created_at { get; set; }

    [InverseProperty("tag")]
    public virtual ICollection<product_tag> product_tags { get; set; } = new List<product_tag>();
}
