// File: Controllers/AdCreativesController.cs
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using AdDashboard.Api.Services;
using AdDashboard.Api.Dtos;

namespace AdDashboard.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdCreativesController : ControllerBase
    {
        private readonly IFacebookService _svc;
        public AdCreativesController(IFacebookService svc) => _svc = svc;

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateAdCreativesRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.AdSetId) || req.VideoIds == null || req.VideoIds.Count == 0)
                return BadRequest(new { error = "adSetId ve en az bir videoId gerekli." });

            var (success, creativeIds, error) = await _svc.CreateAdCreativesAsync(
                req.ProjectId, req.AdSetId, req.VideoIds
            );
            if (!success) return BadRequest(new { error });
            return Ok(creativeIds);
        }
    }

    public class CreateAdCreativesRequest
    {
        public int ProjectId      { get; set; }
        public string AdSetId     { get; set; }
        public List<string> VideoIds { get; set; }
    }
}