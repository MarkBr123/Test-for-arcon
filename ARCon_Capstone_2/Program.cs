using ARCon_Capstone_2.Data;
using ARCon_Capstone_2.Services;
using Microsoft.EntityFrameworkCore;
using ARCon_Capstone_2.Services;
using DinkToPdf;
using DinkToPdf.Contracts;
using QuestPDF.Infrastructure;

var builder = WebApplication.CreateBuilder(args);
QuestPDF.Settings.License = LicenseType.Community;




// Add services to the container.
builder.Services.AddControllersWithViews();
builder.Services.AddDbContext<ARCon_Capstone_2_DbContext>(options =>
    options.UseNpgsql(
        "Host=localhost;Port=5432;Database=airconi_trading_db;Username=postgres;Password=50!20/OMEGA"
    ));
builder.Services.AddScoped<IEmailServices, EmailService>();


//Dink to Pdf
builder.Services.AddSingleton(typeof(IConverter),
    new SynchronizedConverter(new PdfTools()));


var app = builder.Build();


app.UseRouting();
app.UseStaticFiles();
app.MapControllers();
app.UseHttpsRedirection();




app.UseAuthorization();

/* 🔥 REQUIRED FOR [ApiController] */


/* MVC AREA ROUTES */
app.MapControllerRoute(
    name: "areas",
    pattern: "{area:exists}/{controller=Dashboard}/{action=Index}/{id?}"
);

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}"
);

app.Run();