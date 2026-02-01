using ARCon_Capstone_2.Data;
using ARCon_Capstone_2.DTOs;
using ARCon_Capstone_2.Models;
using ARCon_Capstone_2.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ARCon_Capstone_2.Services;


[AllowAnonymous]
[ApiController]
[Route("api/branches")]
public class BranchApiController : ControllerBase
{
    private readonly ARCon_Capstone_2_DbContext _context;

    public BranchApiController(ARCon_Capstone_2_DbContext context)
    {
        _context = context;
    }

    [HttpGet("dropdown")]
    public async Task<IActionResult> GetBranchesDropdown()
    {
        var branches = await _context.arcon_store_branches
            .OrderBy(br => br.branch_name)
            .Select(br=> new
            {
                br.id,
                br.branch_name
            })
            .ToListAsync();

        return Ok(branches);
    }
}
