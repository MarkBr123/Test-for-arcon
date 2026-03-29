using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;
public partial class chat_participant
{
    [Key]
    public int id { get; set; }

    // 🔑 Foreign Key
    public int conversation_id { get; set; }

    [StringLength(20)]
    public string user_type { get; set; } = null!;
    // ADMIN, CSM, AIRCON_TECHNICIAN, CUSTOMER

    public int user_id { get; set; }

    public DateTime? joined_at { get; set; }

    // 🔗 Navigation (Many → One)
    [ForeignKey("conversation_id")]
    [InverseProperty("chat_participants")]
    public virtual chat_conversation conversation { get; set; } = null!;
}

