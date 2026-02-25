namespace ARCon_Capstone_2.Helpers.LalamoveHelpers
{
    public class LalamoveData
    {
        public string serviceType { get; set; }
        public string[] specialRequests { get; set; }
        public string language { get; set; }
        public Stop[] stops { get; set; }
        public bool isRouteOptimized { get; set; }
        public Item item { get; set; }
    }
}
