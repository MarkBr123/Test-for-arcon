using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;

[Index("booking_id", "admin_users_id", Name = "service_booking_technicians_booking_id_admin_users_id_key", IsUnique = true)]
public partial class service_booking_technician
{
    [Key]
    public int id { get; set; }

    public int booking_id { get; set; }

    public int admin_users_id { get; set; }

    [Column(TypeName = "timestamp without time zone")]
    public DateTime? assigned_at { get; set; }

    [ForeignKey("admin_users_id")]
    [InverseProperty("service_booking_technicians")]
    public virtual admin_user admin_users { get; set; } = null!;

    [ForeignKey("booking_id")]
    [InverseProperty("service_booking_technicians")]
    public virtual service_booking booking { get; set; } = null!;
}
