// File: Controllers/AdsController.cs
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using AdDashboard.Api.Services;
using AdDashboard.Api.Dtos;

namespace AdDashboard.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdsController : ControllerBase
    {
        private readonly IFacebookService _svc;
        public AdsController(IFacebookService svc) => _svc = svc;

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateAdsInAdsControllerRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.AdSetId) || req.CreativeIds == null || req.CreativeIds.Count == 0)
                return BadRequest(new { error = "adSetId ve en az bir creativeId gerekli." });

            var (success, adIds, error) = await _svc.CreateAdsAsync(
                req.ProjectId, req.AdSetId, req.CreativeIds
            );
            if (!success) return BadRequest(new { error });
            return Ok(adIds);
        }
    }

    public class CreateAdsInAdsControllerRequest
    {
        public int ProjectId        { get; set; }
        public string AdSetId       { get; set; }
        public List<string> CreativeIds { get; set; }
    }
}