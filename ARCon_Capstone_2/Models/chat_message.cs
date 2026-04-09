using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;

public partial class chat_message
{
    [Key]
    public int id { get; set; }

    public int conversation_id { get; set; }

    [StringLength(20)]
    public string sender_type { get; set; } = null!;

    public int sender_id { get; set; }

    public string? message { get; set; }

    [StringLength(20)]
    public string? message_type { get; set; }

    public bool? is_deleted { get; set; }

    public DateTime? deleted_at { get; set; }

    public DateTime? created_at { get; set; }


    [ForeignKey("conversation_id")]
    [InverseProperty("chat_messages")]
    public virtual chat_conversation conversation { get; set; } = null!;

    public ICollection<chat_message_media> media { get; set; } = new List<chat_message_media>();
}
