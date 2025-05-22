using System;

namespace AdDashboard.Api.Dtos
{
    public class AdSetDto
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string Status { get; set; }
        public long DailyBudget { get; set; }
        public string CampaignId { get; set; }
        public DateTime? StartTime { get; set; }
        public DateTime? EndTime { get; set; }
    }
} 