using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ARCon_Capstone_2.Data;
using ARCon_Capstone_2.Models;

namespace ARCon_Capstone_2.Areas_Admin_Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RegionsApi_SampleController : ControllerBase
    {
        private readonly ARCon_Capstone_2_DbContext _context;


        public RegionsApi_SampleController(ARCon_Capstone_2_DbContext context)
        {
            _context = context;
        }

        // GET: api/RegionsApi_Sample
        [HttpGet]
        public async Task<ActionResult<IEnumerable<region>>> Getregions()
        {
            return await _context.regions.ToListAsync();
        }

        // GET: api/RegionsApi_Sample/5
        [HttpGet("{id}")]
        public async Task<ActionResult<region>> Getregion(int id)
        {
            var region = await _context.regions.FindAsync(id);

            if (region == null)
            {
                return NotFound();
            }

            return region;
        }

        // PUT: api/RegionsApi_Sample/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> Putregion(int id, region region)
        {
            if (id != region.id)
            {
                return BadRequest();
            }

            _context.Entry(region).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!regionExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // POST: api/RegionsApi_Sample
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<region>> Postregion(region region)
        {
            _context.regions.Add(region);
            await _context.SaveChangesAsync();

            return CreatedAtAction("Getregion", new { id = region.id }, region);
        }

        // DELETE: api/RegionsApi_Sample/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Deleteregion(int id)
        {
            var region = await _context.regions.FindAsync(id);
            if (region == null)
            {
                return NotFound();
            }

            _context.regions.Remove(region);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool regionExists(int id)
        {
            return _context.regions.Any(e => e.id == id);
        }
    }
}
