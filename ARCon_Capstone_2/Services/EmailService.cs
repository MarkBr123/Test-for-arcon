/*using ARCon_Capstone_2.Services;
using System.Net;
using System.Net.Mail;

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
            var smtp = new SmtpClient(
                _config["Email:SmtpHost"],
                int.Parse(_config["Email:SmtpPort"])
            )
            {
                Credentials = new NetworkCredential(
                    _config["Email:Username"],
                    _config["Email:Password"]
                ),
                EnableSsl = true
            };

            var mail = new MailMessage(
                _config["Email:From"],
                to,
                subject,
                body
            );

            await smtp.SendMailAsync(mail);
        }
    }
}
*/

/*
using System.Net;
using System.Net.Mail;

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
            var smtpHost = _config["Email:SmtpHost"];
            var smtpPort = int.Parse(_config["Email:SmtpPort"]);
            var username = _config["Email:Username"];
            var password = _config["Email:Password"];
            var from = _config["Email:From"];

            var smtp = new SmtpClient(smtpHost, smtpPort)
            {
                Credentials = new NetworkCredential(username, password),
                EnableSsl = true
            };

            var mail = new MailMessage(from, to, subject, body);

            await smtp.SendMailAsync(mail);
        }
    }
}
*/

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