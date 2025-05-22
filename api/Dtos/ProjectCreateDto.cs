// File: Dtos/ProjectCreateDto.cs
namespace AdDashboard.Api.Dtos
{
    public class ProjectCreateDto
    {
        public string Name         { get; set; }
        public string AccessToken  { get; set; }
        public string AdAccountId  { get; set; }
        public string PageId       { get; set; }
    }
}