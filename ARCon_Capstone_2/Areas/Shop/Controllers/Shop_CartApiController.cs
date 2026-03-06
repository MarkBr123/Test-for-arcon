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


namespace ARCon_Capstone_2.Areas.Shop.Controllers;


[Route("api/shop/cart")]
public class Shop_CartApiController : Controller
{
    public readonly ARCon_Capstone_2_DbContext _context;
    public Shop_CartApiController(ARCon_Capstone_2_DbContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<IActionResult> AddToCart([FromBody] Shop_AddToCartDto dto)
    {
        var customerId = HttpContext.Session.GetInt32("UserId");
        var userType = HttpContext.Session.GetString("UserType");

        if (customerId == null || userType != "CUSTOMER")
        {
            return Unauthorized();
        }


        /////
        ///Stock Validation
        /////
        var productExists = await _context.products
            .AnyAsync(p => p.id == dto.ProductId);

        if (!productExists)
            return NotFound("Product not found.");

        // 🔹 Compute available stock from inventories table
        var availableStock = await _context.inventories
            .CountAsync(i =>
                i.product_id == dto.ProductId &&
                i.status == "GOOD_STOCK");

        if (availableStock <= 0)
            return BadRequest("Product is out of stock.");

        if (dto.Quantity <= 0)
            return BadRequest("Invalid quantity.");


        // Get or create cart
        var cart = await _context.carts.FirstOrDefaultAsync(c => c.customer_id == customerId);

        //if cart of customer does not exist yet
        if (cart == null)
        {
            cart = new cart
            {
                customer_id = customerId.Value
            };
            _context.carts.Add(cart);
            await _context.SaveChangesAsync();
        }

        // CHeck if same product + same service options already exists
        var existingItem = await _context.cart_items
            .FirstOrDefaultAsync(ci =>
                ci.cart_id == cart.id &&
                ci.product_id == dto.ProductId &&
                ci.std_installation_service_option_id == dto.StdInstallationServiceOptionId &&
                ci.additional_installation_service_option_id == dto.AdditionalInstallationServiceOptionId
            );

        if (existingItem != null)
        {
            existingItem.quantity += dto.Quantity;
        }
        else
        {
            var newItem = new cart_item
            {
                cart_id = cart.id,
                product_id = dto.ProductId,
                quantity = dto.Quantity,
                std_installation_service_option_id = dto.StdInstallationServiceOptionId,
                additional_installation_service_option_id = dto.AdditionalInstallationServiceOptionId
            };
            _context.cart_items.Add(newItem);
        }
        await _context.SaveChangesAsync();
        return Ok(new { message = "Added to cart" });
    }


    //get cart items
    [HttpGet]
    public async Task<IActionResult> GetMyCart()
    {
        var customerId = HttpContext.Session.GetInt32("UserId");
        var userType = HttpContext.Session.GetString("UserType");

        if (customerId == null || userType != "CUSTOMER")
            return Unauthorized();

        var cart = await _context.carts
            .FirstOrDefaultAsync(c => c.customer_id == customerId);

        if (cart == null)
            return Ok(new List<object>());

        var items = await (
            from ci in _context.cart_items
             

            join p in _context.products
                on ci.product_id equals p.id

            join std in _context.installation_std_service_options
                on ci.std_installation_service_option_id equals std.id
                into stdJoin
            from std in stdJoin.DefaultIfEmpty()

            join add in _context.installation_additional_service_options
                on ci.additional_installation_service_option_id equals add.id
                into addJoin
            from add in addJoin.DefaultIfEmpty()

            where ci.cart_id == cart.id
            && ci.isselected == false
            select new Shop_CartItemDto
            {
                CartItemId = ci.id,
                IsSelected = ci.isselected,
                ProductId = p.id,
                BrandName = p.manufacturer.brand_name,
                ProductSeries = p.product_series,
                ProductModel = p.product_model,
                Sku = p.sku,
                ProductPrice = p.actual_selling_price,
                Quantity = ci.quantity,

                StdDescription = std != null ? std.description : null,
                StdPrice = std != null ? std.price : 0,

                AddDescription = add != null ? add.description : null,
                AddPrice = add != null ? add.price : 0,

                UnitTotal =
                    p.actual_selling_price
                    + (std != null ? std.price : 0)
                    + (add != null ? add.price : 0),

                        Subtotal =
                    (p.actual_selling_price
                    + (std != null ? std.price : 0)
                    + (add != null ? add.price : 0))
                    * ci.quantity
                    }
            
        ).ToListAsync();
        return Ok(items);
    }


    //delete
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCartItem(int id)
    {
        var customerId = HttpContext.Session.GetInt32("UserId");
        var userType = HttpContext.Session.GetString("UserType");

        if (customerId == null || userType != "CUSTOMER")
            return Unauthorized();

        var cartItem = await _context.cart_items
            .Include(ci => ci.cart)
            .FirstOrDefaultAsync(ci => ci.id == id);

        if (cartItem == null || cartItem.cart.customer_id != customerId)
            return Unauthorized();

        _context.cart_items.Remove(cartItem);
        await _context.SaveChangesAsync();

        return Ok();
    }
}

