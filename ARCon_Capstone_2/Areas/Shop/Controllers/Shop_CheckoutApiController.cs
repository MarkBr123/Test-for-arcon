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
    public Shop_CheckoutApiController(ARCon_Capstone_2_DbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
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

    [HttpPost("create-checkout")]
    public async Task<IActionResult> CreateCheckout([FromBody] Shop_CreateCheckoutDto dto)
    {
        using var dbTransaction = await _context.Database.BeginTransactionAsync();

        try
        {
            // ===============================
            // 1️⃣ Validate Logged-in User
            // ===============================
            var customerId = HttpContext.Session.GetInt32("UserId");
            if (customerId == null)
                return Unauthorized();

            // ===============================
            // 2️⃣ Get Selected Cart Item IDs from Session
            // ===============================
            var selectedString = HttpContext.Session.GetString("SelectedCartItems");
            if (string.IsNullOrEmpty(selectedString))
                return BadRequest("No selected items.");

            var selectedIds = selectedString
                .Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(int.Parse)
                .ToList();

            // ===============================
            // 3️⃣ Load Cart Items (Validate Ownership)
            // ===============================
            var cartItems = await _context.cart_items
                .Where(c => c.cart.customer_id == customerId &&
                            selectedIds.Contains(c.id))
                .Include(c => c.product)
                .Include(c => c.cart)
                .Include(c => c.std_installation_service_option)           // ✅ add this
                .Include(c => c.additional_installation_service_option)
                .ToListAsync();

            if (!cartItems.Any())
                return BadRequest("No valid cart items found.");

            // ===============================
            // 4️⃣ Validate Shipping & Address
            // ===============================
            int branchId = 1; // default branch

            if (dto.ShippingMethod == "STORE_PICKUP")
            {
                if (dto.BranchId == null)
                    return BadRequest("Branch required for pickup.");

                branchId = dto.BranchId.Value;  // ✅ assign FROM dto
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

                branchId = 1; // delivery uses main branch
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


            // 8Create Payment Transaction

            var paymentTransaction = new payment_transaction
            {
                checkout_id = checkout.id,
                payment_method = dto.PaymentMethod,
                amount = grandTotal,
                cod_status= dto.PaymentMethod == "CASH_ON_DELIVERY" ? "PENDING" : null,
                paymongo_status = dto.PaymentMethod == "ONLINE_PAYMENT" ? "pending" : null,
            };

            _context.payment_transactions.Add(paymentTransaction);
            await _context.SaveChangesAsync();


            // Create Customer Transaction (ONLY FOR COD)

            if (dto.PaymentMethod == "CASH_ON_DELIVERY")
            {
                var customerTransaction = new customer_transaction
                {
                    checkout_id = checkout.id,
                    payment_transaction_id = paymentTransaction.id,
                    customer_id = customerId.Value,
                    grand_total = grandTotal,
                    status = "PENDING_CONFIRMATION",
                };

                _context.customer_transactions.Add(customerTransaction);
                await _context.SaveChangesAsync();
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
                grandTotal = grandTotal
            });
        }
        catch (Exception ex)
        {
            await dbTransaction.RollbackAsync();
            return StatusCode(500, ex.Message);
        }
    }






















    /////This post sends request to lalamove API (/v3/QUOTATION), RequestBody is made from Lalamove_template table: JSON (NOT WORKING: Market Error)
    /*
    [HttpPost("get-shipping-quote")]
    public async Task<IActionResult> GetShippingQuote()
    {
        try
        {
            var config = _configuration.GetSection("Lalamove");
            var baseUrl = config["BaseUrl"];
            var apiKey = config["ApiKey"];
            var secret = config["Secret"];

            // 🔥 1️⃣ Milliseconds timestamp (must match Postman)
            var timestamp = DateTimeOffset.UtcNow
                .ToUnixTimeMilliseconds()
                .ToString();

            // 🔥 2️⃣ Load JSON template from DB (TEXT column)
            var jsonBody = await _context.lalamove_templates
                .Where(t => t.template_name == "SEDAN_TEMPLATE")
                .Select(t => t.request_body)
                .FirstOrDefaultAsync();

            if (string.IsNullOrEmpty(jsonBody))
                return BadRequest("Template not found.");

            // 🔥 OPTIONAL: Replace dynamic placeholders if needed
            // jsonBody = jsonBody.Replace("{{pickup_lat}}", branchLat);

            // 🔥 3️⃣ Build raw signature EXACTLY like Postman
            var rawSignature =
                timestamp + "\r\n" +
                "POST" + "\r\n" +
                "/v3/quotations" + "\r\n" +
                "\r\n" +              // 🔥 IMPORTANT: blank line
                jsonBody;

            using var hmac = new HMACSHA256(
                Encoding.UTF8.GetBytes(secret)
            );

            var hash = hmac.ComputeHash(
                Encoding.UTF8.GetBytes(rawSignature)
            );

            var signature = BitConverter
                .ToString(hash)
                .Replace("-", "")
                .ToLower();

            // 🔥 4️⃣ Create HTTP request
            using var client = new HttpClient();

            var request = new HttpRequestMessage(
                HttpMethod.Post,
                baseUrl + "/v3/quotations"
            );

            request.Headers.TryAddWithoutValidation(
                "Authorization",
                $"hmac {apiKey}:{timestamp}:{signature}"
            );

            request.Headers.TryAddWithoutValidation(
                "X-LLM-Market",
                "PH"
            );

            request.Headers.TryAddWithoutValidation(
                "X-LLM-Timestamp",
                timestamp
            );

            request.Content = new StringContent(
                jsonBody,
                Encoding.UTF8,
                "application/json"
            );

            // 🔥 DEBUG
            System.Diagnostics.Debug.WriteLine("RAW SIGNATURE:");
            System.Diagnostics.Debug.WriteLine(rawSignature);

            System.IO.File.WriteAllText("csharp_signature.txt", rawSignature);
            System.IO.File.WriteAllText("csharp_body.txt", jsonBody);

            var response = await client.SendAsync(request);
            var responseBody = await response.Content.ReadAsStringAsync();

            return StatusCode((int)response.StatusCode, responseBody);
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }

    }
    */





    /// <summary>
    /// This post sends request to lalamove API (/v3/QUOTATION), RequestBody is made from classes (NOT WORKING: Market Error)
    /// </summary>
  /*
    [HttpPost("get-shipping-quote")]
    public async Task<IActionResult> GetShippingQuote()
    {
        try
        {
            var config = _configuration.GetSection("Lalamove");
            var baseUrl = config["BaseUrl"];
            var apiKey = "pk_test_80b592e9af7489f22029ea591d89e1a1";
            var secret = "sk_test_9eFa1lpcb6gNw28lcUv2yz7/c5+PtQcx0NHUgCflbCoFiG9OAtaBloEB2MGlM/bd";

            var timestamp = DateTimeOffset.UtcNow
                .ToUnixTimeMilliseconds()
                .ToString();

            // ✅ Build strongly ordered object
            var requestObj = new LalamoveRequest
            {
                data = new LalamoveData
                {
                    serviceType = "SEDAN",
                    specialRequests = new[] { "PURCHASE_SERVICE_1" },
                    language = "en_PH",
                    stops = new[]
                    {
                    new Stop
                    {
                        coordinates = new Coordinates
                        {
                            lat = "14.707697",
                            lng = "121.069319"
                        },
                        address = "Innocentre, 72 Tat Chee Ave, Kowloon Tong"
                    },
                    new Stop
                    {
                        coordinates = new Coordinates
                        {
                            lat = "14.763525",
                            lng = "120.946117"
                        },
                        address = "Canton Rd, Tsim Sha Tsui"
                    }
                },
                    isRouteOptimized = false,
                    item = new Item
                    {
                        quantity = "12",
                        weight = "30Kg",
                        categories = new[] { "APPLIANCES" },
                        handlingInstructions = new[] { "KEEP_UPRIGHT" }
                    }
                }
            };


            var jsonOptions = new JsonSerializerOptions
            {
                PropertyNamingPolicy = null,
                WriteIndented = false
            };

            var jsonBody = JsonSerializer.Serialize(requestObj, jsonOptions);

            // ✅ Correct signature format (NO PH HERE)
            var rawSignature =
                timestamp + "\r\n" +
                "POST" + "\r\n" +
                "/v3/quotations" + "\r\n" +
                "\r\n" +                 // IMPORTANT BLANK LINE
                jsonBody;

            using var hmac = new HMACSHA256(
                Encoding.UTF8.GetBytes(secret)
            );

            var hash = hmac.ComputeHash(
                Encoding.UTF8.GetBytes(rawSignature)
            );

            var signature = BitConverter
                .ToString(hash)
                .Replace("-", "")
                .ToLower();
            var handler = new HttpClientHandler();

            handler.AutomaticDecompression =
                System.Net.DecompressionMethods.GZip |
                System.Net.DecompressionMethods.Deflate;

            using var client = new HttpClient(handler);

            // Disable distributed tracing for this request
            System.Diagnostics.Activity.Current = null;

            var request = new HttpRequestMessage(
                HttpMethod.Post,
                baseUrl + "/v3/quotations"
            );

            request.Headers.Add("Authorization",
                $"hmac {apiKey}:{timestamp}:{signature}");

            request.Headers.Add("X-LLM-Market", "PH");
            request.Headers.Add("X-LLM-Timestamp", timestamp);

            request.Content = new StringContent(
                jsonBody,
                Encoding.UTF8,
                "application/json"
            );

            var response = await client.SendAsync(request);
            var responseBody = await response.Content.ReadAsStringAsync();
            // DEBUG
            System.Diagnostics.Debug.WriteLine("RAW SIGNATURE:");
            System.Diagnostics.Debug.WriteLine(rawSignature);
            System.Diagnostics.Debug.WriteLine("FULL URL: " + request.RequestUri.ToString());
            System.Diagnostics.Debug.WriteLine("ABSOLUTE PATH: " + request.RequestUri.AbsolutePath);


            foreach (var header in request.Headers)
            {
                System.Diagnostics.Debug.WriteLine(header.Key + ": " + string.Join(",", header.Value));
            }

            foreach (var header in request.Content.Headers)
            {
                System.Diagnostics.Debug.WriteLine("CONTENT " + header.Key + ": " + string.Join(",", header.Value));
            }

            return StatusCode((int)response.StatusCode, responseBody);
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }
  */







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
}
