using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;

    public partial class region
    {

        [Key]
        public int id { get; set; }

        public string region_name {  get; set; }
        public string region_description { get; set; }

    // Inverse navigation
    public ICollection<province> provinces { get; set; }
        = new List<province>();

    public ICollection<customer_address> customer_addresses { get; set; }
    = new List<customer_address>();

}

