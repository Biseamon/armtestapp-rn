using System.ComponentModel.DataAnnotations;

namespace ArmWrestlingApi.DTOs;

// Auth DTOs
public record RegisterRequest(
    [Required, EmailAddress] string Email,
    [Required, MinLength(6)] string Password,
    string? FullName
);

public record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password
);

public record AuthResponse(
    string Token,
    UserDto User
);

public record UserDto(
    Guid Id,
    string Email,
    string? FullName,
    int? WeightClass,
    string? PreferredHand,
    bool IsPremium,
    DateTime CreatedAt
);

public record UpdateProfileRequest(
    string? FullName,
    int? WeightClass,
    string? PreferredHand
);

// Workout DTOs
public record CreateWorkoutRequest(
    [Required] string WorkoutType,
    [Required, Range(1, 300)] int DurationMinutes,
    [Required, Range(1, 10)] int Intensity,
    string? Notes,
    Guid? CycleId,
    List<CreateExerciseRequest>? Exercises
);

public record UpdateWorkoutRequest(
    string? WorkoutType,
    int? DurationMinutes,
    int? Intensity,
    string? Notes,
    Guid? CycleId
);

public record WorkoutDto(
    Guid Id,
    Guid UserId,
    Guid? CycleId,
    string WorkoutType,
    int DurationMinutes,
    int Intensity,
    string? Notes,
    DateTime CreatedAt,
    List<ExerciseDto> Exercises
);

// Exercise DTOs
public record CreateExerciseRequest(
    [Required] string Name,
    [Required, Range(1, 100)] int Sets,
    [Required, Range(1, 1000)] int Reps,
    int? Weight,
    string? Notes
);

public record UpdateExerciseRequest(
    string? Name,
    int? Sets,
    int? Reps,
    int? Weight,
    string? Notes
);

public record ExerciseDto(
    Guid Id,
    Guid WorkoutId,
    string Name,
    int Sets,
    int Reps,
    int? Weight,
    string? Notes,
    DateTime CreatedAt
);

// Cycle DTOs
public record CreateCycleRequest(
    [Required] string Name,
    [Required] string CycleType,
    [Required] DateTime StartDate,
    [Required] DateTime EndDate,
    string? Description
);

public record UpdateCycleRequest(
    string? Name,
    string? CycleType,
    DateTime? StartDate,
    DateTime? EndDate,
    string? Description,
    bool? IsActive
);

public record CycleDto(
    Guid Id,
    Guid UserId,
    string Name,
    string CycleType,
    DateTime StartDate,
    DateTime EndDate,
    string? Description,
    bool IsActive,
    DateTime CreatedAt
);

// Goal DTOs
public record CreateGoalRequest(
    [Required] string Title,
    string? Description,
    [Required] DateTime TargetDate
);

public record UpdateGoalRequest(
    string? Title,
    string? Description,
    DateTime? TargetDate,
    bool? IsCompleted
);

public record GoalDto(
    Guid Id,
    Guid UserId,
    string Title,
    string? Description,
    DateTime TargetDate,
    bool IsCompleted,
    DateTime? CompletedAt,
    DateTime CreatedAt
);

// Strength Test DTOs
public record CreateStrengthTestRequest(
    [Required] string TestType,
    [Required] string Hand,
    [Required, Range(0, 500)] decimal Result,
    string? Unit,
    string? Notes
);

public record StrengthTestDto(
    Guid Id,
    Guid UserId,
    string TestType,
    string Hand,
    decimal Result,
    string? Unit,
    string? Notes,
    DateTime CreatedAt
);
