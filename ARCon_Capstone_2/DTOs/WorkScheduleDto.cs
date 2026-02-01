namespace ARCon_Capstone_2.DTOs
{
    public class WorkScheduleDto
    {   
        public int employee_Id { get; set; }
        public string DayOfWeek { get; set; }
        public TimeSpan? LoginTime { get; set; }
        public TimeSpan? LogoutTime { get; set; }
        public bool IsRestday { get; set; }
    }
}
