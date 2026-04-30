using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;


public partial class auth_otp
{ 
    [Key]
    public int id { get; set; }

    public int user_id { get; set; }

    [StringLength(50)]
    public string user_type { get; set; }

    [StringLength (255)]
    public string otp_code { get; set; }

    public DateTime expires_at { get; set; }
    public int? attempt_count { get; set; }

    public DateTime? locked_until { get; set; }

    public DateTime? created_at { get; set; }

}

