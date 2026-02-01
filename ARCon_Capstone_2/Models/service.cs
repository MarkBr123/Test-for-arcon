using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;

[Index("service_aircon_type_id", "service_categories_id", Name = "services_service_aircon_type_id_service_categories_id_key", IsUnique = true)]
public partial class service
{
    [Key]
    public int id { get; set; }

    public int service_aircon_type_id { get; set; }

    public int service_categories_id { get; set; }

    [ForeignKey("service_aircon_type_id")]
    [InverseProperty("services")]
    public virtual service_aircon_type service_aircon_type { get; set; } = null!;

    [InverseProperty("services")]
    public virtual ICollection<service_booking_item> service_booking_items { get; set; } = new List<service_booking_item>();

    [ForeignKey("service_categories_id")]
    [InverseProperty("services")]
    public virtual service_category service_categories { get; set; } = null!;

    [InverseProperty("services")]
    public virtual ICollection<service_price_tier> service_price_tiers { get; set; } = new List<service_price_tier>();
}
