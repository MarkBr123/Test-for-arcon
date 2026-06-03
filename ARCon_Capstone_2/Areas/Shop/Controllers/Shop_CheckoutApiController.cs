using ARCon_Capstone_2.Data;
using ARCon_Capstone_2.DTOs;
using ARCon_Capstone_2.Models;
using ARCon_Capstone_2.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ARCon_Capstone_2.Services;
using Humanizer;
using System.Text.Json;
using System.Reflection.Metadata;
using System.Security.Cryptography;
using System.Text;
using System.Net.Http.Headers;
using System.Text.Json.Nodes;
using ARCon_Capstone_2.Helpers.LalamoveHelpers;
namespace ARCon_Capstone_2.Areas.Shop.Controllers;


[Route("api/shop/checkout")]

public class Shop_CheckoutApiController: ControllerBase
{
    public readonly ARCon_Capstone_2_DbContext _context;
    private readonly IConfiguration _configuration;
    private readonly PayMongoService _payMongoService;
    private readonly INotificationService _notificationService;


    public Shop_CheckoutApiController(ARCon_Capstone_2_DbContext context, IConfiguration configuration, PayMongoService payMongoService, INotificationService notificationService)
    {
        _context = context;
        _configuration = configuration;
        _payMongoService = payMongoService;
        _notificationService = notificationService;
    }


    //Step 1: Store the cart items
    [HttpPost("checkout-selected")]
    public IActionResult StoreSelectedItems([FromBody] List<int> cartItemIds)
    {
        var customerId = HttpContext.Session.GetInt32("UserId");

        if (customerId == null)
            return Unauthorized();

        if (cartItemIds == null || !cartItemIds.Any())
            return BadRequest("No items selected.");

        HttpContext.Session.SetString(
            "SelectedCartItems",
            string.Join(",", cartItemIds)
        );

        return Ok();
    }

    //STEP 2: Get selected items for checkout page
    [HttpGet("checkout-items")]
    public async Task<IActionResult> GetCheckoutItems()
    {
        var customerId = HttpContext.Session.GetInt32("UserId");
        var selectedString = HttpContext.Session.GetString("SelectedCartItems");

        if (customerId == null || string.IsNullOrEmpty(selectedString))
            return Unauthorized();

        var selectedIds = selectedString
            .Split(',')
            .Select(int.Parse)
            .ToList();

        var items = await _context.cart_items
            .Where(ci => selectedIds.Contains(ci.id)
                         && ci.cart.customer_id == customerId)
            .Select(ci => new
            {
                ci.id,
                ci.quantity,


                ProductBrand = ci.product.manufacturer.brand_name,
                ProductSeries = ci.product.product_series,
                ProductModel = ci.product.product_model,
                ProductSku = ci.product.sku,
                UnitPrice = ci.product.actual_selling_price,
                TotalWeight = ci.product.total_gross_weight * ci.quantity,

                StdServicePrice = ci.std_installation_service_option != null
                    ? ci.std_installation_service_option.price
                    : 0,

                AddServicePrice = ci.additional_installation_service_option != null
                    ? ci.additional_installation_service_option.price
                    : 0,

                UnitTotal =
                    ci.product.actual_selling_price
                    + (ci.std_installation_service_option != null
                        ? ci.std_installation_service_option.price
                        : 0)
                    + (ci.additional_installation_service_option != null
                        ? ci.additional_installation_service_option.price
                        : 0),

                Subtotal =
                    (ci.product.actual_selling_price
                    + (ci.std_installation_service_option != null
                        ? ci.std_installation_service_option.price
                        : 0)
                    + (ci.additional_installation_service_option != null
                        ? ci.additional_installation_service_option.price
                        : 0))
                    * ci.quantity
            })
            .ToListAsync();

        return Ok(items);
    }

