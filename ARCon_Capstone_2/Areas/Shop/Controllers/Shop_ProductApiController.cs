using ARCon_Capstone_2.Data;
using ARCon_Capstone_2.DTOs;
using ARCon_Capstone_2.Models;
using ARCon_Capstone_2.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ARCon_Capstone_2.Services;

namespace ARCon_Capstone_2.Areas.Shop.Controllers;


[Route ("api/shop/home_product_cards")]
public class Shop_ProductApiController: ControllerBase
{
    private readonly ARCon_Capstone_2_DbContext _context;

    public Shop_ProductApiController (ARCon_Capstone_2_DbContext context)
    {
        _context = context;
    }


    //this will get the (10 Products) product cards in the homepage
    [HttpGet]
    public async Task<IActionResult> GetProductCard()   
    {
        var products = await _context.products
            .Where(p => p.status == "ACTIVE")
            .Select(p => new Shop_GetProductCardDto
            {
                Id = p.id,
                BrandName = p.manufacturer.brand_name,
                ProductSeries = p.product_series,
                ProductModel = p.product_model,
                ActualSellingPrice = p.actual_selling_price,
                HorsePower = p.technical_specifications
                    .Where(ts => ts.key.keyname == "Horsepower (HP)")
                    .Select(ts => ts.value)
                    .FirstOrDefault(),



                AvailableStock = p.inventories
                .Count(i => i.status == "GOOD_STOCK"),

                InStock = p.inventories
                .Any(i => i.status == "GOOD_STOCK"),

                PrimaryImageUrl = p.products_media
                .Where(pm => pm.is_primary)
                .Select(pm => pm.media.url)
                .FirstOrDefault()
            })
            .Take(10)
            .ToListAsync();

        return Ok (products);       
    }

    // This will get the (5) discounted product cards for homepage
    [HttpGet("best-deals")]
    public async Task<IActionResult> GetBestDeals()
    {
        var products = await _context.products
            .Where(p =>
                p.status == "ACTIVE" &&
                p.discount_type != "NONE" &&
                new[] { "PERCENTAGE", "AMOUNT" }
                    .Contains(p.discount_type))
            .OrderByDescending(p => p.updated_at) // optional sorting
            .Select(p => new Shop_GetBestDealsCardDto
                    {
                        Id = p.id,

                        BrandName = p.manufacturer.brand_name,

                        ProductSeries = p.product_series,
                        ProductModel = p.product_model,

                        ActualSellingPrice = p.actual_selling_price,

                        HorsePower = p.technical_specifications
                            .Where(ts => ts.key.keyname == "Horsepower (HP)")
                            .Select(ts => ts.value)
                            .FirstOrDefault(),

                        AvailableStock = p.inventories
                            .Count(i => i.status == "GOOD_STOCK"),

                        InStock = p.inventories
                            .Any(i => i.status == "GOOD_STOCK"),

                        DiscountType = p.discount_type,
                        DiscountValue = p.discount_value,

                        ActualPrice = p.actual_selling_price,
                        OriginalSellingPrice = p.original_selling_price,

                        PrimaryImageUrl = p.products_media
                            .Where(pm => pm.is_primary)
                            .Select(pm => pm.media.url)
                            .FirstOrDefault()
                    })
            .Take(5)
            .AsNoTracking()
            .ToListAsync();

        return Ok(products);
    }





}
