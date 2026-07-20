using EdTechApi.Business.Interfaces;
using EdTechApi.Core.DTOs;
using EdTechApi.Core.Entities;
using EdTechApi.DataAccess.Context;
using Microsoft.EntityFrameworkCore;

namespace EdTechApi.Business.Services
{
    public class EnrollmentService : IEnrollmentService
    {
        private readonly AppDbContext _context;

        public EnrollmentService(AppDbContext context)
        {
            _context = context;
        }

        public async Task EnrollStudentAsync(int studentId, int courseId)
        {
            var studentExists = await _context.Students.AnyAsync(s => s.Id == studentId);
            if (!studentExists)
                throw new ArgumentException("Öğrenci bulunamadı.");

            var course = await _context.Courses.FindAsync(courseId);
            if (course == null)
                throw new ArgumentException("Kurs bulunamadı.");

            var isAlreadyEnrolled = await _context.Enrollments
                .AnyAsync(e => e.StudentId == studentId && e.CourseId == courseId);

            if (isAlreadyEnrolled)
                throw new ArgumentException("Öğrenci bu kursa zaten kayıtlı.");

            var currentEnrollmentCount = await _context.Enrollments
                .CountAsync(e => e.CourseId == courseId);

            if (currentEnrollmentCount >= course.MaxCapacity)
                throw new ArgumentException("Kurs kapasitesi tamamen dolu.");

            var enrollment = new Enrollment
            {
                StudentId = studentId,
                CourseId = courseId,
                EnrollmentDate = DateTime.UtcNow
            };

            await _context.Enrollments.AddAsync(enrollment);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteEnrollmentAsync(int enrollmentId)
        {
            var enrollment = await _context.Enrollments.FindAsync(enrollmentId);
            if (enrollment == null)
                throw new ArgumentException("Kayıt bulunamadı.");

            _context.Enrollments.Remove(enrollment);
            await _context.SaveChangesAsync();
        }

        public async Task<IEnumerable<EnrollmentDto>> GetAllEnrollmentsAsync()
        {
            return await _context.Enrollments
                .Include(e => e.Student)
                .Include(e => e.Course)
                .Select(e => new EnrollmentDto
                {
                    Id = e.Id,
                    StudentFullName = e.Student.FirstName + " " + e.Student.LastName,
                    StudentNumber = e.Student.StudentNumber,
                    CourseTitle = e.Course.Title,
                    EnrollmentDate = e.EnrollmentDate 
                })
                .ToListAsync();
        }
    }
}