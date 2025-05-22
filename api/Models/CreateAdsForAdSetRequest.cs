using System.Collections.Generic;

namespace AdDashboard.Api.Models
{
    public class CreateAdsForAdSetRequest
    {
        public CreateAdsForAdSetRequest()
        {
            // Initialize collections in constructor to avoid null reference exceptions
            VideoIds = new List<string>();
            CreativeIds = new List<string>();
        }
        
        public int? ProjectId { get; set; } = 1;
        public List<string> VideoIds { get; set; }
        public List<string> CreativeIds { get; set; }
        public string Name { get; set; }
        public string Status { get; set; } = "PAUSED"; // Default to PAUSED
    }
} 