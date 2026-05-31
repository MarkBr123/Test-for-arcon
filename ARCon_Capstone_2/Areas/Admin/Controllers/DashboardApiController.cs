using ARCon_Capstone_2.Data;
using ARCon_Capstone_2.DTOs;
using ARCon_Capstone_2.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;


[AllowAnonymous]
[ApiController]
[Route("api/dashboard")]
public class DashboardApiController : ControllerBase
{
    private readonly ARCon_Capstone_2_DbContext _context;
    public DashboardApiController(ARCon_Capstone_2_DbContext context)
    {
        _context = context;
    }

    [HttpGet("transaction-analytics")]
    public async Task<IActionResult> GetTransactionAnalytics()
    {
        // Transactions Per Month
        var transactionsPerMonth = await _context.customer_transactions
            .GroupBy(t => new
            {
                Year = t.created_at!.Value.Year,
                Month = t.created_at.Value.Month
            })
            .Select(g => new
            {
                year = g.Key.Year,
                month = g.Key.Month,
                transactionCount = g.Count()
            })
            .OrderBy(x => x.year)
            .ThenBy(x => x.month)
            .ToListAsync();

        // Revenue Per Month
        var revenuePerMonth = await _context.customer_transactions
            .Where(t => t.status == "COMPLETED")
            .GroupBy(t => new
            {
                Year = t.created_at!.Value.Year,
                Month = t.created_at.Value.Month
            })
            .Select(g => new
            {
                year = g.Key.Year,
                month = g.Key.Month,
                revenue = g.Sum(x => x.grand_total ?? 0)
            })
            .OrderBy(x => x.year)
            .ThenBy(x => x.month)
            .ToListAsync();

        // Payment Method Breakdown
        var paymentMethods = await _context.customer_transactions
            .GroupBy(t => t.payment_method)
            .Select(g => new
            {
                paymentMethod = g.Key,
                count = g.Count()
            })
            .ToListAsync();

        // Status Distribution
        var statusDistribution = await _context.customer_transactions
            .GroupBy(t => t.status)
            .Select(g => new
            {
                status = g.Key,
                count = g.Count()
            })
            .OrderByDescending(x => x.count)
            .ToListAsync();

        // KPI Cards
        var totalTransactions =
            await _context.customer_transactions.CountAsync();

        var totalRevenue =
            await _context.customer_transactions
                .Where(t => t.status == "COMPLETED")
                .SumAsync(t => t.grand_total ?? 0);

        var averageOrderValue =
            await _context.customer_transactions
                .Where(t => t.status == "COMPLETED")
                .AverageAsync(t => (decimal?)(t.grand_total ?? 0)) ?? 0;

        return Ok(new
        {
            summary = new
            {
                totalTransactions,
                totalRevenue,
                averageOrderValue
            },

            transactionsPerMonth,

            revenuePerMonth,

            paymentMethods,

            statusDistribution
        });
    }



