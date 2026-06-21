using ARCon_Capstone_2.Data;
using ARCon_Capstone_2.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using DinkToPdf;
using DinkToPdf.Contracts;
using QuestPDF.Infrastructure;
using CloudinaryDotNet;
using ARCon_Capstone_2.Helpers;

var builder = WebApplication.CreateBuilder(args);

QuestPDF.Settings.License = LicenseType.Community;

builder.Services.AddControllersWithViews();

builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.SuppressModelStateInvalidFilter = true;
});

builder.Services.AddDbContext<ARCon_Capstone_2_DbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")
        ?? "Host=dpg-d8dek799rddc739sb960-a.singapore-postgres.render.com;Port=5432;Database=arcon_db_tqoz;Username=arcon_db_tqoz_user;Password=LKASXX12Ui003pO4U3yGLOiDls7wv;SSL Mode=Require;Trust Server Certificate=true"
    )
);

builder.Services.AddScoped<PayMongoService>();

System.Diagnostics.Activity.DefaultIdFormat = System.Diagnostics.ActivityIdFormat.W3C;
System.Diagnostics.Activity.ForceDefaultIdFormat = true;

builder.Services.AddSingleton(provider =>
{
    var config = builder.Configuration;

    var account = new Account(
        config["Cloudinary:CloudName"],
        config["Cloudinary:ApiKey"],
        config["Cloudinary:ApiSecret"]
    );

    return new Cloudinary(account);
});

builder.Services.AddScoped<
    INotificationService,
    NotificationService>();

builder.Services.AddDistributedMemoryCache();
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(30);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});

builder.Services.AddScoped<IEmailServices, EmailService>();
builder.Services.AddScoped<CloudinaryService>();

builder.Services.AddSingleton<IConverter>(
    new SynchronizedConverter(new PdfTools())
);

builder.Services.AddHttpClient<IGeocodingService, GeocodingService>(client =>
{
    client.DefaultRequestHeaders.UserAgent.ParseAdd("ARCon-Capstone/1.0");
});

builder.Services.Configure<PayMongoSettings>(
    builder.Configuration.GetSection("PayMongo")
);

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseSession();
app.UseAuthorization();

app.MapControllers();

app.MapControllerRoute(
    name: "areas",
    pattern: "{area:exists}/{controller=Dashboard}/{action=Index}/{id?}"
);

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}"
);
/*var port = Environment.GetEnvironmentVariable("PORT") ?? "5000";
app.Urls.Add($"http://*:{port}");*/

app.Run();
