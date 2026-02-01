using ARCon_Capstone_2.Services;
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
