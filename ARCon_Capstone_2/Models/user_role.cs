using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models
{
    [Table("user_roles")]
    public class user_role
    {
        [Column("user_id")]
        public int user_id { get; set; }

        [Column("role_id")]
        public int role_id { get; set; }

        // 🔗 Navigation Properties
        [ForeignKey(nameof(user_id))]
        public admin_user User { get; set; } = null!;

        [ForeignKey(nameof(role_id))]
        public role Role { get; set; } = null!;
    }
}
