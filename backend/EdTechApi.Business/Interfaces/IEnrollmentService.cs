using EdTechApi.Core.DTOs;

namespace EdTechApi.Business.Interfaces
{
    public interface IEnrollmentService
    {
        Task EnrollStudentAsync(int studentId, int courseId);
        Task DeleteEnrollmentAsync(int enrollmentId);
        Task<IEnumerable<EnrollmentDto>> GetAllEnrollmentsAsync();
    }
}