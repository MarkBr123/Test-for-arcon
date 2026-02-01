using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;

[Table("media_url")]
public partial class media_url
{
    [Key]
    public int id { get; set; }

    [StringLength(500)]
    public string url { get; set; } = null!;

    [StringLength(50)]
    public string? type { get; set; }

    public DateTime? created_at { get; set; }

    public int? created_by { get; set; }

    [InverseProperty("admin_user_avatar_media")]
    public virtual ICollection<admin_user> admin_users { get; set; } = new List<admin_user>();

    [ForeignKey("created_by")]
    [InverseProperty("media_urls")]
    public virtual admin_user? created_byNavigation { get; set; }

    [InverseProperty("customer_avatar_media")]
    public virtual ICollection<customer> customers { get; set; } = new List<customer>();

    [InverseProperty("media")]
    public virtual ICollection<supplier_return_item_medium> supplier_return_item_media { get; set; } = new List<supplier_return_item_medium>();

    [InverseProperty("supplier_logo_media")]
    public virtual ICollection<supplier> suppliers { get; set; } = new List<supplier>();
}
