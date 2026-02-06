using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;

    public class province
    {
    [Key]
    public int id { get; set; }

    [Required]
    public string province_name { get; set; } = null!;


    public int region_id { get; set; }

    [ForeignKey(nameof(region_id))]
    [InverseProperty(nameof(region.provinces))]
    public region region { get; set; } = null!;

    public ICollection<municipality> municipalities { get; set; }
        = new List<municipality>();

    public ICollection<customer_address> customer_addresses { get; set; }
    = new List<customer_address>();

}

