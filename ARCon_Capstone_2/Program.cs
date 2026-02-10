using ARCon_Capstone_2.Data;
using ARCon_Capstone_2.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using DinkToPdf;
using DinkToPdf.Contracts;
using QuestPDF.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// ==========================
// GLOBAL CONFIG
// ==========================
QuestPDF.Settings.License = LicenseType.Community;

// ==========================
// SERVICES (DI CONTAINER)
// ==========================

// MVC (Views + Controllers)
builder.Services.AddControllersWithViews();

// Suppress automatic 400 for APIs (you handle validation manually)
builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.SuppressModelStateInvalidFilter = true;
});

// Database
builder.Services.AddDbContext<ARCon_Capstone_2_DbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")
        ?? "Host=localhost;Port=5432;Database=airconi_trading_db;Username=postgres;Password=50!20/OMEGA"
    )
);

// Session (REQUIRED for auth)
builder.Services.AddDistributedMemoryCache();
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(30);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});

// Application services
builder.Services.AddScoped<IEmailServices, EmailService>();
builder.Services.AddScoped<CloudinaryService>();

// PDF Services
builder.Services.AddSingleton<IConverter>(
    new SynchronizedConverter(new PdfTools())
);

// HTTP Clients
builder.Services.AddHttpClient<IGeocodingService, GeocodingService>(client =>
{
    client.DefaultRequestHeaders.UserAgent.ParseAdd("ARCon-Capstone/1.0");
});

// ==========================
// BUILD APP
// ==========================
var app = builder.Build();

// ==========================
// MIDDLEWARE PIPELINE
// ==========================

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseSession();           // Session BEFORE authorization

app.UseAuthorization();     // You are using session-based auth

// ==========================
// ROUTING
// ==========================

// Areas (Admin, Shop, etc.)
app.MapControllerRoute(
    name: "areas",
    pattern: "{area:exists}/{controller=Dashboard}/{action=Index}/{id?}"
);

// Default MVC route
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}"
);

app.Run();
