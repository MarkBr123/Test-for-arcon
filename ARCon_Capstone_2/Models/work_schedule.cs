using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;

[Table("work_schedule")]
public partial class work_schedule
{
    [Key]
    public int id { get; set; }

    public int employee_id { get; set; }

    [StringLength(10)]
    public string day_of_week { get; set; } = null!;

    public TimeSpan? login_time { get; set; }

    public TimeSpan? logout_time { get; set; }

    public bool? is_restday { get; set; }

    public DateTime? created_at { get; set; }

    public int? created_by { get; set; }

    public DateTime? updated_at { get; set; }

    public int? updated_by { get; set; }

    [ForeignKey("created_by")]
    [InverseProperty("work_schedulecreated_byNavigations")]
    public virtual admin_user? created_byNavigation { get; set; }

    [ForeignKey("employee_id")]
    [InverseProperty("work_scheduleemployees")]
    public virtual admin_user employee { get; set; } = null!;

    [ForeignKey("updated_by")]
    [InverseProperty("work_scheduleupdated_byNavigations")]
    public virtual admin_user? updated_byNavigation { get; set; }
}
