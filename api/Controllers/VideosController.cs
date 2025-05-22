// File: Controllers/VideosController.cs
using System.Collections.Generic;
using System.Threading.Tasks;
using AdDashboard.Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace AdDashboard.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VideosController : ControllerBase
    {
        private readonly FacebookAdsService _facebookService;

        public VideosController(FacebookAdsService facebookService)
            => _facebookService = facebookService;

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _facebookService.ListVideosAsync();
            if (!result.Success)
                return BadRequest(new { error = result.ErrorMessage });

            return Ok(result.Videos);
        }

        [HttpPost("upload")]
        public async Task<IActionResult> Upload([FromForm] IFormFileCollection files)
        {
            var responses = new List<object>();

            foreach (var file in files)
            {
                var res = await _facebookService.UploadVideoAsync(file);
                if (!res.Success)
                    responses.Add(new { file = file.FileName, success = false, error = res.ErrorMessage });
                else
                    responses.Add(new { file = file.FileName, success = true, videoId = res.VideoId, thumbnail = res.ThumbnailUrl });
            }

            return Ok(responses);
        }
    }
}