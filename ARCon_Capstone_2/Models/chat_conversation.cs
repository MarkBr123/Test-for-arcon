using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;

public partial class chat_conversation
{
    [Key]
    public int id { get; set; }

    public int? customer_id { get; set; }

    public int? assigned_csm_id { get; set; }

    [StringLength(150)]
    public string? subject { get; set; }

    [StringLength(30)]
    public string? status { get; set; }

    public bool? is_archived { get; set; }

    public bool? is_deleted { get; set; }

    public DateTime? created_at { get; set; }

    public DateTime? updated_at { get; set; }

    public DateTime? closed_at { get; set; }

    public string? chat_type { get; set; } // INTERNAL OR EXTERNAL

    public string? pair_key { get; set; }

    [ForeignKey("assigned_csm_id")]
    [InverseProperty("chat_conversations")]
    public virtual admin_user? assigned_csm { get; set; }

    [InverseProperty("conversation")]
    public virtual ICollection<chat_conversation_read> chat_conversation_reads { get; set; } = new List<chat_conversation_read>();

    [InverseProperty("conversation")]
    public virtual ICollection<chat_message> chat_messages { get; set; } = new List<chat_message>();

    [ForeignKey("customer_id")]
    [InverseProperty("chat_conversations")]
    public virtual customer customer { get; set; } = null!;


    [InverseProperty("conversation")]
    public virtual ICollection<chat_participant> chat_participants { get; set; } = new List<chat_participant>();
}
