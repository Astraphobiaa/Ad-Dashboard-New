// File: Controllers/CampaignsController.cs
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using AdDashboard.Api.Services;
using AdDashboard.Api.Dtos;
using Newtonsoft.Json.Linq;
using Microsoft.Extensions.Configuration;
using System.Net.Http;
using Newtonsoft.Json;

namespace AdDashboard.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CampaignsController : ControllerBase
    {
        private readonly IFacebookService _svc;
        private readonly IConfiguration _config;
        public CampaignsController(IFacebookService svc, IConfiguration config)
        {
            _svc = svc;
            _config = config;
        }


        [HttpGet("videos")]
        public async Task<IActionResult> GetVideos([FromQuery] string search = null)
        {
            var (success, videos, error) = await _svc.ListVideosAsync();
            if (!success)
                return BadRequest(new { error });

            // İsimle filtreleme
            if (!string.IsNullOrWhiteSpace(search))
            {
                videos = videos
                    .Where(v => v.Title.IndexOf(search, StringComparison.OrdinalIgnoreCase) >= 0)
                    .ToList();
            }

            return Ok(videos);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                Console.WriteLine("GET /campaigns endpoint called");
                
                // Get real campaigns from Facebook
                var campaigns = await _svc.GetAllCampaignsAsync();
                Console.WriteLine($"Fetched {campaigns.Count} real campaigns from Facebook");
                
                // If we're in development mode and no campaigns were found,
                // return some mock data as a fallback
                if (campaigns.Count == 0 && Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development")
                {
                    Console.WriteLine("No campaigns found from Facebook API, returning mock data as fallback");
                    var mockCampaigns = new List<object>
                    {
                        new {
                            id = "2385251001",
                            name = "Campaign 1 (Mock)",
                            status = "ACTIVE"
                        },
                        new {
                            id = "2385251002",
                            name = "Campaign 2 (Mock)",
                            status = "PAUSED"
                        }
                    };
                    
                    return Ok(mockCampaigns);
                }
                
                return Ok(campaigns);
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"GetAllCampaignsAsync error: {ex}");
                
                // In case of error, return mock data if in development mode
                if (Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development")
                {
                    Console.WriteLine("Error occurred, returning mock data as fallback");
                    var mockCampaigns = new List<object>
                    {
                        new {
                            id = "2385251001",
                            name = "Campaign 1 (Mock - Error Fallback)",
                            status = "ACTIVE"
                        },
                        new {
                            id = "2385251002",
                            name = "Campaign 2 (Mock - Error Fallback)",
                            status = "PAUSED"
                        }
                    };
                    
                    return Ok(mockCampaigns);
                }
                
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("ping")]
        public IActionResult Ping([FromBody] object data)
        {
            Console.WriteLine($"Ping received with data: {data}");
            return Ok(new { message = "Pong", timestamp = DateTime.UtcNow });
        }

        [HttpGet("{id}/insights")]
        public async Task<IActionResult> GetCampaignInsights(string id, [FromQuery] string datePreset = "last_7d")
        {
            try
            {
                var insights = await _svc.GetCampaignInsightsAsync(id, datePreset);
                return Ok(insights);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("adsets")]
        public async Task<IActionResult> GetAdSets()
        {
            try
            {
                Console.WriteLine("GET /campaigns/adsets endpoint called");
                
                // Get real ad sets from Facebook API
                var adSets = await _svc.GetAdSetsAsync();
                Console.WriteLine($"Fetched {adSets.Count} real ad sets from Facebook");
                
                // If in development mode and no ad sets found, return mock data
                if (adSets.Count == 0 && Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development")
                {
                    Console.WriteLine("No ad sets found from Facebook API, returning mock data as fallback");
                    var mockAdSets = new List<object>
                    {
                        new {
                            id = "23852515001",
                            name = "Mock Ad Set 1",
                            status = "ACTIVE",
                            dailyBudget = 1000,
                            campaignId = "2385251001"
                        },
                        new {
                            id = "23852515002",
                            name = "Mock Ad Set 2",
                            status = "PAUSED",
                            dailyBudget = 1500,
                            campaignId = "2385251001"
                        },
                        new {
                            id = "23852515003",
                            name = "Mock Ad Set 3",
                            status = "ACTIVE",
                            dailyBudget = 2000,
                            campaignId = "2385251002"
                        },
                        new {
                            id = "23852515004",
                            name = "Mock Ad Set 4",
                            status = "PAUSED",
                            dailyBudget = 2500,
                            campaignId = "2385251002"
                        }
                    };
                    
                    return Ok(mockAdSets);
                }
                
                return Ok(adSets);
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"GetAdSets error: {ex}");
                return StatusCode(500, new { error = ex.Message });
            }
        }
        
        [HttpGet("{campaignId}/adsets")]
        public async Task<IActionResult> GetAdSetsForCampaign(string campaignId)
        {
            try
            {
                Console.WriteLine($"GET /campaigns/{campaignId}/adsets endpoint called");
                
                // Get real ad sets for the specified campaign from Facebook API
                var adSets = await _svc.GetAdSetsAsync(campaignId);
                Console.WriteLine($"Fetched {adSets.Count} real ad sets for campaign {campaignId} from Facebook");
                
                // If in development mode and no ad sets found, return mock data
                if (adSets.Count == 0 && Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development")
                {
                    Console.WriteLine($"No ad sets found for campaign {campaignId} from Facebook API, returning mock data as fallback");
                    var mockAdSets = new List<object>
                    {
                        new {
                            id = $"adset_{campaignId}_001",
                            name = $"Mock Ad Set 1 for Campaign {campaignId}",
                            status = "ACTIVE",
                            dailyBudget = 1000,
                            campaignId = campaignId
                        },
                        new {
                            id = $"adset_{campaignId}_002",
                            name = $"Mock Ad Set 2 for Campaign {campaignId}",
                            status = "PAUSED",
                            dailyBudget = 1500,
                            campaignId = campaignId
                        }
                    };
                    
                    return Ok(mockAdSets);
                }
                
                return Ok(adSets);
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"GetAdSetsForCampaign error: {ex}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateCampaignRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Name))
                return BadRequest(new { error = "Campaign name is required." });

            try
            {
                Console.WriteLine($"Creating campaign: {req.Name}");
                Console.WriteLine($"Special Ad Categories: {string.Join(", ", req.special_ad_categories ?? new List<string>())}");
                Console.WriteLine($"Selected Video IDs: {string.Join(", ", req.SelectedVideoIds ?? new List<string>())}");
                Console.WriteLine($"Objective: {req.Objective}");

                // Zorla NONE olarak ayarlıyoruz
                req.special_ad_categories = new List<string> { "NONE" };

                // 1. Kampanya oluştur
                var (success, campaignId, error) = await _svc.CreateCampaignAsync(
                    req.Name,
                    req.Objective,
                    req.Status,
                    req.special_ad_categories,
                    req.SpendCap,
                    req.StartTime,
                    req.StopTime,
                    req.BuyingType
                );
                if (!success)
                {
                    Console.WriteLine($"Campaign creation failed: {error}");
                    return BadRequest(new { error });
                }
                
                Console.WriteLine($"Campaign created successfully with ID: {campaignId}");

                // Check if we're in simplified mode (no AdSet creation)
                // If AdSetName is not provided or empty, we only create a campaign
                if (string.IsNullOrWhiteSpace(req.AdSetName))
                {
                    return Ok(new { campaignId });
                }

                // If we get here, we're in the full mode where we create both campaign and ad set
                
                // 2. Ad Set oluştur
                var adSetName = req.AdSetName ?? $"{req.Name} Ad Set";
                Console.WriteLine($"Creating Ad Set with name: {adSetName}");
                
                // Initialize a default targeting if none provided
                var targeting = req.Targeting ?? new TargetingDto
                {
                    GeoLocations = new GeoLocationDto { Countries = new List<string> { "US" } },
                    AgeMin = 18,
                    AgeMax = 65
                };
                
                var (adSetSuccess, adSetId, adSetError) = await _svc.CreateAdSetAsync(
                    campaignId,
                    adSetName,
                    req.DailyBudget,
                    req.Status,
                    req.BillingEvent,
                    req.OptimizationGoal,
                    targeting,
                    req.StartTime,
                    req.StopTime,
                    req.BidAmount
                );
                if (!adSetSuccess)
                {
                    Console.WriteLine($"Ad Set creation failed: {adSetError}");
                    return BadRequest(new { error = adSetError });
                }
                
                Console.WriteLine($"Ad Set created successfully with ID: {adSetId}");

                // 3. Seçilen videolardan creative'ler oluştur
                if (req.SelectedVideoIds != null && req.SelectedVideoIds.Any())
                {
                    Console.WriteLine($"Creating Ad Creatives for {req.SelectedVideoIds.Count} videos");
                    var (creativeSuccess, creativeIds, creativeError) = await _svc.CreateAdCreativesAsync(
                        1, // projectId - şimdilik sabit
                        adSetId,
                        req.SelectedVideoIds
                    );
                    if (!creativeSuccess)
                    {
                        Console.WriteLine($"Ad Creative creation failed: {creativeError}");
                        return BadRequest(new { error = creativeError });
                    }
                    
                    Console.WriteLine($"Ad Creatives created successfully: {string.Join(", ", creativeIds)}");

                    // 4. Reklamları oluştur
                    Console.WriteLine($"Creating Ads for {creativeIds.Count} creatives");
                    var (adSuccess, adIds, adError) = await _svc.CreateAdsAsync(
                        1, // projectId - şimdilik sabit
                        adSetId,
                        creativeIds
                    );
                    if (!adSuccess)
                    {
                        Console.WriteLine($"Ad creation failed: {adError}");
                        return BadRequest(new { error = adError });
                    }
                    
                    Console.WriteLine($"Ads created successfully: {string.Join(", ", adIds)}");

                    return Ok(new { 
                        campaignId, 
                        adSetId, 
                        creativeIds, 
                        adIds 
                    });
                }

                return Ok(new { campaignId, adSetId });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in Create Campaign: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("adsets")]
        public async Task<IActionResult> CreateAdSet([FromBody] CreateAdSetWithVideosRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.CampaignId))
                return BadRequest(new { error = "Campaign ID is required." });

            if (string.IsNullOrWhiteSpace(req.Name))
                return BadRequest(new { error = "Ad Set name is required." });

            try
            {
                Console.WriteLine($"Creating Ad Set: {req.Name} for Campaign: {req.CampaignId}");
                Console.WriteLine($"Selected Video IDs: {string.Join(", ", req.SelectedVideoIds ?? new List<string>())}");
                Console.WriteLine($"Daily Budget: {req.DailyBudget} USD");
                Console.WriteLine($"Bid Amount: {req.BidAmount} USD");
                
                // 1. Ad Set oluştur
                var (adSetSuccess, adSetId, adSetError) = await _svc.CreateAdSetAsync(
                    req.CampaignId,
                    req.Name,
                    req.DailyBudget,
                    req.Status,
                    req.BillingEvent,
                    req.OptimizationGoal,
                    req.Targeting,
                    req.StartTime,
                    req.StopTime,
                    req.BidAmount
                );
                if (!adSetSuccess)
                {
                    Console.WriteLine($"Ad Set creation failed: {adSetError}");
                    return BadRequest(new { error = adSetError });
                }
                
                Console.WriteLine($"Ad Set created successfully with ID: {adSetId}");

                // 2. Seçilen videolardan creative'ler oluştur
                if (req.SelectedVideoIds != null && req.SelectedVideoIds.Any())
                {
                    Console.WriteLine($"Creating Ad Creatives for {req.SelectedVideoIds.Count} videos");
                    var (creativeSuccess, creativeIds, creativeError) = await _svc.CreateAdCreativesAsync(
                        1, // projectId - şimdilik sabit
                        adSetId,
                        req.SelectedVideoIds
                    );
                    if (!creativeSuccess)
                    {
                        Console.WriteLine($"Ad Creative creation failed: {creativeError}");
                        return BadRequest(new { error = creativeError });
                    }
                    
                    Console.WriteLine($"Ad Creatives created successfully: {string.Join(", ", creativeIds)}");

                    // 3. Reklamları oluştur
                    Console.WriteLine($"Creating Ads for {creativeIds.Count} creatives");
                    var (adSuccess, adIds, adError) = await _svc.CreateAdsAsync(
                        1, // projectId - şimdilik sabit
                        adSetId,
                        creativeIds
                    );
                    if (!adSuccess)
                    {
                        Console.WriteLine($"Ad creation failed: {adError}");
                        return BadRequest(new { error = adError });
                    }
                    
                    Console.WriteLine($"Ads created successfully: {string.Join(", ", adIds)}");

                    return Ok(new { 
                        adSetId, 
                        creativeIds, 
                        adIds 
                    });
                }

                return Ok(new { adSetId });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in Create Ad Set: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("test-facebook")]
        public async Task<IActionResult> TestFacebook()
        {
            try
            {
                var apiVersion = "v18.0"; // Match your FacebookAdsService version
                var accessToken = _config["Facebook:AccessToken"];
                var adAccountId = _config["Facebook:AdAccountId"];
                
                using var http = new HttpClient();
                http.BaseAddress = new Uri($"https://graph.facebook.com/{apiVersion}/");
                
                // First try a simple GET request to test the token
                var testUrl = $"me?fields=id,name&access_token={accessToken}";
                Console.WriteLine($"Testing Facebook API with URL: {http.BaseAddress}{testUrl}");
                
                var resp = await http.GetAsync(testUrl);
                var content = await resp.Content.ReadAsStringAsync();
                
                Console.WriteLine($"Response status: {resp.StatusCode}");
                Console.WriteLine($"Response content: {content}");
                
                if (!resp.IsSuccessStatusCode)
                {
                    return BadRequest(new { error = "Facebook API error", details = content });
                }
                
                // If that worked, try the ad account
                if (!string.IsNullOrEmpty(adAccountId))
                {
                    var adAccountUrl = $"{adAccountId}?fields=name,account_status&access_token={accessToken}";
                    Console.WriteLine($"Testing Ad Account: {http.BaseAddress}{adAccountUrl}");
                    
                    var adResp = await http.GetAsync(adAccountUrl);
                    var adContent = await adResp.Content.ReadAsStringAsync();
                    
                    Console.WriteLine($"Ad Account response status: {adResp.StatusCode}");
                    Console.WriteLine($"Ad Account response content: {adContent}");
                    
                    if (!adResp.IsSuccessStatusCode)
                    {
                        return BadRequest(new { error = "Facebook Ad Account error", details = adContent });
                    }
                    
                    return Ok(new { 
                        message = "Facebook API test successful", 
                        meData = Newtonsoft.Json.JsonConvert.DeserializeObject(content),
                        accountData = Newtonsoft.Json.JsonConvert.DeserializeObject(adContent)
                    });
                }
                
                return Ok(new { 
                    message = "Facebook API test successful", 
                    data = Newtonsoft.Json.JsonConvert.DeserializeObject(content) 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("validate-campaign-creation")]
        public async Task<IActionResult> ValidateCampaignCreation()
        {
            try
            {
                var apiVersion = "v18.0"; // Match your FacebookAdsService version
                var accessToken = _config["Facebook:AccessToken"];
                var adAccountId = _config["Facebook:AdAccountId"];
                
                if (string.IsNullOrEmpty(accessToken) || string.IsNullOrEmpty(adAccountId))
                {
                    return BadRequest(new { error = "Missing Facebook API credentials in configuration" });
                }
                
                using var http = new HttpClient();
                http.BaseAddress = new Uri($"https://graph.facebook.com/{apiVersion}/");
                
                // Prepare a very minimal campaign payload
                var testCampaign = new Dictionary<string, string>
                {
                    ["name"] = $"Test Campaign {DateTime.UtcNow:yyyyMMddHHmmss}",
                    ["objective"] = "OUTCOME_AWARENESS",
                    ["status"] = "PAUSED",
                    ["special_ad_categories"] = "[\"NONE\"]",
                    ["access_token"] = accessToken
                };
                
                Console.WriteLine($"Testing campaign creation with minimal payload: {Newtonsoft.Json.JsonConvert.SerializeObject(testCampaign)}");
                
                // First try a direct POST to create a test campaign
                var resp = await http.PostAsync($"{adAccountId}/campaigns", new FormUrlEncodedContent(testCampaign));
                var content = await resp.Content.ReadAsStringAsync();
                
                Console.WriteLine($"Response status: {resp.StatusCode}");
                Console.WriteLine($"Response content: {content}");
                
                var validationResults = new Dictionary<string, object>
                {
                    ["status"] = resp.StatusCode.ToString(),
                    ["isSuccess"] = resp.IsSuccessStatusCode,
                    ["response"] = Newtonsoft.Json.JsonConvert.DeserializeObject(content)
                };
                
                // Try with JSON format too
                var jsonPayload = new Dictionary<string, object>
                {
                    ["name"] = $"Test Campaign JSON {DateTime.UtcNow:yyyyMMddHHmmss}",
                    ["objective"] = "OUTCOME_AWARENESS",
                    ["status"] = "PAUSED",
                    ["special_ad_categories"] = new List<string> { "NONE" },
                    ["access_token"] = accessToken
                };
                
                var jsonContent = new StringContent(
                    Newtonsoft.Json.JsonConvert.SerializeObject(jsonPayload), 
                    System.Text.Encoding.UTF8, 
                    "application/json"
                );
                
                Console.WriteLine($"Testing with JSON: {Newtonsoft.Json.JsonConvert.SerializeObject(jsonPayload)}");
                
                var jsonResp = await http.PostAsync($"{adAccountId}/campaigns", jsonContent);
                var jsonRespContent = await jsonResp.Content.ReadAsStringAsync();
                
                Console.WriteLine($"JSON response status: {jsonResp.StatusCode}");
                Console.WriteLine($"JSON response content: {jsonRespContent}");
                
                validationResults["jsonStatus"] = jsonResp.StatusCode.ToString();
                validationResults["jsonIsSuccess"] = jsonResp.IsSuccessStatusCode;
                validationResults["jsonResponse"] = Newtonsoft.Json.JsonConvert.DeserializeObject(jsonRespContent);
                
                return Ok(new
                {
                    message = "Campaign creation validation completed",
                    results = validationResults
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("test-credentials")]
        public async Task<IActionResult> TestFacebookCredentials([FromQuery] string shortLivedToken = null)
        {
            try
            {
                var apiVersion = "v18.0"; // Match your FacebookAdsService version
                var appId = _config["Facebook:AppId"];
                var appSecret = _config["Facebook:AppSecret"];
                var accessToken = shortLivedToken ?? _config["Facebook:AccessToken"];
                var adAccountId = _config["Facebook:AdAccountId"];
                
                if (string.IsNullOrEmpty(appId) || string.IsNullOrEmpty(appSecret))
                {
                    return BadRequest(new { error = "Missing Facebook AppId or AppSecret in configuration" });
                }
                
                using var http = new HttpClient();
                http.BaseAddress = new Uri($"https://graph.facebook.com/{apiVersion}/");
                
                var results = new Dictionary<string, object>();
                
                // 1. Test the App ID and App Secret
                results["appCredentials"] = new { appId, appSecretProvided = !string.IsNullOrEmpty(appSecret) };
                
                // 2. Try to exchange a short-lived token for a long-lived one if provided
                if (!string.IsNullOrEmpty(shortLivedToken))
                {
                    Console.WriteLine($"Attempting to exchange short-lived token for long-lived token");
                    var exchangeUrl = $"oauth/access_token?grant_type=fb_exchange_token&client_id={appId}&client_secret={appSecret}&fb_exchange_token={shortLivedToken}";
                    
                    var exchangeResp = await http.GetAsync(exchangeUrl);
                    var exchangeContent = await exchangeResp.Content.ReadAsStringAsync();
                    
                    if (exchangeResp.IsSuccessStatusCode)
                    {
                        var tokenData = JsonConvert.DeserializeObject<Dictionary<string, string>>(exchangeContent);
                        results["longLivedToken"] = new { 
                            success = true,
                            token = tokenData["access_token"],
                            tokenType = tokenData.ContainsKey("token_type") ? tokenData["token_type"] : "user",
                            expiresIn = tokenData.ContainsKey("expires_in") ? tokenData["expires_in"] : "unknown"
                        };
                        
                        // Use this long-lived token for subsequent tests
                        accessToken = tokenData["access_token"];
                    }
                    else
                    {
                        results["longLivedToken"] = new { 
                            success = false, 
                            error = "Failed to exchange for long-lived token",
                            details = exchangeContent
                        };
                    }
                }
                
                // 3. Test the current access token (short or long-lived)
                var testUrl = $"me?fields=id,name&access_token={accessToken}";
                Console.WriteLine($"Testing access token with URL: {http.BaseAddress}{testUrl}");
                
                var resp = await http.GetAsync(testUrl);
                var content = await resp.Content.ReadAsStringAsync();
                
                results["accessToken"] = new {
                    success = resp.IsSuccessStatusCode,
                    response = JsonConvert.DeserializeObject(content),
                    token = accessToken.Substring(0, 10) + "..." // Only show part of the token for security
                };
                
                // 4. If we have an ad account ID, test it too
                if (!string.IsNullOrEmpty(adAccountId))
                {
                    var adAccountUrl = $"{adAccountId}?fields=name,account_status,business_name,owner&access_token={accessToken}";
                    Console.WriteLine($"Testing Ad Account: {http.BaseAddress}{adAccountUrl}");
                    
                    var adResp = await http.GetAsync(adAccountUrl);
                    var adContent = await adResp.Content.ReadAsStringAsync();
                    
                    results["adAccount"] = new {
                        success = adResp.IsSuccessStatusCode,
                        response = JsonConvert.DeserializeObject(adContent)
                    };
                }
                
                return Ok(new { 
                    message = "Facebook API credential test complete", 
                    results = results
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error testing Facebook credentials: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }

    public class CreateCampaignRequest
    {
        // Campaign properties - required
        public string Name { get; set; }
        public string Objective { get; set; } = "OUTCOME_AWARENESS";
        public string Status { get; set; } = "PAUSED";
        public List<string> special_ad_categories { get; set; } = new List<string> { "NONE" };
        public long? SpendCap { get; set; }
        public DateTime? StartTime { get; set; }
        public DateTime? StopTime { get; set; }
        public string BuyingType { get; set; } = "AUCTION";
        
        // AdSet properties - optional
        public string AdSetName { get; set; }
        public long DailyBudget { get; set; } = 1000;
        public string BillingEvent { get; set; } = "IMPRESSIONS";
        public string OptimizationGoal { get; set; } = "IMPRESSIONS";
        public string BidStrategy { get; set; } = "LOWEST_COST_WITH_BID_CAP";
        public long? BidAmount { get; set; } = 100;
        public double? MinimumRoasTarget { get; set; }
        public TargetingDto Targeting { get; set; }
        public List<string> SelectedVideoIds { get; set; } = new List<string>();
    }
}
