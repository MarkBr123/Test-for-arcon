using System.Text.Json.Serialization;

namespace ARCon_Capstone_2.DTOs
{
    public class CreateAdminUserDto
    {
        public string UserName { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string EmailAddress { get; set; }

        public string ContactNo { get; set; }
        public DateOnly? Birthday { get; set; }
        public string HomeAddress { get; set; }

        public int RoleId { get; set; }

        [JsonPropertyName("status")]
        public string Status { get; set; }  


        
        
        public List<WorkScheduleDto> Schedule { get; set; }
    }
}

    

