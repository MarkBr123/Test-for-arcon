using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;

    public partial class chat_message_media
    {
            [Key]
            public int id { get; set; }

            [Required]
            public int chat_message_id { get; set; }

            [Required]
            public string file_url { get; set; }

            [MaxLength(255)]
            public string? file_name { get; set; }

            [MaxLength(50)]
            public string? file_type { get; set; }

            public decimal? file_size { get; set; }

            public DateTime created_at { get; set; } = DateTime.UtcNow;

            // 🔥 NAVIGATION PROPERTY
            [ForeignKey("chat_message_id")]
            public chat_message? chat_message { get; set; }
}

