using Microsoft.EntityFrameworkCore;

namespace AdDashboard.Api.Data
{
    public class AppDbContext : DbContext
    {
        // Eğer ileride entity’leriniz olacaksa, burada DbSet<T> ekleyebilirsiniz:
        // public DbSet<Campaign> Campaigns { get; set; }

        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            // İhtiyaç varsa burada Fluent API ile yapılandırma yapabilirsiniz.
        }
    }
}