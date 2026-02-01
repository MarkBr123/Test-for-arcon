namespace ARCon_Capstone_2.DTOs
{
    public class ReceivedFromPoDto
    {
        public int Product_Id { get; set; }
        public int Qty_Received { get; set; }
        public decimal Unit_Price { get; set; }
        public List<string> Serials { get; set; } = new();
    }
}