    [HttpGet("inventory-analytics")]
    public async Task<IActionResult> GetInventoryAnalytics()
    {
        // STATUS DISTRIBUTION

        var statusDistribution = await _context.inventories
            .GroupBy(i => i.status)
            .Select(g => new
            {
                status = g.Key,
                count = g.Count()
            })
            .OrderByDescending(x => x.count)
            .ToListAsync();


        // KPI CARDS

        var totalSkus =
            await _context.products.CountAsync();

        var totalUnits =
            await _context.inventories.CountAsync();

        var activeProducts =
            await _context.products
                .CountAsync(p => p.status == "ACTIVE");
        var archivedProducts =
           await _context.products
               .CountAsync(p => p.status == "ARCHIVED");

        var discountedProducts =
            await _context.products
                .CountAsync(p => p.discount_type != "NONE");

        var unitsSold =
            await _context.inventories
                .CountAsync(i => i.status == "SOLD");


        // LOW STOCK PRODUCTS
  

        var lowStockProducts =
            await _context.products
                .CountAsync(p =>
                    _context.inventories.Count(i =>
                        i.product_id == p.id &&
                        i.status == "GOOD_STOCK"
                    ) <= p.reorder_level
                );

        /// No Stock
        var outOfStockProducts =
            await _context.products
                .CountAsync(p =>
                    !_context.inventories.Any(i =>
                        i.product_id == p.id &&
                        i.status == "GOOD_STOCK"
                    )
                );

        // TOP 20 BEST SELLERS

        var topProducts =
          await _context.inventories
              .Where(i => i.status == "SOLD")
              .GroupBy(i => new
              {
                  i.product_id,
                  i.product.product_model,
                  i.product.product_series,
                  i.product.sku
              })
              .Select(g => new
              {
                  productId = g.Key.product_id,
                  productModel = g.Key.product_model,
                  sku = g.Key.sku,
                  soldCount = g.Count()
              })
              .OrderByDescending(x => x.soldCount)
              .Take(20)
              .ToListAsync();

        var newestProducts =
                await (
                    from p in _context.products
                    join m in _context.manufacturers
                        on p.manufacturer_id equals m.ID

                    orderby p.created_at descending

                    select new
                    {
                        p.id,

                        productName =
                            p.product_model +
                            " " +
                            (p.product_series ?? ""),

                        p.sku,

                        manufacturerName =
                            m.manufacturer_name,

                        p.created_at
                    }
                )
                .Take(10)
                .ToListAsync();



        return Ok(new
        {
            summary = new
            {
                totalSkus,
                totalUnits,
                activeProducts,
                discountedProducts,
                archivedProducts,
                lowStockProducts,
                outOfStockProducts,
                unitsSold
            },

            statusDistribution,

            topProducts,

            newestProducts
        });
    }

    [HttpGet("service-booking-analytics")]
    public async Task<IActionResult>
        GetServiceBooking()
    {
        // Transactions Per Month
        var serviceBookingPerMonth = await _context.service_bookings
            .GroupBy(s => new
            {
                Year = s.created_at!.Value.Year,
                Month = s.created_at.Value.Month
            })
            .Select(g => new
            {
                year = g.Key.Year,
                month = g.Key.Month,
                serviceBookingCount = g.Count()
            })
            .OrderBy(x => x.year)
            .ThenBy(x => x.month)
            .ToListAsync();

        // Revenue Per Month
        var serviceRevenuePerMonth = await _context.service_bookings
            .Where(s => s.status == "COMPLETED")
            .GroupBy(s => new
            {
                Year = s.created_at!.Value.Year,
                Month = s.created_at.Value.Month
            })
            .Select(sb => new
            {
                year = sb.Key.Year,
                month = sb.Key.Month,
                revenue = sb.Sum(x => x.total_amount ?? 0)
            })
            .OrderBy(x => x.year)
            .ThenBy(x => x.month)
            .ToListAsync();

        // Payment Method Breakdown
        var paymentMethods = await _context.service_bookings
            .GroupBy(s => s.payment_method)
            .Select(sb => new
            {
                paymentMethod = sb.Key,
                count = sb.Count()
            })
            .ToListAsync();

        // Status Distribution
        var statusDistribution = await _context.service_bookings
            .GroupBy(s => s.status)
            .Select(sb => new
            {
                status = sb.Key,
                count = sb.Count()
            })
            .OrderByDescending(x => x.count)
            .ToListAsync();

        // KPI Cards
        var totalServiceBooking =
            await _context.service_bookings.CountAsync();

        var totalServiceRevenue =
            await _context.service_bookings
                .Where(s => s.status == "COMPLETED")
                .SumAsync(s => s.total_amount ?? 0);

        var averageServiceValue =
            await _context.service_bookings
                .Where(s => s.status == "COMPLETED")
                .Select(s => (decimal?)s.total_amount)
                .AverageAsync() ?? 0;

        return Ok(new
        {
            summary = new
            {
                totalServiceBooking,
                totalServiceRevenue,
                averageServiceValue
            },

            serviceBookingPerMonth,

            serviceRevenuePerMonth,

            paymentMethods,

            statusDistribution
        });
    }


}