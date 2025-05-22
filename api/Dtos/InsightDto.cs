using System;

namespace AdDashboard.Api.Dtos
{
    public class InsightDto
    {
        public string Date { get; set; }
        public long Impressions { get; set; }
        public long Reach { get; set; }
        public double Spend { get; set; }
        public double Cpi { get; set; }
    }
}