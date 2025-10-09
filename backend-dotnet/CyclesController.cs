using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using ArmWrestlingApi.Services;
using ArmWrestlingApi.DTOs;

namespace ArmWrestlingApi.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class CyclesController : ControllerBase
{
    private readonly ICycleService _cycleService;

    public CyclesController(ICycleService cycleService)
    {
        _cycleService = cycleService;
    }

    [HttpGet]
    public async Task<ActionResult<List<CycleDto>>> GetAllCycles()
    {
        var userId = GetUserId();
        var cycles = await _cycleService.GetAllCyclesAsync(userId);
        return Ok(cycles);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CycleDto>> GetCycle(Guid id)
    {
        var userId = GetUserId();
        var cycle = await _cycleService.GetCycleByIdAsync(id, userId);

        if (cycle == null)
        {
            return NotFound();
        }

        return Ok(cycle);
    }

    [HttpPost]
    public async Task<ActionResult<CycleDto>> CreateCycle([FromBody] CreateCycleRequest request)
    {
        var userId = GetUserId();
        var cycle = await _cycleService.CreateCycleAsync(userId, request);
        return CreatedAtAction(nameof(GetCycle), new { id = cycle.Id }, cycle);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<CycleDto>> UpdateCycle(Guid id, [FromBody] UpdateCycleRequest request)
    {
        var userId = GetUserId();
        var cycle = await _cycleService.UpdateCycleAsync(id, userId, request);

        if (cycle == null)
        {
            return NotFound();
        }

        return Ok(cycle);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCycle(Guid id)
    {
        var userId = GetUserId();
        var success = await _cycleService.DeleteCycleAsync(id, userId);

        if (!success)
        {
            return NotFound();
        }

        return NoContent();
    }

    [HttpPost("{id}/activate")]
    public async Task<ActionResult<CycleDto>> ActivateCycle(Guid id)
    {
        var userId = GetUserId();
        var cycle = await _cycleService.ActivateCycleAsync(id, userId);

        if (cycle == null)
        {
            return NotFound();
        }

        return Ok(cycle);
    }

    private Guid GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.Parse(userIdClaim!);
    }
}
