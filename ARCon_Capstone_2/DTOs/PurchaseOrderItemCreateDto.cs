using System.ComponentModel.DataAnnotations;

namespace ARCon_Capstone_2.DTOs
{
    public class PurchaseOrderItemCreateDto     
    {
        [Required]
        public int Product_Id { get; set; }

        [Range(1, int.MaxValue)]
        public int Qty_Ordered { get; set; }

        [Range(0.01, double.MaxValue)]
        public decimal Unit_Price { get; set; }
    }
}
