using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ARCon_Capstone_2.Models;

[Index("contact_no", Name = "customers_contact_no_key", IsUnique = true)]
[Index("email", Name = "customers_email_key", IsUnique = true)]
public partial class customer
{
    [Key]
    public int id { get; set; }

    [StringLength(150)]
    public string first_name { get; set; } = null!;

    [StringLength(150)]
    public string last_name { get; set; } = null!;

    [StringLength(150)]
    public string? middle_name { get; set; }

    public DateOnly birthday { get; set; }

    [StringLength(255)]
    public string email { get; set; } = null!;

    [StringLength(20)]
    public string contact_no { get; set; } = null!;

    public int? customer_avatar_media_id { get; set; }

    public DateTime? created_at { get; set; }

    public DateTime? updated_at { get; set; }

    public bool? is_online { get; set; }

    public DateTime? last_failed_login { get; set; }

    public DateTime? last_login { get; set; }

    [StringLength(255)]
    public string? password_hash { get; set; }

    [InverseProperty("customer")]
    public virtual ICollection<cart> carts { get; set; } = new List<cart>();

    [InverseProperty("customer")]
    public virtual ICollection<chat_conversation> chat_conversations { get; set; } = new List<chat_conversation>();

    [InverseProperty("customer")]
    public virtual ICollection<checkout> checkouts { get; set; } = new List<checkout>();

    [InverseProperty("customer")]
    public virtual ICollection<customer_address> customer_addresses { get; set; } = new List<customer_address>();

    [ForeignKey("customer_avatar_media_id")]
    [InverseProperty("customers")]
    public virtual media_url? customer_avatar_media { get; set; }

    [InverseProperty("customer")]
    public virtual ICollection<customer_transaction> customer_transactions { get; set; } = new List<customer_transaction>();

    [InverseProperty("customer")]
    public virtual ICollection<product_review> product_reviews { get; set; } = new List<product_review>();

    [InverseProperty("customer")]
    public virtual ICollection<service_booking> service_bookings { get; set; } = new List<service_booking>();

    [InverseProperty("customer")]
    public virtual ICollection<service_review> service_reviews { get; set; } = new List<service_review>();
    [InverseProperty("customer")]
    public virtual ICollection<customer_rating> customer_ratings { get; set; }
    [InverseProperty("customer")]
    public virtual ICollection<service_rating> service_ratings { get; set; } = new List<service_rating>();
}
