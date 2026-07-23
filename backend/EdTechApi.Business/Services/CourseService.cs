using EdTechApi.Business.Interfaces;
using EdTechApi.Core.Entities;
using EdTechApi.DataAccess.Context;
using Microsoft.EntityFrameworkCore;

namespace EdTechApi.Business.Services
{
    public class CourseService : ICourseService
    {
        private readonly AppDbContext _context;

        public CourseService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Course>> GetAllCoursesAsync()
        {
            return await _context.Courses.ToListAsync();
        }

        public async Task<Course?> GetCourseByIdAsync(int id)
        {
            return await _context.Courses.FindAsync(id);
        }

        public async Task AddCourseAsync(Course course)
        {
            await _context.Courses.AddAsync(course);
            await _context.SaveChangesAsync();
        }

        public async Task<bool> UpdateCourseAsync(int id, Course updatedCourse)
        {
            var course = await _context.Courses.FindAsync(id);
            if (course == null)
            {
                return false;
            }

            course.Title = updatedCourse.Title;
            course.MaxCapacity = updatedCourse.MaxCapacity;
            course.Price = updatedCourse.Price;
            course.Instructor = updatedCourse.Instructor;
            course.Category = updatedCourse.Category;
            course.Description = updatedCourse.Description;
            course.ImageUrl = updatedCourse.ImageUrl; 

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task DeleteCourseAsync(int id)
        {
            // Artık hard-delete değil, soft-delete yapıyoruz: satır DB'de kalır,
            // sadece IsDeleted=true işaretlenir.
            var course = await _context.Courses.FindAsync(id);
            if (course != null)
            {
                course.IsDeleted = true;
                course.DeletedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        public async Task<IEnumerable<Course>> GetDeletedCoursesAsync()
        {
            return await _context.Courses
                .IgnoreQueryFilters()
                .Where(c => c.IsDeleted)
                .ToListAsync();
        }
    }
}