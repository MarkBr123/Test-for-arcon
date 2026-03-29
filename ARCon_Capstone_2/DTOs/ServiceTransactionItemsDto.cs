using System.ComponentModel.DataAnnotations;

namespace ARCon_Capstone_2.DTOs
{
    public class ServiceTransactionItemsDto
    {
        [Required]
        public int ServiceTransactionId { get; set; }
        [Required]
        public int ServiceBookingItemsId { get; set; }
    }
}
