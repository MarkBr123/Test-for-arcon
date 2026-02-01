using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;

public partial class notification
{
    [Key]
    public int id { get; set; }

    [StringLength(20)]
    public string user_type { get; set; } = null!;

    public int user_id { get; set; }

    [StringLength(150)]
    public string? title { get; set; }

    public string? text_message { get; set; }

    [StringLength(50)]
    public string? notification_type { get; set; }

    public int? reference_id { get; set; }

    public bool? is_read { get; set; }

    public DateTime? read_at { get; set; }

    public DateTime? created_at { get; set; }
}
