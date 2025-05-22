// File: Controllers/ProjectsController.cs
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using AdDashboard.Api;
using AdDashboard.Api.Dtos;

namespace AdDashboard.Api.Controllers
{
    [ApiController]
    [Route("api/projects")]
    public class ProjectsController : ControllerBase
    {
        private readonly AppDbContext _db;
        public ProjectsController(AppDbContext db) => _db = db;

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ProjectCreateDto dto)
        {
            // 1) Project tablosuna ekle
            var project = new Project { Name = dto.Name };
            _db.Projects.Add(project);
            await _db.SaveChangesAsync();

            // 2) FacebookAccount tablosuna ekle
            _db.FacebookAccounts.Add(new FacebookAccount
            {
                ProjectId    = project.Id,
                AccessToken  = dto.AccessToken,
                AdAccountId  = dto.AdAccountId,
                PageId       = dto.PageId
            });
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(Get), new { projectId = project.Id }, new { project.Id });
        }

        [HttpGet("{projectId}")]
        public async Task<IActionResult> Get(int projectId)
        {
            var project = await _db.Projects.FindAsync(projectId);
            if (project == null) return NotFound();
            return Ok(project);
        }
    }
}