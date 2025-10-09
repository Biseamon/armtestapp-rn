using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ArmWrestlingApi.Models;

public class User
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    public string? FullName { get; set; }

    public int? WeightClass { get; set; }

    public string? PreferredHand { get; set; }

    public bool IsPremium { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<Workout> Workouts { get; set; } = new List<Workout>();
    public ICollection<Cycle> Cycles { get; set; } = new List<Cycle>();
    public ICollection<Goal> Goals { get; set; } = new List<Goal>();
    public ICollection<StrengthTest> StrengthTests { get; set; } = new List<StrengthTest>();
}

public class Workout
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid UserId { get; set; }

    [ForeignKey("UserId")]
    public User User { get; set; } = null!;

    public Guid? CycleId { get; set; }

    [ForeignKey("CycleId")]
    public Cycle? Cycle { get; set; }

    [Required]
    public string WorkoutType { get; set; } = string.Empty;

    [Required]
    [Range(1, 300)]
    public int DurationMinutes { get; set; }

    [Required]
    [Range(1, 10)]
    public int Intensity { get; set; }

    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<Exercise> Exercises { get; set; } = new List<Exercise>();
}

public class Exercise
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid WorkoutId { get; set; }

    [ForeignKey("WorkoutId")]
    public Workout Workout { get; set; } = null!;

    [Required]
    public string Name { get; set; } = string.Empty;

    [Required]
    public int Sets { get; set; }

    [Required]
    public int Reps { get; set; }

    public string? Notes { get; set; }

    public int? Weight { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Cycle
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid UserId { get; set; }

    [ForeignKey("UserId")]
    public User User { get; set; } = null!;

    [Required]
    public string Name { get; set; } = string.Empty;

    [Required]
    public string CycleType { get; set; } = string.Empty;

    [Required]
    public DateTime StartDate { get; set; }

    [Required]
    public DateTime EndDate { get; set; }

    public string? Description { get; set; }

    public bool IsActive { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<Workout> Workouts { get; set; } = new List<Workout>();
}

public class Goal
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid UserId { get; set; }

    [ForeignKey("UserId")]
    public User User { get; set; } = null!;

    [Required]
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    [Required]
    public DateTime TargetDate { get; set; }

    public bool IsCompleted { get; set; } = false;

    public DateTime? CompletedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class StrengthTest
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid UserId { get; set; }

    [ForeignKey("UserId")]
    public User User { get; set; } = null!;

    [Required]
    public string TestType { get; set; } = string.Empty;

    [Required]
    public string Hand { get; set; } = string.Empty;

    [Required]
    [Range(0, 500)]
    public decimal Result { get; set; }

    public string? Unit { get; set; }

    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
