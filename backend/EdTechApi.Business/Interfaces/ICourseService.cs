using EdTechApi.Core.Entities;

namespace EdTechApi.Business.Interfaces
{
    public interface ICourseService
    {
        Task<IEnumerable<Course>> GetAllCoursesAsync(string? search = null, string? category = null, bool? isFeatured = null);
        Task<IEnumerable<Course>> GetPopularCoursesAsync(int count);
        Task<Course?> GetCourseByIdAsync(int id);
        Task AddCourseAsync(Course course);
        Task<bool> UpdateCourseAsync(int id, Course updatedCourse);
        Task DeleteCourseAsync(int id);

        Task<IEnumerable<Course>> GetDeletedCoursesAsync();

        // Öğrencinin henüz kayıtlı olmadığı önerilen kurslar
        Task<IEnumerable<Course>> GetRecommendedCoursesAsync(int studentId, int count);
    }
}