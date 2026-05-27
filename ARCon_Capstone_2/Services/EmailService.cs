

using sib_api_v3_sdk.Api;
using sib_api_v3_sdk.Model;
using static System.Net.WebRequestMethods;
using Task = System.Threading.Tasks.Task;

namespace ARCon_Capstone_2.Services
{
    public class EmailService : IEmailServices
    {
        private readonly IConfiguration _config;

        public EmailService(IConfiguration config)
        {
            _config = config;
        }

        public async Task SendAsync(string to, string subject, string body)
        {
            var apiKey = _config["Brevo:ApiKey"];
            var senderEmail = _config["Brevo:SenderEmail"];
            var senderName = _config["Brevo:SenderName"];

            var client = new TransactionalEmailsApi();
            client.Configuration.ApiKey["api-key"] = apiKey;

            var email = new SendSmtpEmail(
                sender: new SendSmtpEmailSender(senderName, senderEmail),
                to: new List<SendSmtpEmailTo>
                {
            new SendSmtpEmailTo(to)
                },
                subject: subject,
                htmlContent: body,
                textContent: "Your OTP code was sent. Please check your email."
            );

            await client.SendTransacEmailAsync(email);
        }
    }
}