using ARCon_Capstone_2.Data;
using ARCon_Capstone_2.DTOs;
using ARCon_Capstone_2.Models;
using ARCon_Capstone_2.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ARCon_Capstone_2.Services;

namespace ARCon_Capstone_2.Areas.Shop.Controllers;


[Route("api/shop/home_product_cards")]
public class Shop_ProductApiController : ControllerBase
{
    private readonly ARCon_Capstone_2_DbContext _context;

    public Shop_ProductApiController(ARCon_Capstone_2_DbContext context)
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
                .FirstOrDefault(),

                 ar_url = p.ar_url
            })
            .Take(10)
            .ToListAsync();

        return Ok(products);
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
                            .FirstOrDefault(),

              ar_url = p.ar_url
            })
            .Take(12)
            .AsNoTracking()
            .ToListAsync();

        return Ok(products);
    }

    /// <summary>
    /// This will show ratings
    /// </summary>
    /// <param name="productId"></param>
    /// <returns></returns>
    [HttpGet("product/{productId}/ratings")]
    public async Task<IActionResult> GetProductRatings(int productId)
    {
        var ratingsQuery = _context.customer_ratings
            .Where(r => r.product_id == productId && r.isposted == true)
            .Include(r => r.customer);

        var ratings = await ratingsQuery
            .OrderByDescending(r => r.created_at)
            .Select(r => new
            {
                rating = r.rating,
                comment = r.comment,
                createdAt = r.created_at,
                customerName = r.customer.first_name + " " + r.customer.last_name
            })
            .ToListAsync();

        var avgRating = ratings.Any()
            ? ratings.Average(r => r.rating)
            : 0;

        return Ok(new
        {
            averageRating = avgRating,
            totalReviews = ratings.Count,
            reviews = ratings
        });
    }


    [HttpGet("product/{productId}")]
    public async Task<IActionResult> GetProductRating(int productId)
    {
        var result = await _context.customer_ratings
            .Where(r => r.product_id == productId)
            .GroupBy(r => r.product_id)
            .Select(g => new
            {
                averageRating = Math.Round(g.Average(x => x.rating), 1),
                totalReviews = g.Count()
            })
            .FirstOrDefaultAsync();

        if (result == null)
        {
            return Ok(new
            {
                averageRating = 0,
                totalReviews = 0
            });
        }

        return Ok(result);
    }



    /////////////////////////////////////////////////////////////////////            Product Search             //////////////////////////////////////////////////////////////////////////////
    // =========================
    // SEARCH API
    // =========================

    [HttpGet("search-products")]
    public async Task<IActionResult> SearchProducts(
        [FromQuery] Shop_SearchProductsQueryDto queryDto)
    {
        try
        {
            /* =========================
               SAFETY
            ========================= */

            if (queryDto.Page <= 0)
                queryDto.Page = 1;

            if (queryDto.PageSize <= 0)
                queryDto.PageSize = 18;

            if (queryDto.PageSize > 50)
                queryDto.PageSize = 50;

            /* =========================
               BASE QUERY
            ========================= */

            var query = _context.products

                .AsNoTracking()

                .Where(p =>
                    p.status != "ARCHIVED"
                )

                .AsQueryable();

            /* =========================
               SEARCH
            ========================= */

            if (!string.IsNullOrWhiteSpace(queryDto.Search))
            {
                var search =
                    queryDto.Search.Trim();

                query = query.Where(p =>

                    /* MODEL */
                    EF.Functions.ILike(
                        p.product_model,
                        $"%{search}%"
                    )

                    ||

                    /* SERIES */
                    EF.Functions.ILike(
                        p.product_series,
                        $"%{search}%"
                    )

                    ||

                    /* SKU */
                    EF.Functions.ILike(
                        p.sku,
                        $"%{search}%"
                    )

                    ||

                    /* PART NUMBER A */
                    EF.Functions.ILike(
                        p.part_number_a,
                        $"%{search}%"
                    )

                    ||

                    /* PART NUMBER B */
                    (
                        p.part_number_b != null &&

                        EF.Functions.ILike(
                            p.part_number_b,
                            $"%{search}%"
                        )
                    )

                    ||

                    /* BRAND */
                    EF.Functions.ILike(
                        p.manufacturer.brand_name,
                        $"%{search}%"
                    )

                    ||

                    /* FORM FACTOR */
                    EF.Functions.ILike(
                        p.form_factor.form_factor1,
                        $"%{search}%"
                    )

                    ||

                    /* TAGS */
                    p.product_tags.Any(t =>

                        EF.Functions.ILike(
                            t.tag.tag_name,
                            $"%{search}%"
                        )
                    )

                    ||

                    /* TECHNOLOGIES */
                    p.product_technologies.Any(t =>

                        EF.Functions.ILike(
                            t.technology.technology_name,
                            $"%{search}%"
                        )

                        ||

                        EF.Functions.ILike(
                            t.technology.technology_desc,
                            $"%{search}%"
                        )
                    )

                    ||

                    /* SPECIFICATIONS */
                    p.technical_specifications.Any(s =>

                        EF.Functions.ILike(
                            s.key.keyname,
                            $"%{search}%"
                        )

                        ||

                        EF.Functions.ILike(
                            s.value,
                            $"%{search}%"
                        )
                    )
                );
            }

            /* =========================
               BRAND FILTER
            ========================= */

            if (
                queryDto.Brands != null &&
                queryDto.Brands.Any()
            )
            {
                var brands =
                    queryDto.Brands
                        .Select(x => x.ToLower())
                        .ToList();

                query = query.Where(p =>

                    brands.Contains(
                        p.manufacturer.brand_name
                            .ToLower()
                    )
                );
            }

            /* =========================
               FORM FACTOR FILTER
            ========================= */

            if (
                queryDto.FormFactors != null &&
                queryDto.FormFactors.Any()
            )
            {
                var formFactors =
                    queryDto.FormFactors
                        .Select(x => x.ToLower())
                        .ToList();

                query = query.Where(p =>

                    formFactors.Contains(
                        p.form_factor.form_factor1
                            .ToLower()
                    )
                );
            }

            /* =========================
                HP FILTER
             ========================= */

            if (
                queryDto.Hp != null &&
                queryDto.Hp.Any()
            )
            {
                query = query.Where(p =>

                    p.technical_specifications.Any(s =>

                        s.key.keyname ==
                            "Horsepower (HP)"

                        &&

                        queryDto.Hp.Contains(
                            s.value
                        )
                    )
                );
            }

            /* =========================
               PRICE FILTER
            ========================= */

            if (queryDto.MinPrice.HasValue)
            {
                query = query.Where(p =>

                    p.actual_selling_price >=
                    queryDto.MinPrice.Value
                );
            }

            if (queryDto.MaxPrice.HasValue)
            {
                query = query.Where(p =>

                    p.actual_selling_price <=
                    queryDto.MaxPrice.Value
                );
            }

            /* =========================
               STOCK FILTER
            ========================= */

            if (
                queryDto.Stock ==
                "IN_STOCK"
            )
            {
                query = query.Where(p =>

                    p.inventories.Any(i =>

                        i.status == "GOOD_STOCK"
                    )
                );
            }

            if (
                queryDto.Stock ==
                "OUT_OF_STOCK"
            )
            {
                query = query.Where(p =>

                    !p.inventories.Any(i =>

                        i.status == "GOOD_STOCK"
                    )
                );
            }

            /* =========================
   PRESET FILTERS
========================= */

            switch (queryDto.Preset)
            {
                /* NEWEST PRODUCTS */

                case "newest":

                    query = query
                        .OrderByDescending(p =>
                            p.created_at
                        );

                    break;

                /* BEST DEALS */

                case "best-deals":

                    query = query.Where(p =>

                        p.discounted_selling_price > 0
                    );

                    break;

                /* SPECIAL PICKS */

                case "special-picks":

                    query = query
                        .OrderBy(p => Guid.NewGuid());

                    break;

                /* CUSTOMER FAVORITES */

                case "favorites":

                    query = query.Where(p =>

                        p.inventories.Count(i =>

                            i.status == "GOOD_STOCK"

                        ) >= 3
                    );

                    break;
            }

            /* =========================
               SORTING
            ========================= */

            query = queryDto.Sort switch
            {
                "low-high" =>

                    query.OrderBy(p =>
                        p.actual_selling_price
                    ),

                "high-low" =>

                    query.OrderByDescending(p =>
                        p.actual_selling_price
                    ),

                "stock-high" =>

                    query.OrderByDescending(p =>

                        p.inventories.Count(i =>
                            i.status == "GOOD_STOCK"
                        )
                    ),

                "stock-low" =>

                    query.OrderBy(p =>

                        p.inventories.Count(i =>
                            i.status == "GOOD_STOCK"
                        )
                    ),

                "inverter" =>

                    query.Where(p =>

                        p.product_tags.Any(t =>

                            EF.Functions.ILike(
                                t.tag.tag_name,
                                "%inverter%"
                            )
                        )
                    ),

                "non-inverter" =>

                    query.Where(p =>

                        !p.product_tags.Any(t =>

                            EF.Functions.ILike(
                                t.tag.tag_name,
                                "%inverter%"
                            )
                        )
                    ),

                _ =>

                    query.OrderByDescending(p =>
                        p.created_at
                    )
            };

            /* =========================
               TOTAL COUNT
            ========================= */

            var totalCount =
                await query.CountAsync();

            /* =========================
               PAGINATION
            ========================= */

            var items = await query

                .Skip(
                    (queryDto.Page - 1)
                    * queryDto.PageSize
                )

                .Take(queryDto.PageSize)

                .Select(p =>

                    new Shop_SearchProductCardDto
                    {
                        Id = p.id,

                        BrandName =
                            p.manufacturer.brand_name,

                        ProductSeries =
                            p.product_series,

                        ProductModel =
                            p.product_model,

                        ActualSellingPrice =
                            p.actual_selling_price,

                        HorsePower =
                            p.technical_specifications

                                .Where(ts =>

                                    ts.key.keyname ==
                                    "Horsepower (HP)"
                                )

                                .Select(ts =>
                                    ts.value
                                )

                                .FirstOrDefault(),

                        AvailableStock =

                            p.inventories.Count(i =>

                                i.status ==
                                "GOOD_STOCK"
                            ),

                        InStock =

                            p.inventories.Any(i =>

                                i.status ==
                                "GOOD_STOCK"
                            ),

                        PrimaryImageUrl =

                            p.products_media

                                .Where(pm =>
                                    pm.is_primary
                                )

                                .Select(pm =>
                                    pm.media.url
                                )

                                .FirstOrDefault(),

                        ArUrl = p.ar_url
                    })

                .ToListAsync();

            /* =========================
               RESPONSE
            ========================= */

            var response =
                new PaginatedResponseDto
                <
                    Shop_SearchProductCardDto
                >
                {
                    Page = queryDto.Page,

                    PageSize =
                        queryDto.PageSize,

                    TotalCount =
                        totalCount,

                    TotalPages =

                        (int)Math.Ceiling(
                            totalCount /
                            (double)queryDto.PageSize
                        ),

                    Items = items
                };

            return Ok(response);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = ex.Message
            });
        }
    }



}

