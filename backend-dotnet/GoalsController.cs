using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using ArmWrestlingApi.Services;
using ArmWrestlingApi.DTOs;

namespace ArmWrestlingApi.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class GoalsController : ControllerBase
{
    private readonly IGoalService _goalService;

    public GoalsController(IGoalService goalService)
    {
        _goalService = goalService;
    }

    [HttpGet]
    public async Task<ActionResult<List<GoalDto>>> GetAllGoals()
    {
        var userId = GetUserId();
        var goals = await _goalService.GetAllGoalsAsync(userId);
        return Ok(goals);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<GoalDto>> GetGoal(Guid id)
    {
        var userId = GetUserId();
        var goal = await _goalService.GetGoalByIdAsync(id, userId);

        if (goal == null)
        {
            return NotFound();
        }

        return Ok(goal);
    }

    [HttpPost]
    public async Task<ActionResult<GoalDto>> CreateGoal([FromBody] CreateGoalRequest request)
    {
        var userId = GetUserId();
        var goal = await _goalService.CreateGoalAsync(userId, request);
        return CreatedAtAction(nameof(GetGoal), new { id = goal.Id }, goal);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<GoalDto>> UpdateGoal(Guid id, [FromBody] UpdateGoalRequest request)
    {
        var userId = GetUserId();
        var goal = await _goalService.UpdateGoalAsync(id, userId, request);

        if (goal == null)
        {
            return NotFound();
        }

        return Ok(goal);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteGoal(Guid id)
    {
        var userId = GetUserId();
        var success = await _goalService.DeleteGoalAsync(id, userId);

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
