using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using ArmWrestlingApi.Services;
using ArmWrestlingApi.DTOs;

namespace ArmWrestlingApi.Controllers;

[Authorize]
[ApiController]
[Route("api/strength-tests")]
public class StrengthTestsController : ControllerBase
{
    private readonly IStrengthTestService _strengthTestService;

    public StrengthTestsController(IStrengthTestService strengthTestService)
    {
        _strengthTestService = strengthTestService;
    }

    [HttpGet]
    public async Task<ActionResult<List<StrengthTestDto>>> GetAllStrengthTests()
    {
        var userId = GetUserId();
        var tests = await _strengthTestService.GetAllStrengthTestsAsync(userId);
        return Ok(tests);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<StrengthTestDto>> GetStrengthTest(Guid id)
    {
        var userId = GetUserId();
        var test = await _strengthTestService.GetStrengthTestByIdAsync(id, userId);

        if (test == null)
        {
            return NotFound();
        }

        return Ok(test);
    }

    [HttpPost]
    public async Task<ActionResult<StrengthTestDto>> CreateStrengthTest([FromBody] CreateStrengthTestRequest request)
    {
        var userId = GetUserId();
        var test = await _strengthTestService.CreateStrengthTestAsync(userId, request);
        return CreatedAtAction(nameof(GetStrengthTest), new { id = test.Id }, test);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteStrengthTest(Guid id)
    {
        var userId = GetUserId();
        var success = await _strengthTestService.DeleteStrengthTestAsync(id, userId);

        if (!success)
        {
            return NotFound();
        }

        return NoContent();
    }

    private Guid GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.Parse(userIdClaim!);
    }
}
