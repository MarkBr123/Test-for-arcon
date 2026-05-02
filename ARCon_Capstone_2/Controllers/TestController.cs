using Microsoft.AspNetCore.Mvc;
using ARCon_Capstone_2.Services;

namespace ARCon_Capstone_2.Controllers
{
    [ApiController]
    [Route("api/test")]
    public class TestController : ControllerBase
    {
        private readonly IEmailServices _emailService;

        public TestController(IEmailServices emailService)
        {
            _emailService = emailService;
        }

        [HttpGet("send-email")]
        public async Task<IActionResult> SendTestEmail()
        {
            await _emailService.SendAsync(
                "marvincayobitl@gmail.com", // send to yourself
                "TEST OTP",
                "Your OTP is 123456"
            );

            return Ok("Email sent!");
        }
    }
}