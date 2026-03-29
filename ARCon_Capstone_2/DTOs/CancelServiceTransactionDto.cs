using System.ComponentModel.DataAnnotations;
namespace ARCon_Capstone_2.DTOs
{
    public class CancelServiceTransactionDto
    {
        public string CancellationReason { get; set; } = string.Empty;
    }
}