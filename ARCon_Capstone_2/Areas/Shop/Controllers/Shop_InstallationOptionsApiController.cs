using ARCon_Capstone_2.Data;
using ARCon_Capstone_2.DTOs;
using ARCon_Capstone_2.Models;
using ARCon_Capstone_2.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ARCon_Capstone_2.Services;

namespace ARCon_Capstone_2.Areas.Shop.Controllers;


[Route("api/shop/product/service_options")]

public class Shop_InstallationOptionsApiController : ControllerBase
{
    public readonly ARCon_Capstone_2_DbContext _context;
    public Shop_InstallationOptionsApiController(ARCon_Capstone_2_DbContext context)
    {
        _context = context;
    }

    //standard installation option
    [HttpGet("standard")]
    public async Task<IActionResult> GetStandardService()
    {
        var options = await _context.installation_std_service_options
            .Where(o => o.is_active == true)
            .OrderBy(o => o.option_code)
            .Select(o => new Shop_InstallationStdOptionDropdownDto
            {
                Id = o.id,
                OptionCode = o.option_code,
                Description = o.description,
                Price = o.price,
                IsDefault = o.is_default
            })
            .AsNoTracking()
            .ToListAsync();
        return Ok(options);
    }
    [HttpGet("additional")]
    public async Task<IActionResult> GetAddtionalServices()
    {
        var option = await _context.installation_additional_service_options
            .Where(o => o.is_active == true)
            .OrderBy(o => o.option_code)
            .Select(o => new Shop_InstallationAdditionalOptionDropdownDto
            {
                Id = o.id,
                OptionCode = o.option_code,
                Description = o.description,
                Price = o.price,
                IsDefault = o.is_default

            })
            .AsNoTracking()
            .ToListAsync();

        return Ok(option);
    }
}
