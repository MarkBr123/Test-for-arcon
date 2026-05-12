// =========================
// QUERY DTO
// =========================

namespace ARCon_Capstone_2.DTOs;

    public class Shop_SearchProductsQueryDto
    {
    public string? Search { get; set; }

    public List<string>? Brands { get; set; }

    public List<string>? FormFactors { get; set; }

    public List<string>? Hp { get; set; }

    public string? Stock { get; set; }

    public string? Sort { get; set; }

    public string? Preset { get; set; }

    public decimal? MinPrice { get; set; }

    public decimal? MaxPrice { get; set; }

    public int Page { get; set; } = 1;

    public int PageSize { get; set; } = 18;
}
