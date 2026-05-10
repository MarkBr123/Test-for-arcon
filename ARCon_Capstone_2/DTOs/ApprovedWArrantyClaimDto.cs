namespace ARCon_Capstone_2.DTOs
{
    public class ApproveWarrantyClaimDto
    {
        public string diagnosis_notes { get; set; }

        public string? technician_notes { get; set; }

        public bool? is_repeat_issue { get; set; }

        public int no_technicians_req { get; set; }

        public decimal difficulty_rate { get; set; }

        public string? parts_needed { get; set; }

        public string? tools_needed { get; set; }

        public DateOnly actual_scheduled_date { get; set; }

        public TimeSpan actual_scheduled_time { get; set; }

        public DateOnly estimated_completion_date { get; set; }

        public TimeSpan estimated_completion_time { get; set; }

        public decimal? reservice_fee { get; set; }

        public string? notes_to_technicians { get; set; }
    }
}
