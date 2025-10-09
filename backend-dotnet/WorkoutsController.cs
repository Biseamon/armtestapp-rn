using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using ArmWrestlingApi.Services;
using ArmWrestlingApi.DTOs;

namespace ArmWrestlingApi.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class WorkoutsController : ControllerBase
{
    private readonly IWorkoutService _workoutService;

    public WorkoutsController(IWorkoutService workoutService)
    {
        _workoutService = workoutService;
    }

    [HttpGet]
    public async Task<ActionResult<List<WorkoutDto>>> GetAllWorkouts()
    {
        var userId = GetUserId();
        var workouts = await _workoutService.GetAllWorkoutsAsync(userId);
        return Ok(workouts);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<WorkoutDto>> GetWorkout(Guid id)
    {
        var userId = GetUserId();
        var workout = await _workoutService.GetWorkoutByIdAsync(id, userId);

        if (workout == null)
        {
            return NotFound();
        }

        return Ok(workout);
    }

    [HttpPost]
    public async Task<ActionResult<WorkoutDto>> CreateWorkout([FromBody] CreateWorkoutRequest request)
    {
        var userId = GetUserId();
        var workout = await _workoutService.CreateWorkoutAsync(userId, request);
        return CreatedAtAction(nameof(GetWorkout), new { id = workout.Id }, workout);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<WorkoutDto>> UpdateWorkout(Guid id, [FromBody] UpdateWorkoutRequest request)
    {
        var userId = GetUserId();
        var workout = await _workoutService.UpdateWorkoutAsync(id, userId, request);

        if (workout == null)
        {
            return NotFound();
        }

        return Ok(workout);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteWorkout(Guid id)
    {
        var userId = GetUserId();
        var success = await _workoutService.DeleteWorkoutAsync(id, userId);

        if (!success)
        {
            return NotFound();
        }

        return NoContent();
    }

    [HttpGet("{workoutId}/exercises")]
    public async Task<ActionResult<List<ExerciseDto>>> GetExercises(Guid workoutId)
    {
        var userId = GetUserId();
        var exercises = await _workoutService.GetExercisesForWorkoutAsync(workoutId, userId);
        return Ok(exercises);
    }

    [HttpPost("{workoutId}/exercises")]
    public async Task<ActionResult<ExerciseDto>> AddExercise(Guid workoutId, [FromBody] CreateExerciseRequest request)
    {
        var userId = GetUserId();

        try
        {
            var exercise = await _workoutService.AddExerciseToWorkoutAsync(workoutId, userId, request);
            return CreatedAtAction(nameof(GetExercises), new { workoutId }, exercise);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    private Guid GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.Parse(userIdClaim!);
    }
}
