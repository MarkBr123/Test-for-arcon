using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ARCon_Capstone_2.Models
{
    public class service_warranty_booking
    {
        [Key]
        public long id { get; set; }

        // FK - Service Booking
        [Required]
        public int service_booking_id { get; set; }

        // FK - Customer
        [Required]
        public int customer_id { get; set; }

        // Complaint Details
        [Required]
        public string complaint { get; set; } = string.Empty;

        public string? diagnosis_notes { get; set; }

        // Preferred Schedule
        public DateOnly? preferred_date { get; set; }

        public TimeOnly? preferred_time { get; set; }

        // Status
        [Required]
        [StringLength(30)]
        public string status { get; set; } = "PENDING_REVIEW";

        // Approval
        public DateTime? approved_at { get; set; }

        // Technician Notes
        public string? technician_notes { get; set; }

        // Flags
        public bool? is_repeat_issue { get; set; } = false;

        // Audit Dates
        public DateTime created_at { get; set; }

        public DateTime? resolved_at { get; set; }

        public DateTime? cancelled_at { get; set; }

        public string? swb_code { get; set; }

        public bool? isactiveclaim { get; set; }
        public int? linked_service_transaction_id { get; set; }

        /* =========================
           Relationships
        ========================= */

        [ForeignKey(nameof(service_booking_id))]
        public virtual service_booking? service_booking { get; set; }

        [ForeignKey(nameof(customer_id))]
        public virtual customer? customer { get; set; }

        public virtual ICollection<service_warranty_attachment>service_warranty_attachments{ get; set; } = new List<service_warranty_attachment>();
        [ForeignKey(nameof(linked_service_transaction_id))]
        public virtual service_transaction? service_transaction { get; set; }
    }
}