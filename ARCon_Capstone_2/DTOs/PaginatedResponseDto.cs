namespace ARCon_Capstone_2.DTOs
{
    public class PaginatedResponseDto<T>
    {
        public int Page { get; set; }

        public int PageSize { get; set; }

        public int TotalCount { get; set; }

        public int TotalPages { get; set; }

        public List<T> Items { get; set; } = [];
    }
}
