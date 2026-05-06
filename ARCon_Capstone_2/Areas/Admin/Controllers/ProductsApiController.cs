using ARCon_Capstone_2.Data;
using ARCon_Capstone_2.DTOs;
using ARCon_Capstone_2.Models;
using CloudinaryDotNet.Actions;
using CloudinaryDotNet;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[AllowAnonymous]
//[Area("Admin")]
[ApiController]
[Route("admin/api/products")]
public class ProductsApiController : ControllerBase
{
    private readonly ARCon_Capstone_2_DbContext _context;
    public readonly Cloudinary _cloudinary;

    public ProductsApiController(ARCon_Capstone_2_DbContext context, Cloudinary cloudinary)
    {
        _context = context;
        _cloudinary = cloudinary;
    }

    [HttpPost("add")]
    public async Task<IActionResult> Add([FromBody] AddProductsDto dto)
    {
        using var tx = await _context.Database.BeginTransactionAsync();

        // basic null check
        if (dto == null)
            return BadRequest("Request body is required.");

        // required field
        if (dto.ManufacturerId <= 0)
            return BadRequest("Manufacturer is required.");

        if (dto.FormFactorID <= 0)
            return BadRequest("Form factor is required.");

        if (string.IsNullOrWhiteSpace(dto.ProductModel))
            return BadRequest("Product model is required.");

        if (string.IsNullOrWhiteSpace(dto.ProductSeries))
            return BadRequest("Product series is required.");

        if (string.IsNullOrWhiteSpace(dto.PartNumberA))
            return BadRequest("Part number A is required.");

        // price validation
        if (dto.OriginalSellingPrice <= 0)
            return BadRequest("Original selling price must be greater than 0.");

        if (dto.DiscountValue < 0)
            return BadRequest("Discount value cannot be negative.");

        // weight validation
        if (dto.GrossWeightA < 0 || dto.GrossWeightB < 0)
            return BadRequest("Gross weight cannot be negative.");

        // warranty validation
        if (dto.ManufacturerWarrantyYears < 0)
            return BadRequest("Warranty years cannot be negative.");

        if (dto.OutrightReplacementDays < 0)
            return BadRequest("Replacement days cannot be negative.");

        // reorder level
        if (dto.ReorderLevel < 0)
            return BadRequest("Reorder level cannot be negative.");

        try
        {
            // Normalize discount type
            var discountType = (dto.DiscountType ?? "NONE").Trim().ToUpper();

            // Compute prices
            decimal actualSellingPrice;
            decimal discountedSellingPrice;

            switch (discountType)
            {
                case "NONE":
                    actualSellingPrice = dto.OriginalSellingPrice;
                    discountedSellingPrice = 0;
                    break;

                case "PERCENTAGE":
                    if (dto.DiscountValue <= 0 || dto.DiscountValue > 100)
                        return BadRequest("Invalid discount percentage.");

                    actualSellingPrice =
                        dto.OriginalSellingPrice -
                        (dto.OriginalSellingPrice * dto.DiscountValue / 100m);
                    discountedSellingPrice = actualSellingPrice;
                    break;

                case "AMOUNT":
                    if (dto.DiscountValue <= 0 || dto.DiscountValue >= dto.OriginalSellingPrice)
                        return BadRequest("Invalid discount amount.");

                    actualSellingPrice =
                        dto.OriginalSellingPrice - dto.DiscountValue;
                    discountedSellingPrice = actualSellingPrice;
                    break;

                default:
                    return BadRequest($"Invalid discount type: '{dto.DiscountType}'");
            }

            // Compute weight
            decimal totalGrossWeight = dto.GrossWeightA + dto.GrossWeightB;

            // Normalize URL
            if (!string.IsNullOrWhiteSpace(dto.ArUrl) &&
                !dto.ArUrl.StartsWith("http://") &&
                !dto.ArUrl.StartsWith("https://"))
            {
                dto.ArUrl = "https://" + dto.ArUrl;
            }

            // SKU generation helpers
            string NormalizeCode(string input) =>
                new string(input.Trim().ToUpper().Where(char.IsLetter).Take(3).ToArray());

            async Task<int> GetNextSkuSequence(string manufacturerCode, string formFactorCode)
            {
                var prefix = $"{manufacturerCode}-{formFactorCode}";

                var lastSku = await _context.products
                    .Where(p => p.sku.StartsWith(prefix))
                    .OrderByDescending(p => p.sku)
                    .Select(p => p.sku)
                    .FirstOrDefaultAsync();

                if (lastSku == null)
                    return 1;

                var numberPart = lastSku.Substring(lastSku.Length - 5);
                return int.Parse(numberPart) + 1;
            }

            async Task<string> GenerateSku(int manufacturerId, int formFactorId)
            {
                var manufacturerName = await _context.manufacturers
                    .Where(m => m.ID == manufacturerId)
                    .Select(m => m.manufacturer_name)
                    .FirstAsync();

                var formFactorName = await _context.form_factors
                    .Where(f => f.id == formFactorId)
                    .Select(f => f.form_factor1)
                    .FirstAsync();

                var manufacturerCode = NormalizeCode(manufacturerName);
                var formFactorCode = NormalizeCode(formFactorName);

                var nextNumber = await GetNextSkuSequence(manufacturerCode, formFactorCode);

                return $"{manufacturerCode}-{formFactorCode}{nextNumber:D5}";
            }

            var sku = await GenerateSku(dto.ManufacturerId, dto.FormFactorID);

            // Create product
            var product = new product
            {
                manufacturer_id = dto.ManufacturerId,
                form_factor_id = dto.FormFactorID,
                product_model = dto.ProductModel.ToUpper(),
                product_series = dto.ProductSeries.ToUpper(),
                sku = sku,
                part_number_a = dto.PartNumberA.ToUpper(),
                part_number_b = dto.PartNumberB?.ToUpper(),
                original_selling_price = dto.OriginalSellingPrice,
                discounted_selling_price = discountedSellingPrice,
                discount_type = discountType,
                discount_value = dto.DiscountValue,
                actual_selling_price = actualSellingPrice,
                ar_url = dto.ArUrl,
                manufacturer_warranty_years = dto.ManufacturerWarrantyYears,
                outright_replacement_days = dto.OutrightReplacementDays,
                gross_weight_a = dto.GrossWeightA,
                gross_weight_b = dto.GrossWeightB,
                total_gross_weight = totalGrossWeight,
                reorder_level = dto.ReorderLevel,
                status = "ACTIVE",
            };

            _context.products.Add(product);
            await _context.SaveChangesAsync();

            // TECHNOLOGIES
            if (dto.Technologies != null)
            {
                foreach (var t in dto.Technologies)
                {
                    var name = t.TechnologyName.Trim().ToUpper();

                    var tech = await _context.technology_types
                        .FirstOrDefaultAsync(x => x.technology_name == name);

                    if (tech == null)
                    {
                        tech = new technology_type
                        {
                            technology_name = name,
                            technology_desc = t.TechnologyDesc
                        };
                        _context.technology_types.Add(tech);
                        await _context.SaveChangesAsync();
                    }

                    _context.product_technologies.Add(new product_technology
                    {
                        product_id = product.id,
                        technology_id = tech.id
                    });
                }
            }

            // SPECIFICATIONS
            if (dto.Specifications != null)
            {
                foreach (var s in dto.Specifications)
                {
                    var exists = await _context.specification_keys
                        .AnyAsync(k => k.id == s.KeyId);

                    if (!exists)
                        return BadRequest("Invalid specification key.");

                    _context.technical_specifications.Add(new technical_specification
                    {
                        product_id = product.id,
                        key_id = s.KeyId,
                        value = s.Value
                    });
                }
            }

            // TAGS
            if (dto.Tags != null)
            {
                foreach (var raw in dto.Tags.Distinct())
                {
                    var name = raw.Trim().ToUpper();

                    var tag = await _context.tags
                        .FirstOrDefaultAsync(x => x.tag_name == name);

                    if (tag == null)
                    {
                        tag = new tag { tag_name = name };
                        _context.tags.Add(tag);
                        await _context.SaveChangesAsync();
                    }

                    _context.product_tags.Add(new product_tag
                    {
                        product_id = product.id,
                        tag_id = tag.id
                    });
                }
            }

            await _context.SaveChangesAsync();
            await tx.CommitAsync();

            return Ok(new { product.id });
        }
        catch (Exception ex)
        {
            await tx.RollbackAsync();
            return BadRequest(ex.Message);
        }
    }



