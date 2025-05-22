using System;
using System.Threading.Tasks;
using AdDashboard.Api;
using AdDashboard.Api.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;

namespace AdDashboard.Api.Jobs
{
    public static class JobExecution
    {
        public static async Task FetchAllInsights(IServiceProvider services)
        {
            using var scope = services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var fb = scope.ServiceProvider.GetRequiredService<IFacebookService>();

            var campaigns = await db.Campaigns.ToListAsync();
            foreach (var camp in campaigns)
            {
                var result = await fb.FetchInsightsForCampaign(camp.FbCampaignId);
                if (!result.Success) continue;

                foreach (var d in result.Data)
                {
                    db.Insights.Add(new Insight
                    {
                        CampaignId = camp.Id,
                        Date       = DateTime.Parse(d.Date),                          // string → DateTime
                        Impressions= d.Impressions,
                        Reach      = d.Reach,
                        Spend      = Convert.ToDecimal(d.Spend),                     // double → decimal
                        Cpi        = Convert.ToDecimal(d.Cpi)                        // double → decimal
                    });
                }
                await db.SaveChangesAsync();
            }
        }
    }
}