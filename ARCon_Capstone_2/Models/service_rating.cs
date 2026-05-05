using ARCon_Capstone_2.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("service_ratings")] // 🔥 REQUIRED
public class service_rating
{
    [Key]
    [Column("id")]
    public int id { get; set; }

    [Required]
    [Range(1, 5)]
    [Column("rating")]
    public int rating { get; set; }

    [StringLength(255)]
    [Column("comment")]
    public string? comment { get; set; }

    [Column("isposted")]
    public bool isposted { get; set; } = false;

    [Column("created_at")]
    public DateTime created_at { get; set; } = DateTime.UtcNow;

    [Column("service_booking_id")]
    public int service_booking_id { get; set; }

    [Column("customer_id")] // 🔥 THIS MUST MATCH DB EXACTLY
    public int customer_id { get; set; }

    [ForeignKey("service_booking_id")]
    public service_booking service_booking { get; set; }

    [ForeignKey("customer_id")]
    public customer? customer { get; set; }
}