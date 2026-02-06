using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;
    public class municipality
    {
        [Key]
        public int id { get; set; }

        public string municipality_name { get; set; } = null!;

        public int province_id { get; set; }

    [ForeignKey(nameof(province_id))]
    [InverseProperty(nameof(province.municipalities))] // ✅ FIXED
    public province province { get; set; } = null!;


    public ICollection<barangay> barangays { get; set; }
            = new List<barangay>();

        public ICollection<customer_address> customer_addresses { get; set; }
        = new List<customer_address>();

}

