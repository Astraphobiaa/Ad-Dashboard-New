// File: Controllers/HealthController.cs
using Microsoft.AspNetCore.Mvc;

namespace AdDashboard.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HealthController : ControllerBase
    {
        [HttpGet]
        public IActionResult Get() => Ok(new { status = "Healthy" });
    }
}