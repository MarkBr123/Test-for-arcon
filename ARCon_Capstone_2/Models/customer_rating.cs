using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;

public class customer_rating
    {
            [Key]
            public int id { get; set; }

            [Required]
            public int customer_id { get; set; }

            [Required]
            public int transaction_id { get; set; }

            [Required]
            public int product_id { get; set; }

            public int? delivery_item_id { get; set; }

            [Required]
            [Range(1, 5)]
            public int rating { get; set; }

            public string? comment { get; set; }

            public DateTime created_at { get; set; } = DateTime.UtcNow;

            public bool isposted { get; set; } = false;


            [ForeignKey(nameof(customer_id))]
            public customer customer { get; set; }

            [ForeignKey(nameof(transaction_id))]
            public customer_transaction customer_transaction { get; set; }

            [ForeignKey(nameof(product_id))]
            public product product { get; set; }

            [ForeignKey(nameof(delivery_item_id))]
            public delivery_item delivery_item { get; set; }
}