    //////////////////////       Full Checkout Api        ///////////////////////////
    /*
    [HttpPost("create-checkout")]
    public async Task<IActionResult> CreateCheckout([FromBody] Shop_CreateCheckoutDto dto)
    {
        using var dbTransaction = await _context.Database.BeginTransactionAsync();

        try
        {
            // Verify if online payment details is complete
            if (dto.PaymentMethod == "ONLINE_PAYMENT" && string.IsNullOrEmpty(dto.PaymentMethodId))
            {
                return BadRequest("Payment method required.");
            }


            ////
            ///


            // 1️ Validate Logged-in User

            var customerId = HttpContext.Session.GetInt32("UserId");
            if (customerId == null)
                return Unauthorized();


            // 2️ Get Selected Cart Item IDs from Session

            var selectedString = HttpContext.Session.GetString("SelectedCartItems");
            if (string.IsNullOrEmpty(selectedString))
                return BadRequest("No selected items.");

            var selectedIds = selectedString
                .Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(int.Parse)
                .ToList();


            // 3️⃣ Load Cart Items (Validate Ownership)

            var cartItems = await _context.cart_items
                .Where(c => c.cart.customer_id == customerId &&
                            selectedIds.Contains(c.id))
                .Include(c => c.product)
                .Include(c => c.cart)
                .Include(c => c.std_installation_service_option)           // add this
                .Include(c => c.additional_installation_service_option)
                .ToListAsync();

            if (!cartItems.Any())
                return BadRequest("No valid cart items found.");


            // 4️ Validate Shipping & Address

            int branchId = 1; // default branch

            if (dto.ShippingMethod == "STORE_PICKUP")
            {
                if (branchId == 0)
                    return BadRequest("Branch required for pickup.");
            }
            else
            {
                if (dto.DeliveryAddressId == null)
                    return BadRequest("Delivery address required.");

                var addressValid = await _context.customer_addresses
                    .AnyAsync(a => a.id == dto.DeliveryAddressId &&
                                   a.customer_id == customerId);

                if (!addressValid)
                    return BadRequest("Invalid delivery address.");
            }
            // ===============================
            // 5️⃣ Determine Delivery Cost
            // ===============================
            decimal deliveryCost = dto.ShippingMethod switch
            {
                "STORE_PICKUP" => 0,
                "STANDARD_DELIVERY" => 800, // mocked
                _ => 0
            };

            // ===============================
            // 6️⃣ Create Checkout
            // ===============================
            var checkout = new checkout
            {
                customer_id = customerId.Value,
                delivery_address_id = dto.DeliveryAddressId,
                arcon_store_branches_id = branchId,
                delivery_cost = deliveryCost,
                payment_method = dto.PaymentMethod,
                shipping_method = dto.ShippingMethod,
                status = dto.PaymentMethod == "ONLINE_PAYMENT"
                            ? "AWAITING_PAYMENT"
                            : "CONFIRMED"
            };

            _context.checkouts.Add(checkout);
            await _context.SaveChangesAsync();

            // ===============================
            // 7️⃣ Create Checkout Items (Snapshot)
            // ===============================
            decimal totalItemCost = 0;

            foreach (var item in cartItems)
            {
                decimal productPrice = item.product.actual_selling_price ?? 0;

                decimal stdInstallPrice = 0;
                decimal additionalInstallPrice = 0;

                if (item.std_installation_service_option_id != null)
                {
                    stdInstallPrice = await _context.installation_std_service_options
                        .Where(s => s.id == item.std_installation_service_option_id)
                        .Select(s => s.price)
                        .FirstOrDefaultAsync() ?? 0;
                }

                if (item.additional_installation_service_option_id != null)
                {
                    additionalInstallPrice = await _context.installation_additional_service_options
                        .Where(a => a.id == item.additional_installation_service_option_id)
                        .Select(a => a.price)
                        .FirstOrDefaultAsync() ?? 0;
                }

                decimal singleItemTotal = productPrice + stdInstallPrice + additionalInstallPrice;

                decimal totalItemAmount = singleItemTotal * item.quantity;

                totalItemCost += totalItemAmount;

                var checkoutItem = new checkout_item
                {
                    checkout_id = checkout.id,
                    product_id = item.product_id,
                    qty = item.quantity,

                    product_price = productPrice,
                    std_installation_option_id = item.std_installation_service_option_id,
                    additional_installation_option_id = item.additional_installation_service_option_id,

                    std_installation_price = stdInstallPrice,
                    additional_installation_price = additionalInstallPrice,

                    total_item_amount = totalItemAmount
                };

                _context.checkout_items.Add(checkoutItem);
            }
            await _context.SaveChangesAsync();

            decimal grandTotal = totalItemCost + deliveryCost;

            // Create Payment Transaction
            var paymentTransaction = new payment_transaction
            {
                checkout_id = checkout.id,
                payment_method = dto.PaymentMethod,
                amount = grandTotal,

                cod_status = dto.PaymentMethod == "CASH_ON_DELIVERY" ? "PENDING" : null,   
                paymongo_status = dto.PaymentMethod == "ONLINE_PAYMENT" ? "AWAITING_PAYMENT": null,
                after_service_status = "UNAVAILABLE"
            };


            //ADD PAYMONGO PAYMENT INTENT

            string clientKey = null;


            // Create Customer Transaction (ONLY FOR COD) //////////////////////////////////////////
            if (dto.PaymentMethod == "CASH_ON_DELIVERY")
            {
                var customerTransaction = new customer_transaction
                {
                    checkout_id = checkout.id,
                    payment_transaction_id = paymentTransaction.id,
                    customer_id = customerId.Value,
                    grand_total = grandTotal,
                    status = dto.PaymentMethod == "ONLINE_PAYMENT"
                ? "PENDING_CONFIRMATION"   // will update after webhook
                : "PENDING_CONFIRMATION",
                    shipping_method = dto.ShippingMethod,
                    payment_method = dto.PaymentMethod
                };


                _context.customer_transactions.Add(customerTransaction);
                await _context.SaveChangesAsync(); // get DB id

                // Build Transaction Code
                // Get customer
                var customer = await _context.customers
                    .Where(c => c.id == customerId)
                    .Select(c => new
                    {
                        c.id,
                        c.first_name,
                        c.last_name
                    })
                    .FirstOrDefaultAsync();

                // First letters
                string firstInitial = customer.first_name?.Substring(0, 1).ToUpper() ?? "X";
                string lastInitial = customer.last_name?.Substring(0, 1).ToUpper() ?? "X";

                // Date part
                string datePart = DateTime.Now.ToString("MMddyy");

                // Get last transaction count for this customer
                int lastCount = await _context.customer_transactions
                    .Where(t => t.customer_id == customerId)
                    .CountAsync();

                // Build final code
                string transactionCode =
                    $"TR-{customer.id}{firstInitial}{lastInitial}{datePart}-{lastCount}";

                // Assign
                customerTransaction.transaction_code = transactionCode;

                await _context.SaveChangesAsync();
            }

            // ===============================
            // ONLINE PAYMENT FLOW
            // ===============================

            else if (dto.PaymentMethod == "ONLINE_PAYMENT")
            {
                // 🔴 Validate pm_xxx
                if (string.IsNullOrEmpty(dto.PaymentMethodId))
                    return BadRequest("Payment method is required.");

                // ===============================
                // 🔥 1. CREATE PAYMENT INTENT
                // ===============================
                var paymentIntent = await _payMongoService.CreatePaymentIntent(grandTotal);

                // ===============================
                // 🔥 2. SAVE PAYMENT INTENT ID
                // ===============================
                paymentTransaction.paymongo_payment_intent_id = paymentIntent.Id;
                paymentTransaction.paymongo_status = "AWAITING_PAYMENT";

                await _context.SaveChangesAsync();

                // ===============================
                // 🔥 3. ATTACH PAYMENT METHOD
                // ===============================
                await _payMongoService.AttachPaymentMethod(
                    paymentIntent.Id,
                    dto.PaymentMethodId
                );

                // ===============================
                // 🔥 4. CREATE CUSTOMER TRANSACTION
                // ===============================
                var customerTransaction = new customer_transaction
                {
                    checkout_id = checkout.id,
                    payment_transaction_id = paymentTransaction.id,
                    customer_id = customerId.Value,
                    grand_total = grandTotal,
                    status = "PENDING_CONFIRMATION", // 🔥 IMPORTANT
                    shipping_method = dto.ShippingMethod,
                    payment_method = dto.PaymentMethod,
                };

                _context.customer_transactions.Add(customerTransaction);
                await _context.SaveChangesAsync();

                // ===============================
                // 🔥 5. RETURN SUCCESS
                // ===============================
                return Ok(new
                {
                    success = true,
                    checkoutId = checkout.id
                });
            }


            ///////
            // HERE WE WILL CREATE A NOTIFICATION FROM USER TO ADMIN & CSM
            /////

            // Remove Selected Cart Items

            _context.cart_items.RemoveRange(cartItems);
            await _context.SaveChangesAsync();


            //  Clear Session

            HttpContext.Session.Remove("SelectedCartItems");

            await dbTransaction.CommitAsync();

            return Ok(new
            {
                success = true,
                checkoutId = checkout.id,
                paymentTransactionId = paymentTransaction.id,
                grandTotal = grandTotal,
                clientKey = clientKey
            });
        }
        catch (Exception ex)
        {
            await dbTransaction.RollbackAsync();

            var fullError = ex.InnerException?.Message ?? ex.Message;

            Console.WriteLine("========== FULL ERROR ==========");
            Console.WriteLine(ex.ToString());
            Console.WriteLine("================================");

            return StatusCode(500, new
            {
                message = fullError
            });
        }
    }
    */







