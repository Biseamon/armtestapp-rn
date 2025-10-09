using Microsoft.EntityFrameworkCore;
using ArmWrestlingApi.Data;
using ArmWrestlingApi.Models;
using ArmWrestlingApi.DTOs;

namespace ArmWrestlingApi.Services;

public interface ICycleService
{
    Task<List<CycleDto>> GetAllCyclesAsync(Guid userId);
    Task<CycleDto?> GetCycleByIdAsync(Guid cycleId, Guid userId);
    Task<CycleDto> CreateCycleAsync(Guid userId, CreateCycleRequest request);
    Task<CycleDto?> UpdateCycleAsync(Guid cycleId, Guid userId, UpdateCycleRequest request);
    Task<bool> DeleteCycleAsync(Guid cycleId, Guid userId);
    Task<CycleDto?> ActivateCycleAsync(Guid cycleId, Guid userId);
}

public class CycleService : ICycleService
{
    private readonly AppDbContext _context;

    public CycleService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<CycleDto>> GetAllCyclesAsync(Guid userId)
    {
        var cycles = await _context.Cycles
            .Where(c => c.UserId == userId)
            .OrderByDescending(c => c.IsActive)
            .ThenByDescending(c => c.StartDate)
            .ToListAsync();

        return cycles.Select(MapToCycleDto).ToList();
    }

    public async Task<CycleDto?> GetCycleByIdAsync(Guid cycleId, Guid userId)
    {
        var cycle = await _context.Cycles
            .FirstOrDefaultAsync(c => c.Id == cycleId && c.UserId == userId);

        return cycle == null ? null : MapToCycleDto(cycle);
    }

    public async Task<CycleDto> CreateCycleAsync(Guid userId, CreateCycleRequest request)
    {
        var cycle = new Cycle
        {
            UserId = userId,
            Name = request.Name,
            CycleType = request.CycleType,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            Description = request.Description,
            IsActive = false
        };

        _context.Cycles.Add(cycle);
        await _context.SaveChangesAsync();

        return MapToCycleDto(cycle);
    }

    public async Task<CycleDto?> UpdateCycleAsync(Guid cycleId, Guid userId, UpdateCycleRequest request)
    {
        var cycle = await _context.Cycles
            .FirstOrDefaultAsync(c => c.Id == cycleId && c.UserId == userId);

        if (cycle == null)
        {
            return null;
        }

        if (request.Name != null)
            cycle.Name = request.Name;

        if (request.CycleType != null)
            cycle.CycleType = request.CycleType;

        if (request.StartDate.HasValue)
            cycle.StartDate = request.StartDate.Value;

        if (request.EndDate.HasValue)
            cycle.EndDate = request.EndDate.Value;

        if (request.Description != null)
            cycle.Description = request.Description;

        if (request.IsActive.HasValue)
            cycle.IsActive = request.IsActive.Value;

        await _context.SaveChangesAsync();

        return MapToCycleDto(cycle);
    }

    public async Task<bool> DeleteCycleAsync(Guid cycleId, Guid userId)
    {
        var cycle = await _context.Cycles
            .FirstOrDefaultAsync(c => c.Id == cycleId && c.UserId == userId);

        if (cycle == null)
        {
            return false;
        }

        _context.Cycles.Remove(cycle);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<CycleDto?> ActivateCycleAsync(Guid cycleId, Guid userId)
    {
        var cycle = await _context.Cycles
            .FirstOrDefaultAsync(c => c.Id == cycleId && c.UserId == userId);

        if (cycle == null)
        {
            return null;
        }

        // Deactivate all other cycles for this user
        var activeCycles = await _context.Cycles
            .Where(c => c.UserId == userId && c.IsActive && c.Id != cycleId)
            .ToListAsync();

        foreach (var activeCycle in activeCycles)
        {
            activeCycle.IsActive = false;
        }

        // Activate the selected cycle
        cycle.IsActive = true;

        await _context.SaveChangesAsync();

        return MapToCycleDto(cycle);
    }

    private static CycleDto MapToCycleDto(Cycle cycle) => new(
        cycle.Id,
        cycle.UserId,
        cycle.Name,
        cycle.CycleType,
        cycle.StartDate,
        cycle.EndDate,
        cycle.Description,
        cycle.IsActive,
        cycle.CreatedAt
    );
}
