using EdTechApi.Core.Entities;

namespace EdTechApi.Business.Interfaces
{
    public interface ICourseService
    {
        Task<IEnumerable<Course>> GetAllCoursesAsync();
        Task<Course?> GetCourseByIdAsync(int id);
        Task AddCourseAsync(Course course);
        Task<bool> UpdateCourseAsync(int id, Course updatedCourse);
        Task DeleteCourseAsync(int id);
    }
}