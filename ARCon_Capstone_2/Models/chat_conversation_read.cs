using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;

[Index("conversation_id", "user_type", "user_id", Name = "chat_conversation_reads_conversation_id_user_type_user_id_key", IsUnique = true)]
public partial class chat_conversation_read
{
    [Key]
    public int id { get; set; }

    public int conversation_id { get; set; }

    [StringLength(20)]
    public string? user_type { get; set; }

    public int user_id { get; set; }

    public DateTime? last_read_at { get; set; }

    [ForeignKey("conversation_id")]
    [InverseProperty("chat_conversation_reads")]
    public virtual chat_conversation conversation { get; set; } = null!;
}
