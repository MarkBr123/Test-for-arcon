using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;

[Index("keyname", Name = "specification_keys_keyname_key", IsUnique = true)]
public partial class specification_key
{
    [Key]
    public int id { get; set; }

    [StringLength(50)]
    public string keyname { get; set; } = null!;

    [InverseProperty("key")]
    public virtual ICollection<technical_specification> technical_specifications { get; set; } = new List<technical_specification>();
}
