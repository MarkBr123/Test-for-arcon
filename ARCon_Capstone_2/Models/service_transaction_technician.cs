using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Client;

namespace ARCon_Capstone_2.Models;

[Index(nameof(service_transaction_id), nameof(technician_id), IsUnique = true)]
public partial class service_transaction_technician
{
    [Key]
    public int id { get; set; }

    public int service_transaction_id { get; set; }

    public int technician_id { get; set; }

    public DateTime? assigned_at { get; set; }

    public bool isactiveservicetransac { get; set; } 

    public DateTime? updated_at { get; set; }

    //Technician navigation
    [ForeignKey("technician_id")]
    [InverseProperty("service_transaction_technicians")]
    public virtual admin_user admin_user { get; set; } = null!;

    //Transaction navigation (ONLY ONE)
    [ForeignKey("service_transaction_id")]
    [InverseProperty("service_transaction_technicians")]
    public virtual service_transaction service_transaction { get; set; } = null!;
}