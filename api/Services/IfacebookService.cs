// File: Services/IFacebookService.cs
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using AdDashboard.Api.Dtos;

namespace AdDashboard.Api.Services
{
    // Define the enum for different creative parameter formats
    public enum AdCreativeFormat
    {
        DirectField,    // creative_id 
        ObjectField,    // creative: { creative_id: 'id' }
        CreativeField,  // creative: 'id'
        FacebookDoc     // Format specified in Facebook's documentation
    }

    public interface IFacebookService
    {
        Task<List<CampaignDto>> GetAllCampaignsAsync();
        
        Task<List<AdSetDto>> GetAdSetsAsync(string campaignId = null);
        
        Task<List<InsightDto>> GetCampaignInsightsAsync(string campaignId, string datePreset = "last_7d");
        Task<(bool Success, List<InsightDto> Data, string ErrorMessage)> FetchInsightsForCampaign(string campaignId);

        Task<(bool Success, string CampaignId, string ErrorMessage)> CreateCampaignAsync(
            string name,
            string objective,
            string status,
            List<string> special_ad_categories,
            long? spendCap,
            DateTime? startTime,
            DateTime? stopTime,
            string buyingType);

        Task<(bool Success, string AdSetId, string ErrorMessage)> CreateAdSetAsync(
            string campaignId,
            string name,
            long dailyBudget,
            string status,
            string billingEvent,
            string optimizationGoal,
            TargetingDto targeting,
            DateTime? startTime,
            DateTime? stopTime,
            long? bidAmount = null);

        Task<(bool Success, string VideoId, string ThumbnailUrl, string ErrorMessage)> UploadVideoAsync(
            IFormFile file);

        Task<(bool Success, List<VideoDto> Videos, string ErrorMessage)> ListVideosAsync();

        // Yeni eklenenler:
        Task<(bool Success, List<string> CreativeIds, string ErrorMessage)> CreateAdCreativesAsync(
            int projectId,
            string adSetId,
            List<string> videoIds);

        Task<(bool Success, List<string> AdIds, string ErrorMessage)> CreateAdsAsync(
            int projectId,
            string adSetId,
            List<string> creativeIds,
            string status = "PAUSED",
            string name = null);

        // Test method for ad creation with different formats
        Task<(bool Success, object Result)> TestAdCreationWithFormat(
            string adSetId,
            string creativeId,
            AdCreativeFormat format,
            string adName = null);
    }
}