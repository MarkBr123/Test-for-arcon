namespace ARCon_Capstone_2.DTOs
{
    public class CreateServiceWarrantyClaimDto
    {
        public int service_booking_id { get; set; }

        public string complaint { get; set; } = string.Empty;

        public DateOnly? preferred_date { get; set; }

        public TimeOnly? preferred_time { get; set; }

        public List<IFormFile>? files { get; set; }
    }
}

