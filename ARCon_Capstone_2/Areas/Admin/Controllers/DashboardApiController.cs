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

    /// Customer Transactions //
    // =====================================
    // CUSTOMER TRANSACTION STATUS COUNTS
    // DASHBOARD
    // =====================================

    [HttpGet("dashboard/customer-transaction-counts")]
    public async Task<IActionResult>
    GetCustomerTransactionCounts()
    {
        var counts = await _context.customer_transactions

            .GroupBy(x => x.status)

            .Select(g => new
            {
                status = g.Key,
                count = g.Count()
            })

            .ToListAsync();



        return Ok(new
        {
            total = counts.Sum(x => x.count),

            pendingConfirmation =
                counts.FirstOrDefault(x =>
                    x.status ==
                    "PENDING_CONFIRMATION"
                )?.count ?? 0,

            confirmed =
                counts.FirstOrDefault(x =>
                    x.status ==
                    "CONFIRMED"
                )?.count ?? 0,

            processed =
                counts.FirstOrDefault(x =>
                    x.status ==
                    "PROCESSED"
                )?.count ?? 0,

            pendingReprocess =
                counts.FirstOrDefault(x =>
                    x.status ==
                    "PENDING_REPROCESS"
                )?.count ?? 0,

            completed =
                counts.FirstOrDefault(x =>
                    x.status ==
                    "COMPLETED"
                )?.count ?? 0,

            rejected =
                counts.FirstOrDefault(x =>
                    x.status ==
                    "REJECTED"
                )?.count ?? 0,

            rejectedForRefund =
                counts.FirstOrDefault(x =>
                    x.status ==
                    "REJECTED_FOR_REFUND"
                )?.count ?? 0,

            cancelled =
                counts.FirstOrDefault(x =>
                    x.status ==
                    "CANCELLED"
                )?.count ?? 0,

            cancelledForRefund =
                counts.FirstOrDefault(x =>
                    x.status ==
                    "CANCELLED_FOR_REFUND"
                )?.count ?? 0
        });
    }


    // Inventory 

    // =====================================
    // INVENTORY STATUS COUNTS
    // DASHBOARD
    // =====================================

    [HttpGet("inventory-status-counts")]
    public async Task<IActionResult>
    GetInventoryStatusCounts()
    {
        var counts = await _context.inventories

            .GroupBy(x => x.status)

            .Select(g => new
            {
                status = g.Key,
                count = g.Count()
            })

            .ToListAsync();



        return Ok(new
        {
            total = counts.Sum(x => x.count),

            goodStock =
                counts.FirstOrDefault(x =>
                    x.status == "GOOD_STOCK"
                )?.count ?? 0,

            reservedForDelivery =
                counts.FirstOrDefault(x =>
                    x.status ==
                    "RESERVED_FOR_DELIVERY"
                )?.count ?? 0,

            sold =
                counts.FirstOrDefault(x =>
                    x.status == "SOLD"
                )?.count ?? 0,

            asReplacement =
                counts.FirstOrDefault(x =>
                    x.status == "AS_REPLACEMENT"
                )?.count ?? 0,

            returnedToSupplier =
                counts.FirstOrDefault(x =>
                    x.status ==
                    "RETURNED_TO_SUPPLIER"
                )?.count ?? 0
        });
    }

    //Service Bookings

    // =====================================
    // SERVICE BOOKING STATUS COUNTS
    // DASHBOARD
    // =====================================

    [HttpGet("service-booking-status-counts")]
    public async Task<IActionResult>
        GetServiceBookingStatusCounts()
    {
        try
        {
            var total =
                await _context.service_bookings
                    .CountAsync();



            var pending =
                await _context.service_bookings
                    .CountAsync(x =>
                        x.status == "PENDING");



            var confirmed =
                await _context.service_bookings
                    .CountAsync(x =>
                        x.status == "CONFIRMED");



            var processing =
                await _context.service_bookings
                    .CountAsync(x =>
                        x.status == "PROCESSING");



            var completed =
                await _context.service_bookings
                    .CountAsync(x =>
                        x.status == "COMPLETED");



            var partiallyCompleted =
                await _context.service_bookings
                    .CountAsync(x =>
                        x.status ==
                        "PARTIALLY_COMPLETED");



            var warrantyApproved =
                await _context.service_bookings
                    .CountAsync(x =>
                        x.status ==
                        "WARRANTY_APPROVED");



            var failed =
                await _context.service_bookings
                    .CountAsync(x =>
                        x.status == "FAILED");



            var failedForRefund =
                await _context.service_bookings
                    .CountAsync(x =>
                        x.status ==
                        "FAILED_FOR_REFUND");



            var cancelled =
                await _context.service_bookings
                    .CountAsync(x =>
                        x.status == "CANCELLED");



            var rejected =
                await _context.service_bookings
                    .CountAsync(x =>
                        x.status == "REJECTED");



            return Ok(new
            {
                total,

                pending,

                confirmed,

                processing,

                completed,

                partiallyCompleted,

                warrantyApproved,

                failed,

                failedForRefund,

                cancelled,

                rejected
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message =
                    ex.InnerException?.Message
                    ?? ex.Message
            });
        }
    }

}