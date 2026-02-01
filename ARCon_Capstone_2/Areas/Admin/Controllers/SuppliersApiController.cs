using ARCon_Capstone_2.Data;
using ARCon_Capstone_2.DTOs;
using ARCon_Capstone_2.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;


[AllowAnonymous]
[ApiController]
[Route("api/suppliers")]


public class SupplierApiController : ControllerBase
{
    private readonly ARCon_Capstone_2_DbContext _context;
    public SupplierApiController(ARCon_Capstone_2_DbContext context)
    {
        _context = context;
    }
    private static string? Clean(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        return value.Trim();
    }

    [HttpPost("create")]
    public async Task<IActionResult> Create([FromBody] SupplierDto dto)
    {
        var supplierName = Clean(dto.Supplier_Name);
        if (supplierName == null)
            return BadRequest("Supplier name is required.");

        //company name already exists
        if (await _context.suppliers
            .AnyAsync(sup => sup.supplier_name == dto.Supplier_Name))
        {
            return BadRequest("Supplier company already exists.");
        }

        //DTI Number already exist
        if (await _context.suppliers
            .AnyAsync(sup => sup.dti_business_number == dto.DTI_Business_Number))
        {
            return BadRequest("DTI Number already exist!");
        }
        //BIR TIN already exist
        if (await _context.suppliers
            .AnyAsync(sup => sup.tin_number == dto.Tin_Number))
        {
            return BadRequest("BIR TIN Number already exist!");
        }

        var supplier = new supplier
        {
            supplier_name = supplierName,
            proprietor_name = Clean(dto.Proprietor_Name),
            proprieto_contact_no = Clean(dto.Proprietor_Contact_No),
            dti_business_number = Clean(dto.DTI_Business_Number),
            tin_number = Clean(dto.Tin_Number),
            offical_website = Clean(dto.Official_Website),
            landline_no = Clean(dto.Landline_No),

            supplier_rep = Clean(dto.Supplier_Rep),
            rep_email = Clean(dto.Rep_Email),
            rep_contact_no = Clean(dto.Rep_Contact_No),

            house_unit = Clean(dto.House_Unit),
            street_name = Clean(dto.Street_Name),
            barangay = Clean(dto.Barangay),
            city = Clean(dto.City),
            province = Clean(dto.Province),
            landmark = Clean(dto.Landmark),
            status = "ACTIVE",
            notes = dto.Note,
            created_at = DateTime.UtcNow

        };
        _context.suppliers.Add(supplier);
        await _context.SaveChangesAsync();

        return Ok();
    }


    //Displey rows
    [HttpGet]
    public async Task<IActionResult> GetAll(int page = 1, int pageSize = 24, string sortBy = "date", string sortDir = "desc", string? search = null)
    {
        var query = _context.suppliers
            .Where(sup => sup.status.ToUpper() != "ARCHIVED")
            .AsQueryable();

        // SEARCH 
        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.Trim();

            query = query.Where(sup =>
                EF.Functions.ILike(sup.supplier_name ?? "", $"%{search}%") ||
                EF.Functions.ILike(sup.supplier_rep ?? "", $"%{search}%") ||
                EF.Functions.ILike(sup.proprietor_name ?? "", $"%{search}%") ||
                EF.Functions.ILike(sup.rep_contact_no ?? "", $"%{search}%") ||
                EF.Functions.ILike(sup.proprieto_contact_no ?? "", $"%{search}%") ||
                EF.Functions.ILike(sup.province ?? "", $"%{search}%")
            );
        }

        bool asc = sortDir.ToLower() == "asc";

        query = sortBy switch
        {
            "supplier_name" => asc ? query.OrderBy(sup => sup.supplier_name) : query.OrderByDescending(sup => sup.supplier_name),
            "status" => asc ? query.OrderBy(sup => sup.status) : query.OrderByDescending(sup => sup.status),
            "supplier_rep" => asc ? query.OrderBy(sup => sup.supplier_rep) : query.OrderByDescending(sup => sup.supplier_rep),
            _ => asc ? query.OrderBy(sup => sup.created_at) : query.OrderByDescending(sup => sup.created_at)
        };

