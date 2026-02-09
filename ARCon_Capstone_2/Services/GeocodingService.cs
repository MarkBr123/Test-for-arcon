using System.Globalization;
using System.Net.Http.Json;
using System.Text.Json;

namespace ARCon_Capstone_2.Services;

public class GeocodingService : IGeocodingService
{
    private readonly HttpClient _http;

    public GeocodingService(HttpClient http)
    {
        _http = http;
    }

    public async Task<(decimal lat, decimal lon)> GetCoordinatesAsync(string address)
    {
        var url =
            $"https://nominatim.openstreetmap.org/search" +
            $"?q={Uri.EscapeDataString(address)}&format=json&limit=1";

        var response = await _http.GetFromJsonAsync<JsonElement[]>(url);

        if (response == null || response.Length == 0)
            throw new Exception($"No geocoding result for address: {address}");

        var lat = decimal.Parse(
            response[0].GetProperty("lat").GetString()!,
            CultureInfo.InvariantCulture);

        var lon = decimal.Parse(
            response[0].GetProperty("lon").GetString()!,
            CultureInfo.InvariantCulture);

        return (lat, lon);
    }

}
