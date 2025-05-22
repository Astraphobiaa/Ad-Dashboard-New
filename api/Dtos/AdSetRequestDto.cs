using System;
using System.Collections.Generic;

namespace AdDashboard.Api.Dtos
{
    public class CreateAdSetRequest
    {
        public string CampaignId { get; set; }
        public string Name { get; set; }
        public long DailyBudget { get; set; }
        public string Status { get; set; } = "PAUSED";
        public string BillingEvent { get; set; } = "IMPRESSIONS";
        public string OptimizationGoal { get; set; } = "LINK_CLICKS";
        public long? BidAmount { get; set; }
        public string BidStrategy { get; set; } = "LOWEST_COST_WITH_BID_CAP";
        public double? MinimumRoasTarget { get; set; }
        public TargetingDto Targeting { get; set; }
        public DateTime? StartTime { get; set; }
        public DateTime? StopTime { get; set; }
    }

    public class CreateAdSetWithVideosRequest : CreateAdSetRequest
    {
        public List<string> SelectedVideoIds { get; set; } = new List<string>();
    }
} 