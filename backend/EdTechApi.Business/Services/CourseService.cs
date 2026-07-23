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
            await SyncInstructorFromTeacherAsync(course);
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
            course.Category = updatedCourse.Category;
            course.Description = updatedCourse.Description;
            course.ImageUrl = updatedCourse.ImageUrl;

            // Önce gelen TeacherId'yi ve (varsa) elle girilmiş Instructor metnini yazıyoruz.
            // TeacherId set edilmişse aşağıdaki SyncInstructorFromTeacherAsync bunun üzerine
            // yazıp Instructor'ı seçilen öğretmenin adıyla senkronize edecek. TeacherId null
            // ise (öğretmen seçilmemiş, serbest metin kullanılmışsa) elle girilen Instructor
            // olduğu gibi kalır.
            course.TeacherId = updatedCourse.TeacherId;
            course.Instructor = updatedCourse.Instructor;

            await SyncInstructorFromTeacherAsync(course);

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

        // Bir kursa TeacherId atanmışsa, Instructor serbest metin alanını o öğretmenin
        // adıyla otomatik senkronize eder. Böylece eski kod yolları (raporlar, kart
        // görünümü vb.) Instructor string'ini okumaya devam edebilir, ama artık bu alan
        // TeacherId'den türetilmiş "tek doğru kaynak" (source of truth) haline gelir.
        private async Task SyncInstructorFromTeacherAsync(Course course)
        {
            if (!course.TeacherId.HasValue)
            {
                return;
            }

            var teacher = await _context.Teachers.FindAsync(course.TeacherId.Value);
            if (teacher != null)
            {
                course.Instructor = $"{teacher.FirstName} {teacher.LastName}".Trim();
            }
        }
    }
}