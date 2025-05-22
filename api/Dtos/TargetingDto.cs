// File: Dtos/TargetingDto.cs
using System.Collections.Generic;
using Newtonsoft.Json;

namespace AdDashboard.Api.Dtos
{
    public class TargetingDto
    {
        [JsonProperty("geo_locations")]
        public GeoLocationDto GeoLocations { get; set; } = new GeoLocationDto();
        
        [JsonProperty("age_min")]
        public int AgeMin { get; set; } = 18;
        
        [JsonProperty("age_max")]
        public int AgeMax { get; set; } = 65;
        
        [JsonProperty("genders")]
        public List<int> Genders { get; set; } = new List<int>();
        
        [JsonProperty("publisher_platforms")]
        public List<string> PublisherPlatforms { get; set; } = new List<string>();
        
        [JsonProperty("device_platforms")]
        public List<string> DevicePlatforms { get; set; } = new List<string>();
        
        [JsonProperty("facebook_positions")]
        public List<string> FacebookPositions { get; set; } = new List<string>();
    }

    public class GeoLocationDto
    {
        [JsonProperty("countries")]
        public List<string> Countries { get; set; } = new List<string>();
    }
}