using Microsoft.EntityFrameworkCore;
using ArmWrestlingApi.Data;
using ArmWrestlingApi.Models;
using ArmWrestlingApi.DTOs;

namespace ArmWrestlingApi.Services;

public interface IGoalService
{
    Task<List<GoalDto>> GetAllGoalsAsync(Guid userId);
    Task<GoalDto?> GetGoalByIdAsync(Guid goalId, Guid userId);
    Task<GoalDto> CreateGoalAsync(Guid userId, CreateGoalRequest request);
    Task<GoalDto?> UpdateGoalAsync(Guid goalId, Guid userId, UpdateGoalRequest request);
    Task<bool> DeleteGoalAsync(Guid goalId, Guid userId);
}

public class GoalService : IGoalService
{
    private readonly AppDbContext _context;

    public GoalService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<GoalDto>> GetAllGoalsAsync(Guid userId)
    {
        var goals = await _context.Goals
            .Where(g => g.UserId == userId)
            .OrderByDescending(g => g.CreatedAt)
            .ToListAsync();

        return goals.Select(MapToGoalDto).ToList();
    }

    public async Task<GoalDto?> GetGoalByIdAsync(Guid goalId, Guid userId)
    {
        var goal = await _context.Goals
            .FirstOrDefaultAsync(g => g.Id == goalId && g.UserId == userId);

        return goal == null ? null : MapToGoalDto(goal);
    }

    public async Task<GoalDto> CreateGoalAsync(Guid userId, CreateGoalRequest request)
    {
        var goal = new Goal
        {
            UserId = userId,
            Title = request.Title,
            Description = request.Description,
            TargetDate = request.TargetDate,
            IsCompleted = false
        };

        _context.Goals.Add(goal);
        await _context.SaveChangesAsync();

        return MapToGoalDto(goal);
    }

    public async Task<GoalDto?> UpdateGoalAsync(Guid goalId, Guid userId, UpdateGoalRequest request)
    {
        var goal = await _context.Goals
            .FirstOrDefaultAsync(g => g.Id == goalId && g.UserId == userId);

        if (goal == null)
        {
            return null;
        }

        if (request.Title != null)
            goal.Title = request.Title;

        if (request.Description != null)
            goal.Description = request.Description;

        if (request.TargetDate.HasValue)
            goal.TargetDate = request.TargetDate.Value;

        if (request.IsCompleted.HasValue)
        {
            goal.IsCompleted = request.IsCompleted.Value;
            if (request.IsCompleted.Value && goal.CompletedAt == null)
            {
                goal.CompletedAt = DateTime.UtcNow;
            }
            else if (!request.IsCompleted.Value)
            {
                goal.CompletedAt = null;
            }
        }

        await _context.SaveChangesAsync();

        return MapToGoalDto(goal);
    }

    public async Task<bool> DeleteGoalAsync(Guid goalId, Guid userId)
    {
        var goal = await _context.Goals
            .FirstOrDefaultAsync(g => g.Id == goalId && g.UserId == userId);

        if (goal == null)
        {
            return false;
        }

        _context.Goals.Remove(goal);
        await _context.SaveChangesAsync();

        return true;
    }

    private static GoalDto MapToGoalDto(Goal goal) => new(
        goal.Id,
        goal.UserId,
        goal.Title,
        goal.Description,
        goal.TargetDate,
        goal.IsCompleted,
        goal.CompletedAt,
        goal.CreatedAt
    );
}