    [HttpGet]
    public async Task<IActionResult> GetAll(int page = 1,
    int pageSize = 24, string sortBy = "date", string sortDir = "desc", string? search = null)
    {
        var query = _context.products
            .Where(p => p.status.ToUpper() != "ARCHIVED")
            .Include(p => p.manufacturer)
            .Include(p => p.form_factor)
            .AsQueryable();


        // SEARCH 
        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.Trim();

            query = query.Where(p =>
                EF.Functions.ILike(p.sku ?? "", $"%{search}%") ||
                EF.Functions.ILike(p.manufacturer.manufacturer_name ?? "", $"%{search}%") ||
                EF.Functions.ILike(p.form_factor.form_factor1 ?? "", $"%{search}%") ||
                EF.Functions.ILike(p.product_model ?? "", $"%{search}%") ||
                EF.Functions.ILike(p.product_series ?? "", $"%{search}%") ||
                EF.Functions.ILike(p.part_number_a ?? "", $"%{search}%") ||
                EF.Functions.ILike(p.part_number_b ?? "", $"%{search}%")
            );
        }

        bool asc = sortDir.ToLower() == "asc";

        query = sortBy switch
        {
            "sku" => asc
                ? query.OrderBy(p => p.sku)
                : query.OrderByDescending(p => p.sku),
            "manufacturer" => asc
                ? query.OrderBy(p => p.manufacturer.manufacturer_name)
                : query.OrderByDescending(p => p.manufacturer.manufacturer_name),
            "productModel" => asc
                ? query.OrderBy(p => p.product_model)
                : query.OrderByDescending(p => p.product_model),
            "productSeries" => asc
               ? query.OrderBy(p => p.product_series)
               : query.OrderByDescending(p => p.product_series),
            "formfactor" => asc
                ? query.OrderBy(p => p.form_factor.form_factor1)
                : query.OrderByDescending(p => p.form_factor.form_factor1),
            "originalSellingPrice" => asc
                ? query.OrderBy(p => p.original_selling_price)
                : query.OrderByDescending(p => p.original_selling_price),
            "actualPrice" => asc
                ? query.OrderBy(p => p.actual_selling_price)
                : query.OrderByDescending(p => p.actual_selling_price),
            "status" => asc
                ? query.OrderBy(p => p.status)
                : query.OrderByDescending(p => p.status),
            "discountType" => asc
                ? query.OrderBy(p => p.discount_type)
                : query.OrderByDescending(p => p.discount_type),
            "discountValue" => asc
                ? query.OrderBy(p => p.discount_value)
                : query.OrderByDescending(p => p.discount_value),
            "createDate" => asc
                ? query.OrderBy(p => p.created_at)
                : query.OrderByDescending(p => p.created_at),
            _ => asc
                ? query.OrderBy(p => p.created_at)
                : query.OrderByDescending(p => p.created_at),

        };

