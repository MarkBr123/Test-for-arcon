using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;

[Index("part_number_a", Name = "products_part_number_a_key", IsUnique = true)]
[Index("product_model", Name = "products_product_model_key", IsUnique = true)]
[Index("sku", Name = "products_sku_key", IsUnique = true)]
public partial class product
{
    [Key]
    public int id { get; set; }

    public int manufacturer_id { get; set; }

    [StringLength(100)]
    public string product_model { get; set; } = null!;

    [StringLength(100)]
    public string? product_series { get; set; }

    [StringLength(100)]
    public string sku { get; set; } = null!;

    [StringLength(100)]
    public string part_number_a { get; set; } = null!;

    [StringLength(100)]
    public string? part_number_b { get; set; }

    [StringLength(50)]
    public string status { get; set; } = null!;

    [Precision(12, 2)]
    public decimal original_selling_price { get; set; }

    [Precision(12, 2)]
    public decimal? discounted_selling_price { get; set; }

    [StringLength(50)]
    public string discount_type { get; set; } = null!;

    [Precision(10, 2)]
    public decimal? discount_value { get; set; }

    public bool? isdiscounted { get; set; }

    [Precision(12, 2)]
    public decimal? actual_selling_price { get; set; }

    [StringLength(255)]
    public string? ar_url { get; set; }

    public DateTime? created_at { get; set; }

    public int? created_by { get; set; }

    public DateTime? updated_at { get; set; }

    public int? updated_by { get; set; }

    public int? manufacturer_warranty_years { get; set; }

    public int? outright_replacement_days { get; set; }

    public bool? has_installation_service { get; set; }

    [Precision(6, 2)]
    public decimal? gross_weight_a { get; set; }

    [Precision(6, 2)]
    public decimal? gross_weight_b { get; set; }

    [Precision(6, 2)]
    public decimal? total_gross_weight { get; set; }

    public int? form_factor_id { get; set; }

    [InverseProperty("product")]
    public virtual ICollection<cart_item> cart_items { get; set; } = new List<cart_item>();

    [InverseProperty("product")]
    public virtual ICollection<checkout_item> checkout_items { get; set; } = new List<checkout_item>();

    [ForeignKey("created_by")]
    [InverseProperty("productcreated_byNavigations")]
    public virtual admin_user? created_byNavigation { get; set; }

    [ForeignKey("form_factor_id")]
    [InverseProperty("products")]
    public virtual form_factor? form_factor { get; set; }

    [InverseProperty("product")]
    public virtual ICollection<inventory> inventories { get; set; } = new List<inventory>();

    [ForeignKey("manufacturer_id")]
    [InverseProperty("products")]
    public virtual manufacturer manufacturer { get; set; } = null!;

    [InverseProperty("product")]
    public virtual ICollection<order_item> order_items { get; set; } = new List<order_item>();

    [InverseProperty("product")]
    public virtual ICollection<product_review> product_reviews { get; set; } = new List<product_review>();

    [InverseProperty("product")]
    public virtual ICollection<product_tag> product_tags { get; set; } = new List<product_tag>();

    [InverseProperty("product")]
    public virtual ICollection<product_technology> product_technologies { get; set; } = new List<product_technology>();

    [InverseProperty("product")]
    public virtual ICollection<purchase_order_article> purchase_order_articles { get; set; } = new List<purchase_order_article>();

    [InverseProperty("product")]
    public virtual ICollection<received_article> received_articles { get; set; } = new List<received_article>();

    [InverseProperty("product")]
    public virtual ICollection<supplier_return_item> supplier_return_items { get; set; } = new List<supplier_return_item>();

    [InverseProperty("product")]
    public virtual ICollection<technical_specification> technical_specifications { get; set; } = new List<technical_specification>();

    [ForeignKey("updated_by")]
    [InverseProperty("productupdated_byNavigations")]
    public virtual admin_user? updated_byNavigation { get; set; }
}
