using Microsoft.EntityFrameworkCore;
using AdDashboard.Api.Services;  // Insight, Campaign, vb. entity’leri barındıran namespace

namespace AdDashboard.Api
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> opts) : base(opts) { }

        public DbSet<Project> Projects { get; set; }
        public DbSet<FacebookAccount> FacebookAccounts { get; set; }
        public DbSet<Video> Videos { get; set; }
        public DbSet<Campaign> Campaigns { get; set; }
        public DbSet<Insight> Insights { get; set; }

protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    base.OnModelCreating(modelBuilder);

    // → FacebookAccount Tablosu
    modelBuilder.Entity<FacebookAccount>(entity =>
    {
        entity.HasKey(e => e.ProjectId);
        entity.Property(e => e.ProjectId)
              .ValueGeneratedNever();      // seed ile ekleyecekseniz otomatik artan olmasın
        entity.Property(e => e.AccessToken)
              .IsRequired();
        entity.Property(e => e.AdAccountId)
              .IsRequired();
        entity.Property(e => e.PageId)
              .IsRequired();
    });

    // → Video Tablosu
    modelBuilder.Entity<Video>(entity =>
    {
        entity.HasKey(e => e.Id);
        entity.Property(e => e.Id)
              .ValueGeneratedOnAdd();
        entity.Property(e => e.FbVideoId)
              .IsRequired();
        entity.Property(e => e.FileName)
              .IsRequired();
        entity.Property(e => e.ThumbnailUrl)
              .IsRequired();
    });

    // → Campaign Tablosu
    modelBuilder.Entity<Campaign>(entity =>
    {
        entity.HasKey(e => e.Id);
        entity.Property(e => e.Id)
              .ValueGeneratedOnAdd();
        entity.Property(e => e.FbCampaignId)
              .IsRequired();
        entity.Property(e => e.Name)
              .IsRequired();
        // JSONb tipi – PostgreSQL için
        entity.Property(e => e.TargetingJson)
              .HasColumnType("jsonb")
              .IsRequired();
    });

    // **Opsiyonel**: Başlangıç verisi (seed)
    modelBuilder.Entity<FacebookAccount>().HasData(
        new FacebookAccount
        {
            ProjectId   = 1,
            AccessToken = "<EAAROnlbpf5MBO1bKqZALZBwEHP3Doiw9VGkXMemdJoxNQDzftPzyRkGT6qKgGrXbWkHRmEirNzZCghiqZB1sVZBUER4MIfDIyGEgn0ktms7dF5C1izaWQHgkHxEfKKtfBdOeKzSjcj5l0cEbGYwpZC3zE2HBJ9OBV2sMKamj2MauIKjU9Hapb5tVj58VLZCSbJ7S4vq6wZDZD>",
            AdAccountId = "act_<act_439470170535222>",
            PageId      = "0987654321"
        }
    );
}

    }

    // Entity sınıfları (aynı dosyada veya ayrı ayrı dosyalarda tanımlanabilir)

    public class Project
    {
        public int Id { get; set; }
        public string Name { get; set; }
    }

    public class FacebookAccount
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public string AdAccountId { get; set; }
        public string AccessToken { get; set; }
        public string PageId { get; set; }
    }

    public class Video
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public string FbVideoId { get; set; }
        public string FileName { get; set; }
        public string ThumbnailUrl  { get; set; }
    }

    public class Campaign
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public string FbCampaignId { get; set; }
        public string Name { get; set; }
        public string TargetingJson { get; set; }
        public bool IsDailyBudget { get; set; }
        public decimal BudgetAmount { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class Insight
    {
        public int Id { get; set; }
        public int CampaignId { get; set; }
        public DateTime Date { get; set; }
        public long Impressions { get; set; }
        public long Reach { get; set; }
        public decimal Spend { get; set; }
        public decimal Cpi { get; set; }
    }
}
