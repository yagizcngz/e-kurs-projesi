using EdTechApi.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace EdTechApi.DataAccess.Context
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<Student> Students { get; set; }
        public DbSet<Course> Courses { get; set; }
        public DbSet<Enrollment> Enrollments { get; set; }
        
        // Yeni eklediğimiz Users tablosu
        public DbSet<User> Users { get; set; } 

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // 1. Öğrenci numarasının benzersiz (Unique) olması kuralı:
             modelBuilder.Entity<Student>()
               .HasIndex(s => s.StudentNumber)
                .IsUnique();
            // Test edebilmen için veritabanı oluşurken otomatik bir kullanıcı ekliyoruz
            modelBuilder.Entity<User>().HasData(
                new User { Id = 1, Username = "admin", Password = "password123" }
            );

            base.OnModelCreating(modelBuilder);
        }
    }
}