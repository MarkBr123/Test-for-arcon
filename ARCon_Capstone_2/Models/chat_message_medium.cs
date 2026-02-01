using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;

public partial class chat_message_medium
{
    [Key]
    public int id { get; set; }

    public int chat_message_id { get; set; }

    public string file_url { get; set; } = null!;

    [StringLength(255)]
    public string? file_name { get; set; }

    [StringLength(50)]
    public string? file_type { get; set; }

    [Precision(5, 2)]
    public decimal? file_size { get; set; }

    public DateTime? created_at { get; set; }

    [ForeignKey("chat_message_id")]
    [InverseProperty("chat_message_media")]
    public virtual chat_message chat_message { get; set; } = null!;
}
