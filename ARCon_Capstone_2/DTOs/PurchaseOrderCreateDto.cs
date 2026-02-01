using System.ComponentModel.DataAnnotations;

namespace ARCon_Capstone_2.DTOs
{
    public class PurchaseOrderCreateDto
    {
        [Required]
        public int Supplier_Id { get; set; }
        [Required]
        public string Payment_Type { get; set; } = null!;
        [Required]
        public int Arcon_Branch_Address { get; set; }
        [Required]
        public DateOnly Expected_Delivery { get; set; }

        [Range(0, double.MaxValue)]
        public decimal Freight_Cost { get; set; }

        [Required]
        [MinLength(1, ErrorMessage = "At least one PO item is required.")]
        public List<PurchaseOrderItemCreateDto> Items { get; set; } = new();
    }
}
