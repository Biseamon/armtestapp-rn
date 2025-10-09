using Microsoft.EntityFrameworkCore;
using ArmWrestlingApi.Data;
using ArmWrestlingApi.Models;
using ArmWrestlingApi.DTOs;

namespace ArmWrestlingApi.Services;

public interface IStrengthTestService
{
    Task<List<StrengthTestDto>> GetAllStrengthTestsAsync(Guid userId);
    Task<StrengthTestDto?> GetStrengthTestByIdAsync(Guid testId, Guid userId);
    Task<StrengthTestDto> CreateStrengthTestAsync(Guid userId, CreateStrengthTestRequest request);
    Task<bool> DeleteStrengthTestAsync(Guid testId, Guid userId);
}

public class StrengthTestService : IStrengthTestService
{
    private readonly AppDbContext _context;

    public StrengthTestService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<StrengthTestDto>> GetAllStrengthTestsAsync(Guid userId)
    {
        var tests = await _context.StrengthTests
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        return tests.Select(MapToStrengthTestDto).ToList();
    }

    public async Task<StrengthTestDto?> GetStrengthTestByIdAsync(Guid testId, Guid userId)
    {
        var test = await _context.StrengthTests
            .FirstOrDefaultAsync(t => t.Id == testId && t.UserId == userId);

        return test == null ? null : MapToStrengthTestDto(test);
    }

    public async Task<StrengthTestDto> CreateStrengthTestAsync(Guid userId, CreateStrengthTestRequest request)
    {
        var test = new StrengthTest
        {
            UserId = userId,
            TestType = request.TestType,
            Hand = request.Hand,
            Result = request.Result,
            Unit = request.Unit,
            Notes = request.Notes
        };

        _context.StrengthTests.Add(test);
        await _context.SaveChangesAsync();

        return MapToStrengthTestDto(test);
    }

    public async Task<bool> DeleteStrengthTestAsync(Guid testId, Guid userId)
    {
        var test = await _context.StrengthTests
            .FirstOrDefaultAsync(t => t.Id == testId && t.UserId == userId);

        if (test == null)
        {
            return false;
        }

        _context.StrengthTests.Remove(test);
        await _context.SaveChangesAsync();

        return true;
    }

    private static StrengthTestDto MapToStrengthTestDto(StrengthTest test) => new(
        test.Id,
        test.UserId,
        test.TestType,
        test.Hand,
        test.Result,
        test.Unit,
        test.Notes,
        test.CreatedAt
    );
}
