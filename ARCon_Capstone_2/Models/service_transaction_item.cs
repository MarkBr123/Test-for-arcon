using ARCon_Capstone_2.Models;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("service_transaction_item")]
public class service_transaction_item
{
    [Key]
    public int id { get; set; }

    public int service_transaction_id { get; set; }

    public int service_booking_items_id { get; set; }

    public DateTime created_at { get; set; }


    /* -------- RELATIONSHIPS -------- */

    [ForeignKey("service_transaction_id")]
    [InverseProperty("service_transaction_items")]
    public virtual service_transaction service_transaction { get; set; }

    [ForeignKey("service_booking_items_id")]
    [InverseProperty("service_transaction_items")]
    public virtual service_booking_item service_booking_items { get; set; }
}