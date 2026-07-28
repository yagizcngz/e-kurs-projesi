using EdTechApi.DataAccess.Context;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EdTechApi.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DashboardController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DashboardController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("GuestStats")]
        public async Task<IActionResult> GetGuestStats()
        {
            var totalStudents = await _context.Students.IgnoreQueryFilters().CountAsync(s => !s.IsDeleted);
            var totalTeachers = await _context.Teachers.IgnoreQueryFilters().CountAsync(t => !t.IsDeleted);
            var totalCourses = await _context.Courses.IgnoreQueryFilters().CountAsync(c => !c.IsDeleted);

            return Ok(new
            {
                TotalStudents = totalStudents,
                TotalTeachers = totalTeachers,
                TotalCourses = totalCourses
            });
        }
    }
}
