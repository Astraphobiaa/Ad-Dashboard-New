// File: Program.cs
using AdDashboard.Api.Data;
using AdDashboard.Api.Services;
using Hangfire;
using Hangfire.MemoryStorage;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// 1. CORS politikası: React dev sunucusundan gelen isteklere izin
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactDev", policy =>
        policy.WithOrigins("http://localhost:3000", "http://localhost:3001")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials()
    );
});

// 2. Veritabanı
builder.Services.AddDbContext<AppDbContext>(opts =>
    opts.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// 3. Facebook API HTTP Client & Servis
builder.Services.AddHttpClient<FacebookAdsService>();
builder.Services.AddScoped<IFacebookService, FacebookAdsService>();

// 4. Hangfire
builder.Services.AddHangfire(cfg => cfg.UseMemoryStorage());
builder.Services.AddHangfireServer();

// 5. Controllers & Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "AdDashboard API", Version = "v1" });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

app.UseRouting();
app.UseCors("AllowReactDev");

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "AdDashboard API v1");
    c.RoutePrefix = "swagger";
});

app.UseAuthorization();
app.MapControllers();

// Port ayarı
app.Urls.Add("http://localhost:3001");

app.Run();