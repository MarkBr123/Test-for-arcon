using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ARCon_Capstone_2.Models;

public partial class outright_replacement_warranty
{
    [Key]
    public int id { get; set; }

    [StringLength(50)]
    public string? warranty_code { get; set; }

    public int customer_id { get; set; }

    public int? customer_transaction_id { get; set; }

    [StringLength(30)]
    public string status { get; set; } = "FOR_VALIDATION";

    public string? customer_notes { get; set; }

    public string? admin_notes { get; set; }

    public DateTime? approved_at { get; set; }

    public DateTime? rejected_at { get; set; }

    public string? rejection_reason { get; set; }

    // CUSTOMER_STORE_PICKUP / DELIVERY
    [StringLength(30)]
    public string? release_method { get; set; }

    // IN_HOUSE_DELIVERY / COURIER
    [StringLength(30)]
    public string? delivery_type { get; set; }

    [StringLength(100)]
    public string? courier_name { get; set; }

    [StringLength(100)]
    public string? tracking_number { get; set; }

    public DateTime? delivery_date { get; set; }

    public DateTime? pickup_date { get; set; }

    public DateTime? released_at { get; set; }

    public DateTime? received_by_customer_at { get; set; }

    public DateTime? created_at { get; set; }

    public DateTime? updated_at { get; set; }


    [ForeignKey("customer_id")]
    [InverseProperty("outright_replacement_warranties")]
    public virtual customer customer { get; set; } = null!;

    [ForeignKey("customer_transaction_id")]
    [InverseProperty("outright_replacement_warranties")]
    public virtual customer_transaction? customer_transaction { get; set; }

    [InverseProperty("outright_replacement_warranty")]
    public virtual ICollection<outright_replacement_warranty_item> outright_replacement_warranty_items { get; set; }
        = new List<outright_replacement_warranty_item>();

    [InverseProperty("outright_replacement_warranty")]
    public virtual ICollection<outright_replacement_warranty_attachment> outright_replacement_warranty_attachments { get; set; }
        = new List<outright_replacement_warranty_attachment>();
}