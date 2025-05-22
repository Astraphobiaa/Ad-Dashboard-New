// File: Controllers/AdSetsController.cs
using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using AdDashboard.Api.Services;
using AdDashboard.Api.Dtos;
using AdDashboard.Api.Models;
using Newtonsoft.Json;

namespace AdDashboard.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdSetsController : ControllerBase
    {
        private readonly IFacebookService _svc;
        public AdSetsController(IFacebookService svc) => _svc = svc;

        [HttpPost]
        public async Task<IActionResult> CreateAdSet([FromBody] CreateAdSetRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.CampaignId))
                return BadRequest(new { error = "campaignId is required." });

            var (success, id, error) = await _svc.CreateAdSetAsync(
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
            if (!success) return BadRequest(new { error });

            return Ok(new { id });
        }

        [HttpPost("{adSetId}/ads")]
        public async Task<IActionResult> CreateAdsForAdSet(string adSetId, [FromBody] CreateAdsForAdSetRequest req)
        {
            Console.WriteLine($"POST /adsets/{adSetId}/ads endpoint called with payload: {JsonConvert.SerializeObject(req)}");
            Console.WriteLine($"Ad Name: '{req.Name}', Video IDs: {string.Join(", ", req.VideoIds)}");
            
            if (string.IsNullOrWhiteSpace(adSetId))
                return BadRequest(new { error = "adSetId is required in the URL path." });
                
            // Validate request body
            if (req == null)
            {
                Console.WriteLine("Request body is null");
                return BadRequest(new { error = "Request body cannot be null." });
            }
            
            // Validate ad name
            if (string.IsNullOrWhiteSpace(req.Name))
            {
                Console.WriteLine("Ad name is empty");
                return BadRequest(new { error = "Ad name is required." });
            }
            
            // Initialize empty collections if they're null to avoid NRE
            req.VideoIds ??= new List<string>();
            req.CreativeIds ??= new List<string>();
            
            if (req.VideoIds.Count == 0 && req.CreativeIds.Count == 0)
            {
                Console.WriteLine("Neither videoIds nor creativeIds provided");
                return BadRequest(new { error = "Either videoIds or creativeIds must be provided." });
            }

            // IMPORTANT: Use the real Ad Set ID provided by the user
            // Don't replace with mock unless necessary
            
            // Store the real adSetId to use
            string realAdSetId = adSetId;
            Console.WriteLine($"Using actual Ad Set ID from request: {realAdSetId}");
            
            try
            {
                if (req.VideoIds.Count > 0)
                {
                    Console.WriteLine($"Creating creatives from {req.VideoIds.Count} videos");
                    // Create ad creatives from videos - USE THE REAL ID
                    var (creativeSuccess, creativeIds, creativeError) = await _svc.CreateAdCreativesAsync(
                        req.ProjectId ?? 1, // Use provided projectId or default to 1
                        realAdSetId, // Use the real ID
                        req.VideoIds
                    );

                    if (!creativeSuccess)
                    {
                        Console.WriteLine($"Failed to create creatives: {creativeError}");
                        return BadRequest(new { error = creativeError });
                    }

                    Console.WriteLine($"Successfully created {creativeIds.Count} creatives");
                    // Create ads with the new creatives - USE THE REAL ID
                    var (adSuccess, adIds, adError) = await _svc.CreateAdsAsync(
                        req.ProjectId ?? 1,
                        realAdSetId, // Use the real ID
                        creativeIds,
                        req.Status ?? "PAUSED",
                        req.Name
                    );

                    if (!adSuccess)
                    {
                        Console.WriteLine($"Failed to create ads: {adError}");
                        
                        // If using the real Ad Set ID failed, try once with a mock ID
                        // but only for development/testing purposes
                        if (Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development")
                        {
                            Console.WriteLine("Falling back to mock ad creation for testing...");
                            var mockAdIds = new List<string> { $"mock_ad_{DateTime.Now.Ticks}_{req.Name}" };
                            return Ok(new { adIds = mockAdIds, creativeIds, isMock = true });
                        }
                        
                        return BadRequest(new { error = adError });
                    }

                    Console.WriteLine($"Successfully created {adIds.Count} ads");
                    return Ok(new { adIds, creativeIds, isMock = false });
                }
                else if (req.CreativeIds.Count > 0)
                {
                    Console.WriteLine($"Creating ads with {req.CreativeIds.Count} existing creatives");
                    // Create ads with existing creatives - USE THE REAL ID
                    var (adSuccess, adIds, adError) = await _svc.CreateAdsAsync(
                        req.ProjectId ?? 1,
                        realAdSetId, // Use the real ID
                        req.CreativeIds,
                        req.Status ?? "PAUSED",
                        req.Name
                    );

                    if (!adSuccess)
                    {
                        Console.WriteLine($"Failed to create ads: {adError}");
                        
                        // If using the real Ad Set ID failed, try once with a mock ID
                        // but only for development/testing purposes
                        if (Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development")
                        {
                            Console.WriteLine("Falling back to mock ad creation for testing...");
                            var mockAdIds = new List<string> { $"mock_ad_{DateTime.Now.Ticks}_{req.Name}" };
                            return Ok(new { adIds = mockAdIds, creativeIds = req.CreativeIds, isMock = true });
                        }
                        
                        return BadRequest(new { error = adError });
                    }

                    Console.WriteLine($"Successfully created {adIds.Count} ads");
                    return Ok(new { adIds, isMock = false });
                }
                else
                {
                    // This shouldn't happen due to earlier validation, but just in case
                    return BadRequest(new { error = "Either videoIds or creativeIds must be provided." });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception in CreateAdsForAdSet: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return StatusCode(500, new { error = $"Server error: {ex.Message}" });
            }
        }

        [HttpGet("test-ad-creation")]
        public async Task<IActionResult> TestAdCreation(
            [FromQuery] string creativeId, 
            [FromQuery] string adSetId = "23852515001",
            [FromQuery] string adName = "Test Ad")
        {
            // Default to a mock adset ID if none provided
            adSetId = string.IsNullOrEmpty(adSetId) ? "23852515001" : adSetId;
            
            // Default to a creative ID if none provided
            creativeId = string.IsNullOrEmpty(creativeId) ? "1388803625495445" : creativeId;
            
            // Default ad name
            adName = string.IsNullOrEmpty(adName) ? "Test Ad Creation" : adName;
            
            Console.WriteLine($"Testing ad creation with adSetId: {adSetId}, creativeId: {creativeId}, name: '{adName}'");
            
            // Try multiple formats and gather all results
            var results = new Dictionary<string, object>();
            
            try 
            {
                // Attempt Method 1: Using direct creative_id field
                Console.WriteLine("Method 1: Direct creative_id parameter");
                var (success1, result1) = await _svc.TestAdCreationWithFormat(
                    adSetId, 
                    creativeId, 
                    AdCreativeFormat.DirectField,
                    adName
                );
                results["method1"] = new { success = success1, result = result1 };
                
                // Attempt Method 2: Using creative object field 
                Console.WriteLine("Method 2: Creative object parameter");
                var (success2, result2) = await _svc.TestAdCreationWithFormat(
                    adSetId, 
                    creativeId, 
                    AdCreativeFormat.ObjectField,
                    adName
                );
                results["method2"] = new { success = success2, result = result2 };
                
                // Attempt Method 3: Using only creative field (no _id)
                Console.WriteLine("Method 3: Creative parameter only");
                var (success3, result3) = await _svc.TestAdCreationWithFormat(
                    adSetId, 
                    creativeId, 
                    AdCreativeFormat.CreativeField,
                    adName
                );
                results["method3"] = new { success = success3, result = result3 };
                
                // Attempt Method 4: Using Facebook's documented format
                Console.WriteLine("Method 4: Facebook documentation format");
                var (success4, result4) = await _svc.TestAdCreationWithFormat(
                    adSetId, 
                    creativeId, 
                    AdCreativeFormat.FacebookDoc,
                    adName
                );
                results["method4"] = new { success = success4, result = result4 };
                
                return Ok(new { 
                    message = "Ad creation test completed", 
                    adSetId,
                    creativeId,
                    adName,
                    results 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Error testing ad creation: {ex.Message}" });
            }
        }
    }
}
