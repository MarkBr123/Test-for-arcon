namespace ARCon_Capstone_2.DTOs
{
    public class CustomerAddressesDto
    {
        public int Id { get; set; }

        public string? HouseUnit { get; set; }
        public string? StreetName { get; set; }

        public int? BarangayId { get; set; }
        public int? MunicipalityId { get; set; }
        public int? ProvinceId { get; set; }
        public int? RegionId { get; set; }

        public string? ZipCode { get; set; }
        public string? Landmark { get; set; }

        public bool IsDefault { get; set; }

        public decimal? LocationLong { get; set; }
        public decimal? LocationLat { get; set; }
    }
}