    [HttpPost("create-checkout")]
    public async Task<IActionResult> CreateCheckout([FromBody] Shop_CreateCheckoutDto dto)
    {
        using var dbTransaction = await _context.Database.BeginTransactionAsync();

        try
        {

            var customerId = HttpContext.Session.GetInt32("UserId");
            if (customerId == null)
                return Unauthorized();

            var selectedString = HttpContext.Session.GetString("SelectedCartItems");
            if (string.IsNullOrEmpty(selectedString))
                return BadRequest("No selected items.");

            var selectedIds = selectedString
                .Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(int.Parse)
                .ToList();

            var cartItems = await _context.cart_items
                .Where(c => c.cart.customer_id == customerId &&
                            selectedIds.Contains(c.id))
                .Include(c => c.product)
                .Include(c => c.cart)
                .Include(c => c.std_installation_service_option)
                .Include(c => c.additional_installation_service_option)
                .ToListAsync();

            if (!cartItems.Any())
                return BadRequest("No valid cart items found.");

            // 🔹 Shipping validation
            int branchId = 1;

            if (dto.ShippingMethod != "STORE_PICKUP")
            {
                if (dto.DeliveryAddressId == null)
                    return BadRequest("Delivery address required.");

                var addressValid = await _context.customer_addresses
                    .AnyAsync(a => a.id == dto.DeliveryAddressId &&
                                   a.customer_id == customerId);

                if (!addressValid)
                    return BadRequest("Invalid delivery address.");
            }

            decimal deliveryCost = dto.ShippingMethod switch
            {
                "STORE_PICKUP" => 0,
                "STANDARD_DELIVERY" => 800,
                _ => 0
            };

            // ===============================
            // 🔥 CREATE CHECKOUT
            // ===============================
            var checkout = new checkout
            {
                customer_id = customerId.Value,
                delivery_address_id = dto.DeliveryAddressId,
                arcon_store_branches_id = branchId,
                delivery_cost = deliveryCost,
                payment_method = dto.PaymentMethod,
                shipping_method = dto.ShippingMethod,
                status = dto.PaymentMethod == "ONLINE_PAYMENT"
                            ? null
                            : "CONFIRMED"
            };

            _context.checkouts.Add(checkout);
            await _context.SaveChangesAsync();

            // ===============================
            // 🔥 CREATE CHECKOUT ITEMS
            // ===============================
            decimal totalItemCost = 0;

            foreach (var item in cartItems)
            {
                decimal productPrice = item.product.actual_selling_price ?? 0;

                decimal stdInstallPrice = item.std_installation_service_option?.price ?? 0;
                decimal additionalInstallPrice = item.additional_installation_service_option?.price ?? 0;

                decimal singleItemTotal = productPrice + stdInstallPrice + additionalInstallPrice;
                decimal totalItemAmount = singleItemTotal * item.quantity;

                totalItemCost += totalItemAmount;

                _context.checkout_items.Add(new checkout_item
                {
                    checkout_id = checkout.id,
                    product_id = item.product_id,
                    qty = item.quantity,
                    product_price = productPrice,
                    std_installation_option_id = item.std_installation_service_option_id,
                    additional_installation_option_id = item.additional_installation_service_option_id,
                    std_installation_price = stdInstallPrice,
                    additional_installation_price = additionalInstallPrice,
                    total_item_amount = totalItemAmount
                });
            }

            await _context.SaveChangesAsync();

            decimal grandTotal = totalItemCost + deliveryCost;

            // CREATE PAYMENT TRANSACTION (FIXED)

            var paymentTransaction = new payment_transaction
            {
                checkout_id = checkout.id,
                payment_method = dto.PaymentMethod,
                amount = grandTotal,
                cod_status = dto.PaymentMethod == "CASH_ON_DELIVERY" ? "PENDING" : null,
                paymongo_status = dto.PaymentMethod == "ONLINE_PAYMENT" ? null : null,
                after_service_status = "UNAVAILABLE"
            };

            _context.payment_transactions.Add(paymentTransaction);
            await _context.SaveChangesAsync();


            //ONLINE PAYMENT FLOW
 
            if (dto.PaymentMethod == "ONLINE_PAYMENT")
            {
                // Create payment intent
                var paymentIntent = await _payMongoService.CreatePaymentIntent(grandTotal);

                // SAVE payment_intent_id FIRST (IMPORTANT)
                paymentTransaction.paymongo_payment_intent_id = paymentIntent.Id;
                await _context.SaveChangesAsync(); // 🔥 MUST BE HERE

                // THEN attach payment method (this triggers webhook)
                await _payMongoService.AttachPaymentMethod(
                    paymentIntent.Id,
                    dto.PaymentMethodId
                );


                var customerTransaction = new customer_transaction
                {
                    checkout_id = checkout.id,
                    payment_transaction_id = paymentTransaction.id,
                    customer_id = customerId.Value,
                    grand_total = grandTotal,
                    status = "PENDING_CONFIRMATION",
                    shipping_method = dto.ShippingMethod,
                    payment_method = dto.PaymentMethod
                };

                customerTransaction.transaction_code =await GenerateTransactionCode(customerId.Value);

                _context.customer_transactions.Add(customerTransaction);
                await _context.SaveChangesAsync();
                    

            }

            // ===============================
            // 💵 COD FLOW
            // ===============================
            else
            {
                var customerTransaction = new customer_transaction
                {
                    checkout_id = checkout.id,
                    payment_transaction_id = paymentTransaction.id,
                    customer_id = customerId.Value,
                    grand_total = grandTotal,
                    status = "PENDING_CONFIRMATION",
                    shipping_method = dto.ShippingMethod,
                    payment_method = dto.PaymentMethod
                };

                customerTransaction.transaction_code = await GenerateTransactionCode(customerId.Value);

                _context.customer_transactions.Add(customerTransaction);
                await _context.SaveChangesAsync();


            }

            // ===============================
            // 🔥 CLEANUP
            // ===============================
            _context.cart_items.RemoveRange(cartItems);
            await _context.SaveChangesAsync();

            HttpContext.Session.Remove("SelectedCartItems");

            await dbTransaction.CommitAsync();


            return Ok(new
            {
                success = true,
                checkoutId = checkout.id
            });
        }
        catch (Exception ex)
        {
            await dbTransaction.RollbackAsync();

            var fullError = ex.InnerException?.Message ?? ex.Message;

            Console.WriteLine("========== FULL ERROR ==========");
            Console.WriteLine(ex.ToString());
            Console.WriteLine("================================");

            return StatusCode(500, new
            {
                message = fullError
            });
        }
    }





