using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;

public partial class role
{
    [Key]
    public int id { get; set; }

    [StringLength(20)]
    public string role_name { get; set; } = null!;

    public string? role_description { get; set; }

    /*[ForeignKey("role_id")]
    [InverseProperty("roles")]*/

    public ICollection<user_role> user_roles { get; set; } = new List<user_role>();


}
