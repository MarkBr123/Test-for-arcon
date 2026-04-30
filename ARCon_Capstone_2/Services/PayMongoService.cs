using System.Net.Http.Headers;
using System.Text;
using Newtonsoft.Json;

public class PayMongoService
{
    private readonly IConfiguration _config;
    private readonly HttpClient _http;

    public PayMongoService(IConfiguration config)
    {
        _config = config;
        _http = new HttpClient();
    }

    // =====================================================
    // 🔐 SET AUTH HEADER
    // =====================================================
    private void SetAuthHeader()
    {
        _http.DefaultRequestHeaders.Clear();

        var secretKey = _config["PayMongo:SecretKey"]?.Trim();

        if (string.IsNullOrEmpty(secretKey))
            throw new Exception("PayMongo SecretKey is missing.");

        var auth = Convert.ToBase64String(
            Encoding.UTF8.GetBytes(secretKey + ":"));

        _http.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Basic", auth);
    }

    // =====================================================
    // 💳 CREATE PAYMENT INTENT (NO METADATA)
    // =====================================================
    public async Task<PayMongoPaymentIntentResponse> CreatePaymentIntent(decimal amount)
    {
        SetAuthHeader();

        int amountInCentavos = (int)(amount * 100);

        var payload = new
        {
            data = new
            {
                attributes = new
                {
                    amount = amountInCentavos,
                    payment_method_allowed = new[] { "card" },
                    currency = "PHP"
                }
            }
        };

        var json = JsonConvert.SerializeObject(payload);

        var response = await _http.PostAsync(
            "https://api.paymongo.com/v1/payment_intents",
            new StringContent(json, Encoding.UTF8, "application/json")
        );

        var content = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            throw new Exception(content);
        }

        dynamic result = JsonConvert.DeserializeObject(content);

        return new PayMongoPaymentIntentResponse
        {
            Id = result.data.id,
            ClientKey = result.data.attributes.client_key
        };
    }

    // =====================================================
    // 🔗 ATTACH PAYMENT METHOD
    // =====================================================
    public async Task AttachPaymentMethod(string paymentIntentId, string paymentMethodId)
    {
        SetAuthHeader();

        var payload = new
        {
            data = new
            {
                attributes = new
                {
                    payment_method = paymentMethodId,
                    return_url = "https://yourdomain.com/payment-success" // 🔥 REQUIRED
                }
            }
        };

        var json = JsonConvert.SerializeObject(payload);

        var response = await _http.PostAsync(
            $"https://api.paymongo.com/v1/payment_intents/{paymentIntentId}/attach",
            new StringContent(json, Encoding.UTF8, "application/json")
        );

        var content = await response.Content.ReadAsStringAsync();

        Console.WriteLine("ATTACH RESPONSE:");
        Console.WriteLine(content);

        if (!response.IsSuccessStatusCode)
        {
            try
            {
                dynamic err = JsonConvert.DeserializeObject(content);
                string message = err.errors[0].detail;

                throw new Exception(message);
            }
            catch
            {
                throw new Exception("Payment failed.");
            }
        }
    }
    // =====================================================
    // 🔍 GET PAYMENT INTENT STATUS
    // =====================================================
    public async Task<string> GetPaymentStatus(string paymentIntentId)
    {
        SetAuthHeader();

        var response = await _http.GetAsync(
            $"https://api.paymongo.com/v1/payment_intents/{paymentIntentId}"
        );

        var content = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            throw new Exception(content);
        }

        dynamic result = JsonConvert.DeserializeObject(content);

        return result.data.attributes.status;
    }
}