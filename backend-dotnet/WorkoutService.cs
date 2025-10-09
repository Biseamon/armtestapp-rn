using Microsoft.EntityFrameworkCore;
using ArmWrestlingApi.Data;
using ArmWrestlingApi.Models;
using ArmWrestlingApi.DTOs;

namespace ArmWrestlingApi.Services;

public interface IWorkoutService
{
    Task<List<WorkoutDto>> GetAllWorkoutsAsync(Guid userId);
    Task<WorkoutDto?> GetWorkoutByIdAsync(Guid workoutId, Guid userId);
    Task<WorkoutDto> CreateWorkoutAsync(Guid userId, CreateWorkoutRequest request);
    Task<WorkoutDto?> UpdateWorkoutAsync(Guid workoutId, Guid userId, UpdateWorkoutRequest request);
    Task<bool> DeleteWorkoutAsync(Guid workoutId, Guid userId);
    Task<List<ExerciseDto>> GetExercisesForWorkoutAsync(Guid workoutId, Guid userId);
    Task<ExerciseDto> AddExerciseToWorkoutAsync(Guid workoutId, Guid userId, CreateExerciseRequest request);
    Task<ExerciseDto?> UpdateExerciseAsync(Guid exerciseId, Guid userId, UpdateExerciseRequest request);
    Task<bool> DeleteExerciseAsync(Guid exerciseId, Guid userId);
}

public class WorkoutService : IWorkoutService
{
    private readonly AppDbContext _context;

    public WorkoutService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<WorkoutDto>> GetAllWorkoutsAsync(Guid userId)
    {
        var workouts = await _context.Workouts
            .Include(w => w.Exercises)
            .Where(w => w.UserId == userId)
            .OrderByDescending(w => w.CreatedAt)
            .ToListAsync();

        return workouts.Select(MapToWorkoutDto).ToList();
    }

    public async Task<WorkoutDto?> GetWorkoutByIdAsync(Guid workoutId, Guid userId)
    {
        var workout = await _context.Workouts
            .Include(w => w.Exercises)
            .FirstOrDefaultAsync(w => w.Id == workoutId && w.UserId == userId);

        return workout == null ? null : MapToWorkoutDto(workout);
    }

    public async Task<WorkoutDto> CreateWorkoutAsync(Guid userId, CreateWorkoutRequest request)
    {
        var workout = new Workout
        {
            UserId = userId,
            WorkoutType = request.WorkoutType,
            DurationMinutes = request.DurationMinutes,
            Intensity = request.Intensity,
            Notes = request.Notes,
            CycleId = request.CycleId
        };

        _context.Workouts.Add(workout);

        // Add exercises if provided
        if (request.Exercises != null && request.Exercises.Any())
        {
            foreach (var exerciseRequest in request.Exercises)
            {
                var exercise = new Exercise
                {
                    WorkoutId = workout.Id,
                    Name = exerciseRequest.Name,
                    Sets = exerciseRequest.Sets,
                    Reps = exerciseRequest.Reps,
                    Weight = exerciseRequest.Weight,
                    Notes = exerciseRequest.Notes
                };
                _context.Exercises.Add(exercise);
            }
        }

        await _context.SaveChangesAsync();

        return MapToWorkoutDto(workout);
    }

    public async Task<WorkoutDto?> UpdateWorkoutAsync(Guid workoutId, Guid userId, UpdateWorkoutRequest request)
    {
        var workout = await _context.Workouts
            .Include(w => w.Exercises)
            .FirstOrDefaultAsync(w => w.Id == workoutId && w.UserId == userId);

        if (workout == null)
        {
            return null;
        }

        if (request.WorkoutType != null)
            workout.WorkoutType = request.WorkoutType;

        if (request.DurationMinutes.HasValue)
            workout.DurationMinutes = request.DurationMinutes.Value;

        if (request.Intensity.HasValue)
            workout.Intensity = request.Intensity.Value;

        if (request.Notes != null)
            workout.Notes = request.Notes;

        if (request.CycleId.HasValue)
            workout.CycleId = request.CycleId.Value;

        await _context.SaveChangesAsync();

        return MapToWorkoutDto(workout);
    }

    public async Task<bool> DeleteWorkoutAsync(Guid workoutId, Guid userId)
    {
        var workout = await _context.Workouts
            .FirstOrDefaultAsync(w => w.Id == workoutId && w.UserId == userId);

        if (workout == null)
        {
            return false;
        }

        _context.Workouts.Remove(workout);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<List<ExerciseDto>> GetExercisesForWorkoutAsync(Guid workoutId, Guid userId)
    {
        var workout = await _context.Workouts
            .Include(w => w.Exercises)
            .FirstOrDefaultAsync(w => w.Id == workoutId && w.UserId == userId);

        if (workout == null)
        {
            return new List<ExerciseDto>();
        }

        return workout.Exercises.Select(MapToExerciseDto).ToList();
    }

    public async Task<ExerciseDto> AddExerciseToWorkoutAsync(Guid workoutId, Guid userId, CreateExerciseRequest request)
    {
        var workout = await _context.Workouts
            .FirstOrDefaultAsync(w => w.Id == workoutId && w.UserId == userId);

        if (workout == null)
        {
            throw new Exception("Workout not found");
        }

        var exercise = new Exercise
        {
            WorkoutId = workoutId,
            Name = request.Name,
            Sets = request.Sets,
            Reps = request.Reps,
            Weight = request.Weight,
            Notes = request.Notes
        };

        _context.Exercises.Add(exercise);
        await _context.SaveChangesAsync();

        return MapToExerciseDto(exercise);
    }

    public async Task<ExerciseDto?> UpdateExerciseAsync(Guid exerciseId, Guid userId, UpdateExerciseRequest request)
    {
        var exercise = await _context.Exercises
            .Include(e => e.Workout)
            .FirstOrDefaultAsync(e => e.Id == exerciseId && e.Workout.UserId == userId);

        if (exercise == null)
        {
            return null;
        }

        if (request.Name != null)
            exercise.Name = request.Name;

        if (request.Sets.HasValue)
            exercise.Sets = request.Sets.Value;

        if (request.Reps.HasValue)
            exercise.Reps = request.Reps.Value;

        if (request.Weight.HasValue)
            exercise.Weight = request.Weight.Value;

        if (request.Notes != null)
            exercise.Notes = request.Notes;

        await _context.SaveChangesAsync();

        return MapToExerciseDto(exercise);
    }

    public async Task<bool> DeleteExerciseAsync(Guid exerciseId, Guid userId)
    {
        var exercise = await _context.Exercises
            .Include(e => e.Workout)
            .FirstOrDefaultAsync(e => e.Id == exerciseId && e.Workout.UserId == userId);

        if (exercise == null)
        {
            return false;
        }

        _context.Exercises.Remove(exercise);
        await _context.SaveChangesAsync();

        return true;
    }

    private static WorkoutDto MapToWorkoutDto(Workout workout) => new(
        workout.Id,
        workout.UserId,
        workout.CycleId,
        workout.WorkoutType,
        workout.DurationMinutes,
        workout.Intensity,
        workout.Notes,
        workout.CreatedAt,
        workout.Exercises.Select(MapToExerciseDto).ToList()
    );

    private static ExerciseDto MapToExerciseDto(Exercise exercise) => new(
        exercise.Id,
        exercise.WorkoutId,
        exercise.Name,
        exercise.Sets,
        exercise.Reps,
        exercise.Weight,
        exercise.Notes,
        exercise.CreatedAt
    );
}
