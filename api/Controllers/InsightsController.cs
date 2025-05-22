using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;
using AdDashboard.Api.Services;
using Microsoft.Extensions.DependencyInjection;

namespace AdDashboard.Api.Controllers
{
    [ApiController]
    [Route("api/projects/{projectId}/insights")]
    public class InsightsController : ControllerBase
    {
        private readonly IServiceScopeFactory _scopeFactory;

        public InsightsController(IServiceScopeFactory scopeFactory)
        {
            _scopeFactory = scopeFactory;
        }

        [HttpGet]
        public async Task<IActionResult> GetInsights(int projectId)
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var campaigns = await db.Campaigns
                .Where(c => c.ProjectId == projectId)
                .SelectMany(c => db.Insights.Where(i => i.CampaignId == c.Id))
                .ToListAsync();
            return Ok(campaigns);
        }
    }
}
