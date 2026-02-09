namespace ARCon_Capstone_2.Services
{
    public interface IGeocodingService
    {
        Task<(decimal lat, decimal lon)> GetCoordinatesAsync(string address);
    }
}
