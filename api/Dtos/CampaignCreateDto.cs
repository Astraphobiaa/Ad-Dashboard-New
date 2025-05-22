using System;
using System.Collections.Generic;

namespace AdDashboard.Api.Dtos
{
    public class CampaignCreateDto
    {
        // Temel kampanya
        public string CampaignName { get; set; }
        public string BuyingType { get; set; }               // e.g. "AUCTION"
        public string Objective { get; set; }                // e.g. "APP_INSTALLS", "VIDEO_VIEWS"
        public List<string> special_ad_categories { get; set; }// e.g. empty veya ["EMPLOYMENT","HOUSING"]
        public bool EnableSkAdNetwork { get; set; }          // iOS14+ SKAdNetwork
        public bool EnableAbTest { get; set; }               // A/B testi

        // Bütçe
        public bool IsDailyBudget { get; set; }
        public decimal BudgetAmount { get; set; }
        public DateTime? StartTime { get; set; }             // ISO-8601 format
        public DateTime? EndTime { get; set; }

        // Hedef kitle
        public List<string> Countries { get; set; }
        public string Gender { get; set; }                   // "ALL","MALE","FEMALE"
        public int AgeMin { get; set; }                      // >=13
        public int AgeMax { get; set; }                      // <=65

        // Uygulama reklamları
        public string AppId { get; set; }                    // Örneğin iOS veya Android app ID
        public string PromotedAppName { get; set; }          // Gösterilecek isim
        public string OptimizationGoal { get; set; }         // e.g. "INSTALLS","VIDEO_VIEWS","REACH"

        // Videolar
        public List<int> VideoIds { get; set; }
    }
}