        var totalCount = await query.CountAsync();
        var items = await query
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .Select(sup => new
        {
            sup.id,
            sup.supplier_name,
            sup.supplier_rep,
            sup.rep_contact_no,
            sup.rep_email,
            sup.dti_business_number,
            sup.city,
            sup.province,
            sup.created_at,
            sup.updated_at,
            sup.status,
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
        var supplier = await _context.suppliers.FindAsync(id);
        if (supplier == null)
            return NotFound();

        supplier.status = "ARCHIVED";
        supplier.updated_at = DateTime.UtcNow;

        var affected = await _context.SaveChangesAsync();
        Console.WriteLine($"ROWS AFFECTED: {affected}");

        return Ok(new
        {
            id = supplier.id,
            status = supplier.status,
            affected
        });
    }


    // Summary
    [HttpGet("{id}/summary")]
    public async Task<IActionResult> GetSummary(int id)
    {
        var supplier = await _context.suppliers
        .Where(sup => sup.id == id)
        .Select(sup => new
        {
            sup.supplier_name,
            sup.proprietor_name,
            sup.proprieto_contact_no,
            sup.dti_business_number,
            sup.tin_number,
            sup.offical_website,
            sup.landline_no,
            sup.supplier_rep,
            sup.rep_email,
            sup.rep_contact_no,
            sup.house_unit,
            sup.street_name,
            sup.barangay,
            sup.city,
            sup.province,
            sup.landmark,
            sup.notes,
            sup.status,
        })
        .FirstOrDefaultAsync();

        if (supplier == null)
            return NotFound();

        return Ok(supplier);
    }



    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateSupplier(int id, [FromBody ] SupplierUpdateDto dto) 
    {
        var supplierName = Clean(dto.Supplier_Name);

        //UNIQUE Supplier Name (EXCLUDE SELF)
        if (await _context.suppliers.AnyAsync(sup =>
            sup.supplier_name == dto.Supplier_Name &&
            sup.id != id))
        {
            return BadRequest("Company name already exist");
        }
        //Unique DTI Number (Exclude Self)
        if (await _context.suppliers.AnyAsync(sup =>
            sup.dti_business_number == dto.DTI_Business_Number &&
            sup.id != id))
        {
            return BadRequest("DTI Number already exist!");
        }
        //Unique Tin Number (Exclude Self)
        if (await _context.suppliers.AnyAsync(sup =>
            sup.tin_number == dto.Tin_Number &&
            sup.id != id))
        {
            return BadRequest("BIR TIN Number already exist!");
        }

        if (!ModelState.IsValid)
                return BadRequest(ModelState);


        var sup = await _context.suppliers
            .FirstOrDefaultAsync(sup => sup.id == id);

        //Must have unique Supplier name//
        if (await _context.suppliers.AnyAsync(sup => sup.supplier_name == dto.Supplier_Name && sup.id != id))
        {
            return BadRequest("Supplier name already exist");
        }
        sup.supplier_name = supplierName;
        sup.proprietor_name = Clean(dto.Proprietor_Name);
        sup.proprieto_contact_no = Clean(dto.Proprietor_Contact_No);
        sup.dti_business_number = Clean(dto.DTI_Business_Number);
        sup.tin_number = Clean(dto.Tin_Number);
        sup.offical_website = Clean(dto.Official_Website);
        sup.landline_no = Clean(dto.Landline_No);

        sup.supplier_rep = Clean(dto.Supplier_Rep);
        sup.rep_email = Clean(dto.Rep_Email);
        sup.rep_contact_no = Clean(dto.Rep_Contact_No);

        sup.house_unit = Clean(dto.House_Unit);
        sup.street_name = Clean(dto.Street_Name);
        sup.barangay = Clean(dto.Barangay);
        sup.city = Clean(dto.City);
        sup.province = Clean(dto.Province);
        sup.landmark = Clean(dto.Landmark);
        sup.status = "ACTIVE";
        sup.notes = dto.Note;
        sup.updated_at = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok("Supplier updated successfully");

    }

}