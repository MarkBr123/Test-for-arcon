using ARCon_Capstone_2.Data;
using ARCon_Capstone_2.DTOs;
using ARCon_Capstone_2.Models;
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

    public ProductsApiController(ARCon_Capstone_2_DbContext context)
    {
        _context = context;
    }

    [HttpPost("add")]
    public async Task<IActionResult> Add([FromBody] AddProductsDto dto)
    {
        using var tx = await _context.Database.BeginTransactionAsync();

        try
        {
            // 1️⃣ COMPUTE ACTUAL SELLING PRICE (SERVER-SIDE ONLY)
            decimal actualSellingPrice;
            decimal discountedSellingPrice;
            decimal totalgrossweight = Math.Round(dto.GrossWeightA + dto.GrossWeightB, 2, MidpointRounding.AwayFromZero);
            var sku = await GenerateSku(dto.ManufacturerId, dto.FormFactorID);

            //sku generation
            string NormalizeCode(string input)
            {
                return new string(
                    input
                        .Trim()
                        .ToUpper()
                        .Where(char.IsLetter)
                        .Take(3)
                        .ToArray()
                );
            }

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



            // normalize hard (best practice)
            var discountType = (dto.DiscountType ?? "NONE").Trim().ToUpper();

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
                    if (dto.DiscountValue <= 0)
                        return BadRequest("Invalid discount amount.");

                    if (dto.DiscountValue >= dto.OriginalSellingPrice)
                        return BadRequest("Discount amount cannot exceed original price.");

                    actualSellingPrice =
                        dto.OriginalSellingPrice - dto.DiscountValue;
                    discountedSellingPrice = actualSellingPrice;
                    break;

                default:
                    return BadRequest($"Invalid discount type: '{dto.DiscountType}'");
            }

            //Any external link MUST include the protocol
            if (!string.IsNullOrWhiteSpace(dto.ArUrl) &&
                !dto.ArUrl.StartsWith("http://") &&
                !dto.ArUrl.StartsWith("https://"))
            {
                dto.ArUrl = "https://" + dto.ArUrl;
            }


            // 2️⃣ CREATE PRODUCT (NO SAVE YET)
            var product = new product
            {
                manufacturer_id = dto.ManufacturerId,
                form_factor_id = dto.FormFactorID,
                product_model = dto.ProductModel.ToUpper(),
                product_series = dto.ProductSeries.ToUpper(),
                sku = sku,
                part_number_a = dto.PartNumberA.ToUpper(),
                part_number_b = dto.PartNumberB.ToUpper(),
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
                total_gross_weight = totalgrossweight,

                status = "ACTIVE",
                created_at = DateTime.UtcNow
            };

            _context.products.Add(product);
            await _context.SaveChangesAsync(); // ✅ product.id available here



            // 3️⃣ TECHNOLOGIES
            foreach (var t in dto.Technologies)
            {
                var tech = await _context.technology_types
                    .FirstOrDefaultAsync(x => x.technology_name == t.TechnologyName);

                if (tech == null)
                {
                    tech = new technology_type
                    {
                        technology_name = t.TechnologyName.ToUpper(),
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

            // 4️⃣ SPECIFICATIONS
            foreach (var s in dto.Specifications)
            {
                // optional safety check
                var keyExists = await _context.specification_keys
                    .AnyAsync(k => k.id == s.KeyId);

                if (!keyExists)
                    return BadRequest("Invalid specification key.");

                _context.technical_specifications.Add(new technical_specification
                {
                    product_id = product.id,
                    key_id = s.KeyId,
                    value = s.Value
                });
            }


            // 5️⃣ TAGS
            foreach (var name in dto.Tags)
            {
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

            await _context.SaveChangesAsync();
            await tx.CommitAsync();

            return Ok(new { product.id });
        }
        catch (Exception ex)
        {
            await tx.RollbackAsync();
            return BadRequest(ex.ToString());
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(int page = 1,
    int pageSize = 3, string sortBy = "date", string sortDir = "desc", string? search = null)
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


    [HttpGet("summary/{id}")]
    public async Task<IActionResult> GetProductSummary(int id)
    {

        var product = await _context.products
            .Include(p => p.form_factor)
            .Include(p => p.manufacturer)

            .FirstOrDefaultAsync(p => p.id == id);

        if (product == null)
            return NotFound();

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
        var result = new
        {
            //basic info
            sku = product.sku,
            product_Model = product.product_model,
            product_Series = product.product_series,
            part_Number_A = product.part_number_a,
            part_Number_B = product.part_number_b,
            form_factor = product.form_factor.form_factor1,
            manufacturer = product.manufacturer.manufacturer_name,
            status = product.status,
            original_Selling_Price = product.original_selling_price,
            discounted_Selling_Price = product.discounted_selling_price,
            discount_Type = product.discount_type,
            discount_Amount = product.discount_type,
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
            //details query from multiple tables (Joined)
            specifications = specifications,
            tags = tags,
            technologies = technologies
        };
        return Ok(result);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] ProductUpdateDto dto)
    {
        decimal actualSellingPrice;
        decimal discountedSellingPrice;

        var discountType = (dto.Discount_Type ?? "NONE").Trim().ToUpper();

        switch (discountType)
        {
            case "NONE":
                actualSellingPrice = dto.Original_Selling_Price;
                discountedSellingPrice = 0;
                break;

            case "PERCENTAGE":
                if (dto.Discount_Value <= 0 || dto.Discount_Value > 100)
                    return BadRequest("Invalid discount percentage.");

                actualSellingPrice =
                    dto.Original_Selling_Price -
                    (dto.Original_Selling_Price * dto.Discount_Value / 100m);
                discountedSellingPrice = actualSellingPrice;

                break;

            case "AMOUNT":
                if (dto.Discount_Value <= 0)
                    return BadRequest("Invalid discount amount.");

                if (dto.Discount_Value >= dto.Original_Selling_Price)
                    return BadRequest("Discount amount cannot exceed original price.");

                actualSellingPrice =
                    dto.Original_Selling_Price - dto.Discount_Value;
                discountedSellingPrice = actualSellingPrice;
                break;

            default:
                return BadRequest($"Invalid discount type: '{dto.Discount_Type}'");
        }

        //Any external link MUST include the protocol
        if (!string.IsNullOrWhiteSpace(dto.Ar_url) &&
            !dto.Ar_url.StartsWith("http://") &&
            !dto.Ar_url.StartsWith("https://"))
        {
            dto.Ar_url = "https://" + dto.Ar_url;
        }
        var product = await _context.products.FindAsync(id);
        if (product == null) return NotFound();

        //editable fields
        product.part_number_a = dto.Part_Number_A;
        product.part_number_b = dto.Part_Number_B;
        product.status = dto.Status;
        product.original_selling_price = dto.Original_Selling_Price;
        product.discounted_selling_price = discountedSellingPrice;
        product.discount_type = discountType;
        product.discount_value = dto.Discount_Value;
        product.isdiscounted = dto.IsDiscounted;
        product.has_installation_service = dto.Has_Installation_Service;
        product.actual_selling_price = actualSellingPrice;
        product.ar_url = dto.Ar_url;
        product.manufacturer_warranty_years = dto.Manufacturer_Warranty_Years;
        product.outright_replacement_days = dto.Outright_Replacement_Days;
        product.gross_weight_a = dto.Gross_Weight_A;
        product.gross_weight_b = dto.Gross_Weight_B;
        product.total_gross_weight = Math.Round((dto.Gross_Weight_A ?? 0m) + (dto.Gross_Weight_B ?? 0m), 2, MidpointRounding.AwayFromZero);
        product.updated_at = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok();
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
                x.total_gross_weight
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







}