        var totalCount = await query.CountAsync();
        var items = await query
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .Select(p => new
        {
            p.id,
            p.sku,
            manufacturer = p.manufacturer.manufacturer_name,
            p.product_model,
            p.product_series,
            formfactor = p.form_factor.form_factor1,
            p.original_selling_price,
            p.actual_selling_price,
            p.status,
            p.discount_type,
            p.ar_url,
            p.discount_value,
            p.created_at,
        })

        .ToListAsync();

        return Ok(new
        {
            items,
            totalCount
        });
    }




    [HttpDelete("{id}")]
    public async Task<IActionResult> Archive(int id)
    {
        var product = await _context.products.FindAsync(id);
        if (product == null)
            return NotFound();

        product.status = "ARCHIVED";
        product.updated_at = DateTime.UtcNow;

        var affected = await _context.SaveChangesAsync();
        Console.WriteLine($"ROWS AFFECTED: {affected}");

        return Ok(new
        {
            id = product.id,
            status = product.status,
            affected
        });
    }

    // for product summary (admin)
    [HttpGet("summary/{id}")]
    public async Task<IActionResult> GetProductDetails(int id)
    {
        // 🔴 validation
        if (id <= 0)
            return BadRequest("Invalid product id.");

        var product = await _context.products
            .Include(p => p.form_factor)
            .Include(p => p.manufacturer)
            .FirstOrDefaultAsync(p => p.id == id);

        if (product == null)
            return NotFound("Product not found.");

        // ---- STOCK
        var availableStock = await _context.inventories
            .CountAsync(i => i.product_id == id && i.status == "GOOD_STOCK");

        var inStock = availableStock > 0;

        // ---- IMAGES
        var images = await _context.products_medias
            .Where(pm => pm.product_id == id)
            .OrderByDescending(pm => pm.is_primary)
            .Select(pm => pm.media.url)
            .ToListAsync();

        // ---- SPECIFICATIONS
        var specifications = await _context.technical_specifications
            .Where(ts => ts.product_id == id)
            .Join(
                _context.specification_keys,
                ts => ts.key_id,
                sk => sk.id,
                (ts, sk) => new
                {
                    key = sk.keyname,
                    value = ts.value
                }
            )
            .OrderBy(x => x.key)
            .ToListAsync();

        // ---- TAGS
        var tags = await _context.product_tags
            .Where(pt => pt.product_id == id)
            .Join(
                _context.tags,
                pt => pt.tag_id,
                t => t.id,
                (pt, t) => t.tag_name
            )
            .OrderBy(t => t)
            .ToListAsync();

        // ---- TECHNOLOGIES
        var technologies = await _context.product_technologies
            .Where(pt => pt.product_id == id)
            .Join(
                _context.technology_types,
                pt => pt.technology_id,
                tt => tt.id,
                (pt, tt) => new
                {
                    id = tt.id,
                    name = tt.technology_name,
                    description = tt.technology_desc
                }
            )
            .OrderBy(t => t.name)
            .ToListAsync();

        var result = new
        {
            //basic info
            sku = product.sku,
            product_Model = product.product_model,
            product_Series = product.product_series,
            part_Number_A = product.part_number_a,
            part_Number_B = product.part_number_b,
            form_factor = product.form_factor?.form_factor1,
            manufacturer = product.manufacturer?.manufacturer_name,
            status = product.status,
            original_Selling_Price = product.original_selling_price,
            discounted_Selling_Price = product.discounted_selling_price,
            discount_Type = product.discount_type,
            discount_Value = product.discount_value,
            actual_Selling_Price = product.actual_selling_price,
            ar_url = product.ar_url,
            created_At = product.created_at,
            updated_At = product.updated_at,
            manufacturer_Warranty_Years = product.manufacturer_warranty_years,
            outright_Replacement_Days = product.outright_replacement_days,
            gross_Weight_A = product.gross_weight_a,
            gross_Weight_B = product.gross_weight_b,
            total_Gross_Weight = product.total_gross_weight,
            reorder_level = product.reorder_level,

            available_Stock = availableStock,
            in_Stock = inStock,

            // ---- IMAGES
            images = images,

            //details query from multiple tables (Joined)
            specifications = specifications,
            tags = tags,
            technologies = technologies
        };

        return Ok(result);
    }





    //// for product summary (shop)
    [HttpGet("details/{id}")]
    public async Task<IActionResult> GetProductSummary(int id)
    {

        var product = await _context.products
            .Include(p => p.form_factor)
            .Include(p => p.manufacturer)

            .FirstOrDefaultAsync(p => p.id == id);

        if (product == null)
            return NotFound();

        // ---- STOCK
        var availableStock = await _context.inventories
            .CountAsync(i => i.product_id == id && i.status == "GOOD_STOCK");

        var inStock = availableStock > 0;

        // ---- IMAGES
        var images = await _context.products_medias
            .Where(pm => pm.product_id == id)
            .OrderByDescending(pm => pm.is_primary)
            .Select(pm => pm.media.url)
            .ToListAsync();

        // -- spec (key-value pairs)
        var specifications = await _context.technical_specifications
            .Where(ts => ts.product_id == id)
            .Join(
            _context.specification_keys,
            ts => ts.key_id,
            sk => sk.id,
            (ts, sk) => new
            {
                key = sk.keyname,
                value = ts.value,
            }
        )
            .OrderBy(x => x.key)
            .ToListAsync();

        var tags = await _context.product_tags
            .Where(pt => pt.product_id == id)
            .Join(
                _context.tags,
                pt => pt.tag_id,
                t => t.id,
                (pt, t) => t.tag_name
            )
            .OrderBy(t => t)
            .ToListAsync();

        var technologies = await _context.product_technologies
            .Where(pt => pt.product_id == id)
            .Join(
                _context.technology_types,
                pt => pt.technology_id,
                tt => tt.id,
                (pt, tt) => new
                {
                    id = tt.id,
                    name = tt.technology_name,
                    description = tt.technology_desc
                }
            )
            .OrderBy(t => t.name)
            .ToListAsync();
        var result = new Shop_ProductDetailsDto
        {
            //basic info
            ProductId = product.id,
            Sku = product.sku,
            ProductModel = product.product_model,
            ProductSeries = product.product_series,
            PartNumberA = product.part_number_a,
            PartNumberB = product.part_number_b,

            FormFactor = product.form_factor.form_factor1,
            BrandName = product.manufacturer.brand_name,

            Status = product.status,

            OriginalSellingPrice = product.original_selling_price,
            DiscountedSellingPrice = product.discounted_selling_price,
            DiscountType = product.discount_type,
            DiscountValue = product.discount_value,
            ActualSellingPrice = product.actual_selling_price,

            ArUrl = product.ar_url,

            ManufacturerWarrantyYears = product.manufacturer_warranty_years,
            OutrightReplacementDays = product.outright_replacement_days,

            GrossWeightA = product.gross_weight_a,
            GrossWeightB = product.gross_weight_b,
            TotalGrossWeight = product.total_gross_weight,

            ReorderLevel = product.reorder_level,

            AvailableStock = availableStock,
            InStock = inStock,

            Images = images,

            Specifications = specifications
        .Select(s => new Shop_SpecificationDto
        {
            Key = s.key,
            Value = s.value
        }).ToList(),

            Tags = tags,

            Technologies = technologies
        .Select(t => new Shop_TechnologyDto
        {
            Id = t.id,
            Name = t.name,
            Description = t.description
        }).ToList()
        };
        return Ok(result);
    }




    //Update Product
    [HttpPut("{id}")]
    public async Task<IActionResult> EditProduct(int id, [FromBody] EditProductDto dto)
    {
        // VALIDATION
        // =========================================
        // REQUIRED TEXT FIELDS
        // =========================================

        if (string.IsNullOrWhiteSpace(dto.ProductModel))
            return BadRequest("Product model is required.");

        if (string.IsNullOrWhiteSpace(dto.ProductSeries))
            return BadRequest("Product series is required.");

        if (string.IsNullOrWhiteSpace(dto.PartNumberA))
            return BadRequest("Part number A is required.");

        if (dto.OriginalSellingPrice <= 0)
        {
            return BadRequest(
                "Original selling price must be greater than 0."
            );
        }

        if (dto.DiscountValue < 0)
        {
            return BadRequest(
                "Discount value cannot be negative."
            );
        }


        var discountType = (dto.DiscountType ?? "NONE")
            .Trim()
            .ToUpper();

        if (discountType != "NONE" &&
            discountType != "PERCENTAGE" &&
            discountType != "AMOUNT")
        {
            return BadRequest("Invalid discount type.");
        }

        if (discountType == "PERCENTAGE")
        {
            if (dto.DiscountValue <= 0 ||
                dto.DiscountValue > 100)
            {
                return BadRequest(
                    "Discount percentage must be between 1 and 100."
                );
            }
        }

        if (discountType == "AMOUNT")
        {
            if (dto.DiscountValue <= 0)
            {
                return BadRequest(
                    "Discount amount must be greater than 0."
                );
            }

            if (dto.DiscountValue >= dto.OriginalSellingPrice)
            {
                return BadRequest(
                    "Discount amount cannot exceed original selling price."
                );
            }
        }


        if (dto.GrossWeightA < 0)
        {
            return BadRequest(
                "Gross weight A cannot be negative."
            );
        }

        if (dto.GrossWeightB < 0)
        {
            return BadRequest(
                "Gross weight B cannot be negative."
            );
        }

        if (dto.ManufacturerWarrantyYears < 0)
        {
            return BadRequest(
                "Manufacturer warranty years cannot be negative."
            );
        }

        if (dto.OutrightReplacementDays < 0)
        {
            return BadRequest(
                "Outright replacement days cannot be negative."
            );
        }


        if (dto.Technologies != null)
        {
            foreach (var tech in dto.Technologies)
            {
                if (string.IsNullOrWhiteSpace(
                    tech.TechnologyName))
                {
                    return BadRequest(
                        "Technology name is required."
                    );
                }
            }
        }

        if (dto.Specifications != null)
        {
            foreach (var spec in dto.Specifications)
            {
                if (string.IsNullOrWhiteSpace(spec.Value))
                {
                    return BadRequest(
                        "Specification value is required."
                    );
                }
            }
        }

        if (dto.Tags != null)
        {
            foreach (var tag in dto.Tags)
            {
                if (string.IsNullOrWhiteSpace(tag))
                {
                    return BadRequest(
                        "Tag cannot be empty."
                    );
                }
            }
        }

        using var tx = await _context.Database.BeginTransactionAsync();

        try
        {
            var product = await _context.products
                .FirstOrDefaultAsync(p => p.id == id);

            if (product == null)
                return NotFound("Product not found.");

            // PRICE VALIDATION
            if (dto.OriginalSellingPrice <= 0)
                return BadRequest("Original selling price must be greater than 0.");

            if (dto.DiscountValue < 0)
                return BadRequest("Discount value cannot be negative.");

            // WEIGHT VALIDATION
            if (dto.GrossWeightA < 0 || dto.GrossWeightB < 0)
                return BadRequest("Gross weight cannot be negative.");

            // WARRANTY VALIDATION
            if (dto.ManufacturerWarrantyYears < 0)
                return BadRequest("Warranty years cannot be negative.");

            if (dto.OutrightReplacementDays < 0)
                return BadRequest("Replacement days cannot be negative.");


            decimal actualSellingPrice;
            decimal discountedSellingPrice;

            // COMPUTE PRICE
            switch (discountType)
            {
                case "NONE":
                    actualSellingPrice = dto.OriginalSellingPrice;
                    discountedSellingPrice = 0;
                    break;

                case "PERCENTAGE":
                    if (dto.DiscountValue <= 0 || dto.DiscountValue > 100)
                        return BadRequest("Invalid discount percentage.");

                    actualSellingPrice =
                        dto.OriginalSellingPrice -
                        (dto.OriginalSellingPrice * dto.DiscountValue / 100m);

                    discountedSellingPrice = actualSellingPrice;
                    break;

                case "AMOUNT":
                    if (dto.DiscountValue <= 0 ||
                        dto.DiscountValue >= dto.OriginalSellingPrice)
                    {
                        return BadRequest("Invalid discount amount.");
                    }

                    actualSellingPrice =
                        dto.OriginalSellingPrice - dto.DiscountValue;

                    discountedSellingPrice = actualSellingPrice;
                    break;

                default:
                    return BadRequest("Invalid discount type.");
            }

            // NORMALIZE URL
            if (!string.IsNullOrWhiteSpace(dto.ArUrl) &&
                !dto.ArUrl.StartsWith("http://") &&
                !dto.ArUrl.StartsWith("https://"))
            {
                dto.ArUrl = "https://" + dto.ArUrl;
            }

            // UPDATE PRODUCT

            product.product_model = dto.ProductModel.ToUpper();
            product.product_series = dto.ProductSeries.ToUpper();
            product.part_number_a = dto.PartNumberA.ToUpper();
            product.part_number_b = dto.PartNumberB?.ToUpper();
            product.original_selling_price = dto.OriginalSellingPrice;
            product.discounted_selling_price = discountedSellingPrice;
            product.discount_type = discountType;
            product.discount_value = dto.DiscountValue;
            product.actual_selling_price = actualSellingPrice;

            product.ar_url = dto.ArUrl;

            product.manufacturer_warranty_years =
                dto.ManufacturerWarrantyYears;

            product.outright_replacement_days =
                dto.OutrightReplacementDays;

            product.gross_weight_a = dto.GrossWeightA;
            product.gross_weight_b = dto.GrossWeightB;

            product.total_gross_weight =
                dto.GrossWeightA + dto.GrossWeightB;

            product.updated_at = DateTime.UtcNow;


            //  REPLACE SPECIFICATIONS


            var existingSpecifications =
                _context.technical_specifications
                    .Where(x => x.product_id == id);

            _context.technical_specifications
                .RemoveRange(existingSpecifications);

            if (dto.Specifications != null)
            {
                foreach (var s in dto.Specifications)
                {
                    // skip empty values
                    if (string.IsNullOrWhiteSpace(s.Value))
                        continue;

                    int keyId = s.KeyId;

                    // 🔹 fallback lookup by key name
                    if (keyId <= 0 && !string.IsNullOrWhiteSpace(s.Key))
                    {
                        keyId = await _context.specification_keys
                            .Where(x => x.keyname == s.Key)
                            .Select(x => x.id)
                            .FirstOrDefaultAsync();
                    }

                    // skip if still invalid
                    if (keyId <= 0)
                        continue;

                    _context.technical_specifications.Add(
                        new technical_specification
                        {
                            product_id = id,
                            key_id = keyId,
                            value = s.Value
                        });
                }
            }

            // REPLACE TAGS


            var existingTags = _context.product_tags
                .Where(x => x.product_id == id);

            _context.product_tags.RemoveRange(existingTags);

            if (dto.Tags != null)
            {
                foreach (var raw in dto.Tags.Distinct())
                {
                    if (string.IsNullOrWhiteSpace(raw))
                        return BadRequest("Invalid tag.");

                    var name = raw.Trim().ToUpper();

                    var tag = await _context.tags
                        .FirstOrDefaultAsync(x => x.tag_name == name);

                    if (tag == null)
                    {
                        tag = new tag
                        {
                            tag_name = name
                        };

                        _context.tags.Add(tag);
                        await _context.SaveChangesAsync();
                    }

                    _context.product_tags.Add(new product_tag
                    {
                        product_id = id,
                        tag_id = tag.id
                    });
                }
            }

            // REPLACE TECHNOLOGIES

            var existingTechnologies =
                _context.product_technologies
                    .Where(x => x.product_id == id);

            _context.product_technologies
                .RemoveRange(existingTechnologies);

            if (dto.Technologies != null)
            {
                foreach (var t in dto.Technologies)
                {
                    if (string.IsNullOrWhiteSpace(t.TechnologyName))
                        return BadRequest("Technology name is required.");

                    var name = t.TechnologyName
                        .Trim()
                        .ToUpper();

                    var tech = await _context.technology_types
                        .FirstOrDefaultAsync(x =>
                            x.technology_name == name);

                    if (tech == null)
                    {
                        tech = new technology_type
                        {
                            technology_name = name,
                            technology_desc = t.TechnologyDesc
                        };

                        _context.technology_types.Add(tech);
                        await _context.SaveChangesAsync();
                    }

                    _context.product_technologies
                        .Add(new product_technology
                        {
                            product_id = id,
                            technology_id = tech.id
                        });
                }
            }

            await _context.SaveChangesAsync();
            await tx.CommitAsync();

            return Ok(new
            {
                message = "Product updated successfully."
            });
        }
        catch (Exception)
        {
            await tx.RollbackAsync();

            return BadRequest(
                "Something went wrong while updating the product."
            );
        }
    }





    // paired with update
    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        var p = await _context.products
            .Where(x => x.id == id)
            .Select(x => new
            {
                x.id,
                x.part_number_a,
                x.part_number_b,
                x.status,
                x.original_selling_price,
                x.discount_type,
                x.discount_value,
                x.discounted_selling_price,
                x.isdiscounted,
                x.has_installation_service,
                x.actual_selling_price,
                x.ar_url,
                x.manufacturer_warranty_years,
                x.outright_replacement_days,
                x.gross_weight_a,
                x.gross_weight_b,
                x.total_gross_weight,
                x.reorder_level,
            })
            .FirstOrDefaultAsync();

        if (p == null) return NotFound();
        return Ok(p);
    }
    //get spec for updateAPI
    [HttpGet("{id}/specs")]
    public async Task<IActionResult> GetSpecs(int id)
    {
        var specs = await _context.technical_specifications
            .Where(ts => ts.product_id == id)
            .Join(
                _context.specification_keys,
                ts => ts.key_id,
                sk => sk.id,
                (ts, sk) => new
                {
                    specId = ts.id,        // REQUIRED for updates
                    keyName = sk.keyname, // display only
                    value = ts.value
                }
            )
            .OrderBy(x => x.keyName)
            .ToListAsync();

        return Ok(specs);
    }



    //save spec for updateAPI 
    [HttpPut("{id}/specs")]
    public async Task<IActionResult> UpdateSpecs(
    int id,
    [FromBody] List<SpecUpdateDto> specs)
    {
        if (specs == null || specs.Count == 0)
            return BadRequest("No specifications provided");

        var specIds = specs.Select(s => s.SpecId).ToList();

        var existingSpecs = await _context.technical_specifications
            .Where(s => specIds.Contains(s.id) && s.product_id == id)
            .ToListAsync();

        foreach (var spec in existingSpecs)
        {
            var dto = specs.First(s => s.SpecId == spec.id);
            spec.value = dto.Value;
        }

        await _context.SaveChangesAsync();
        return Ok();
    }



    //API to search products (to be used in PO)
    [HttpGet("po-search")]
    public async Task<IActionResult> SearchProducts(string search = "")
    {
        var query = _context.products
            .Include(p => p.manufacturer)
            .Include(p => p.form_factor)
            .Where(p => p.status != "ARCHIVED")
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.Trim();

            query = query.Where(p =>
                EF.Functions.ILike(p.sku ?? "", $"%{search}%") ||
                EF.Functions.ILike(p.product_model ?? "", $"%{search}%") ||
                EF.Functions.ILike(p.product_series ?? "", $"%{search}%") ||
                EF.Functions.ILike(p.manufacturer.manufacturer_name ?? "", $"%{search}%") ||
                EF.Functions.ILike(p.form_factor.form_factor1 ?? "", $"%{search}%")
            );
        }

        var products = await query
            .Take(20)
            .Select(p => new
            {
                p.id,
                p.sku,
                manufacturer = p.manufacturer.manufacturer_name,
                form_factor = p.form_factor.form_factor1,
                p.product_model,
                p.product_series,
                p.part_number_a,
                p.total_gross_weight
            })
            .ToListAsync();

        return Ok(products);
    }




    /// Medias // <summary>
    ///Medias //
    /// </summary>
    /// <param name="id"></param>
    /// <param name="dto"></param>
    /// <returns></returns>upload media
    [HttpPost("{id}/images")]
    public async Task<IActionResult> UploadImages(
       int id,
       [FromForm] ProductMediaUploadDto dto)
    {
        if (dto.files == null || dto.files.Count == 0)
            return BadRequest("No files uploaded.");

        var product = await _context.products
            .Include(p => p.products_media)
            .FirstOrDefaultAsync(p => p.id == id);

        if (product == null)
            return NotFound("Product not found.");

        using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            for (int i = 0; i < dto.files.Count; i++)
            {
                var file = dto.files[i];

                // ===== Upload to Cloudinary =====
                await using var stream = file.OpenReadStream();

                var uploadParams = new ImageUploadParams
                {
                    File = new FileDescription(file.FileName, stream),
                    Folder = "products",
                    UseFilename = true,
                    UniqueFilename = true,
                    Overwrite = false
                };

                var uploadResult = await _cloudinary.UploadAsync(uploadParams);

                if (uploadResult.Error != null)
                    throw new Exception(uploadResult.Error.Message);

                // ===== Save media_url =====
                var media = new media_url
                {
                    url = uploadResult.Url.ToString(),
                    secure_id = uploadResult.SecureUrl.ToString(),
                    public_id = uploadResult.PublicId,
                    folder = "products",
                    file_name = file.FileName,
                    mime_type = file.ContentType,
                    file_size = file.Length,
                    storage_provider = "cloudinary",
                    created_at = DateTime.UtcNow,
                    is_deleted = false
                };

                _context.media_urls.Add(media);
                await _context.SaveChangesAsync();

                // ===== Handle Primary Image =====
                bool isPrimary = false;

                if (dto.PrimaryIndex.HasValue && dto.PrimaryIndex == i)
                {
                    // Remove old primary if exists
                    var oldPrimary = product.products_media
                        .FirstOrDefault(pm => pm.is_primary);

                    if (oldPrimary != null)
                        oldPrimary.is_primary = false;

                    isPrimary = true;
                }

                // ===== Link to Product =====
                var productMedia = new products_media
                {
                    product_id = id,
                    media_id = media.id,
                    is_primary = isPrimary
                };

                _context.products_medias.Add(productMedia);
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(new { message = "Images uploaded successfully." });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, ex.Message);
        }
    }

    [HttpGet("{id}/images")]
    public async Task<IActionResult> GetProductImages(int id)
    {
        var productExists = await _context.products
            .AnyAsync(x => x.id == id);

        if (!productExists)
            return NotFound("Product not found.");

        var images = await _context.products_medias
            .Where(x => x.product_id == id)
            .Select(x => new
            {
                mediaId = x.media.id,
                url = x.media.url,
                isPrimary = x.is_primary
            })
            .ToListAsync();

        return Ok(images);
    }

    [HttpPut("{id}/images")]
    public async Task<IActionResult> EditImages(
    int id,
    [FromForm] EditProductImagesDto dto)
    {
        var product = await _context.products
            .Include(x => x.products_media)
            .ThenInclude(x => x.media)
            .FirstOrDefaultAsync(x => x.id == id);

        if (product == null)
            return NotFound("Product not found.");

        using var tx = await _context.Database.BeginTransactionAsync();

        try
        {

            // DELETE REMOVED IMAGES


            var imagesToDelete = product.products_media
                .Where(x => dto.ExistingMediaIds
                    == null ||
                    !dto.ExistingMediaIds.Contains(x.media_id))
                .ToList();

            foreach (var img in imagesToDelete)
            {
                // cloudinary delete
                if (!string.IsNullOrWhiteSpace(img.media.public_id))
                {
                    await _cloudinary.DestroyAsync(
                        new DeletionParams(img.media.public_id)
                    );
                }

                _context.products_medias.Remove(img);
                _context.media_urls.Remove(img.media);
            }


            // UPLOAD NEW FILES


            if (dto.NewFiles != null)
            {
                foreach (var file in dto.NewFiles)
                {
                    await using var stream =
                        file.OpenReadStream();

                    var uploadParams = new ImageUploadParams
                    {
                        File = new FileDescription(
                            file.FileName,
                            stream
                        ),

                        Folder = "products",
                        UseFilename = true,
                        UniqueFilename = true,
                        Overwrite = false
                    };

                    var uploadResult =
                        await _cloudinary.UploadAsync(uploadParams);

                    if (uploadResult.Error != null)
                        throw new Exception(uploadResult.Error.Message);

                    var media = new media_url
                    {
                        url = uploadResult.Url.ToString(),
                        secure_id = uploadResult.SecureUrl.ToString(),
                        public_id = uploadResult.PublicId,
                        folder = "products",
                        file_name = file.FileName,
                        mime_type = file.ContentType,
                        file_size = file.Length,
                        storage_provider = "cloudinary",
                        created_at = DateTime.UtcNow,
                        is_deleted = false
                    };

                    _context.media_urls.Add(media);
                    await _context.SaveChangesAsync();

                    _context.products_medias.Add(
                        new products_media
                        {
                            product_id = id,
                            media_id = media.id,
                            is_primary = false
                        });
                }
            }


            // UPDATE PRIMARY


            var allImages = await _context.products_medias
                .Where(x => x.product_id == id)
                .ToListAsync();

            foreach (var img in allImages)
            {
                img.is_primary =
                    img.media_id == dto.PrimaryMediaId;
            }

            await _context.SaveChangesAsync();
            await tx.CommitAsync();

            return Ok(new
            {
                message = "Images updated successfully."
            });
        }
        catch (Exception ex)
        {
            await tx.RollbackAsync();

            return BadRequest(ex.Message);
        }
    }


    //Product ratings

    /// <summary>
    /// Get all posted ratings for a product
    /// </summary>
    /// <param name="productId"></param>
    /// <returns></returns>
    [HttpGet("customer-transaction-ratings/product/{productId}")]
    public async Task<IActionResult> GetProductRatings(int productId)
    {
        if (productId <= 0)
            return BadRequest("Invalid product id.");

        var productExists = await _context.products
            .AnyAsync(x => x.id == productId);

        if (!productExists)
            return NotFound("Product not found.");

        // =========================================
        // GET RATINGS
        // =========================================

        var ratings = await _context.customer_ratings

            .Where(r =>
                r.product_id == productId &&
                r.isposted == true)

            .Join(
                _context.customers,

                rating => rating.customer_id,
                customer => customer.id,

                (rating, customer) => new
                {
                    ratingId = rating.id,

                    customerId = customer.id,

                    customerName =
                        customer.first_name + " " +
                        customer.last_name,

                    rating = rating.rating,

                    comment = rating.comment,

                    createdAt = rating.created_at
                })

            .OrderByDescending(x => x.createdAt)

            .ToListAsync();

        // =========================================
        // SUMMARY
        // =========================================

        var totalReviews = ratings.Count;

        var averageRating = totalReviews > 0
            ? Math.Round(
                ratings.Average(x => x.rating),
                1)
            : 0;

        return Ok(new
        {
            productId,

            totalReviews,

            averageRating,

            ratings
        });
    }
}