    //Get intent
    [HttpGet("payment-status/{paymentIntentId}")]
    public async Task<IActionResult> GetPaymentStatus(string paymentIntentId)
    {
        var transaction = await _context.payment_transactions
            .FirstOrDefaultAsync(x => x.paymongo_payment_intent_id == paymentIntentId);

        if (transaction == null)
        {
            return NotFound(new { status = "NOT_FOUND" });
        }

        // 🔥 FIX: direct query (NOT navigation)
        var customerTransaction = await _context.customer_transactions
            .FirstOrDefaultAsync(x => x.payment_transaction_id == transaction.id);

        return Ok(new
        {
            payment = new
            {
                status = transaction.paymongo_status ?? "PENDING",
                amount = transaction.amount,
                paidAt = transaction.paid_at
            },

            order = customerTransaction == null ? null : new
            {
                transactionCode = customerTransaction.transaction_code,
                status = customerTransaction.status,
                shippingMethod = customerTransaction.shipping_method,
                paymentMethod = customerTransaction.payment_method,
                total = customerTransaction.grand_total
            }
        });
    }



    [HttpGet("test-token")]
    public async Task<IActionResult> TestToken()
    {
        var config = _configuration.GetSection("Lalamove");

        using var client = new HttpClient();

        var form = new Dictionary<string, string>
    {
        { "grant_type", "client_credentials" },
        { "client_id", config["ApiKey"] },
        { "client_secret", config["Secret"] }
    };

        var response = await client.PostAsync(
            config["BaseUrl"] + "/oauth/token",
            new FormUrlEncodedContent(form)
        );

        var body = await response.Content.ReadAsStringAsync();

        return Content(body);
    }



    private async Task<string> GenerateTransactionCode(int customerId)
    {
        var customer = await _context.customers
            .Where(c => c.id == customerId)
            .Select(c => new
            {
                c.id,
                c.first_name,
                c.last_name
            })
            .FirstOrDefaultAsync();

        string firstInitial = customer.first_name?.Substring(0, 1).ToUpper() ?? "X";
        string lastInitial = customer.last_name?.Substring(0, 1).ToUpper() ?? "X";

        string datePart = DateTime.Now.ToString("MMddyy");

        int lastCount = await _context.customer_transactions
            .Where(t => t.customer_id == customerId)
            .CountAsync();

        return $"TR-{customer.id}{firstInitial}{lastInitial}{datePart}-{lastCount}";
    }
}


