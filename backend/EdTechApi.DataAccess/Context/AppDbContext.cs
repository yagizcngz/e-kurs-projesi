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
            // NOT: Daha önce burada BCrypt.HashPassword(...) ile hash'lenmiş bir "admin" seed
            // kullanıcısı vardı, ancak BCrypt her çağrıldığında farklı bir salt/hash ürettiği
            // için (deterministik değil), EF Core'un migration karşılaştırmasını bozup
            // "PendingModelChangesWarning" hatasına yol açıyordu. HasData içindeki değerler
            // sabit olmak zorunda. Zaten "superadmin" hesabı /api/auth/register üzerinden
            // normal şekilde oluşturulup düzgün hash'lenmiş halde veritabanında duruyor,
            // bu yüzden buradaki seed'e ihtiyaç yok — kaldırıldı.

            base.OnModelCreating(modelBuilder);
        }
    }
}