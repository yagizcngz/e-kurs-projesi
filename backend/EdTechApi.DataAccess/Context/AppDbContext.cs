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

        // Yeni eklediğimiz Teachers (Öğretmenler) tablosu
        public DbSet<Teacher> Teachers { get; set; }

        public DbSet<SystemSetting> SystemSettings { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Announcement> Announcements { get; set; }
        public DbSet<TeachingRequest> TeachingRequests { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // 1. Öğrenci numarasının benzersiz (Unique) olması kuralı:
             modelBuilder.Entity<Student>()
               .HasIndex(s => s.StudentNumber)
                .IsUnique();

            // 2. Soft-delete global query filter'ları: IsDeleted=true olan satırlar
            //    normal sorgularda (GetAll, FindAsync vb.) otomatik olarak gizlenir.
            //    "Silinenleri" görmek için servislerde IgnoreQueryFilters() kullanılıyor.
            modelBuilder.Entity<Student>().HasQueryFilter(s => !s.IsDeleted);
            modelBuilder.Entity<Course>().HasQueryFilter(c => !c.IsDeleted);
            modelBuilder.Entity<Enrollment>().HasQueryFilter(e => !e.IsDeleted);
            modelBuilder.Entity<Teacher>().HasQueryFilter(t => !t.IsDeleted);

            // 3. Course - Teacher ilişkisi (Course.TeacherId nullable FK):
            //    Bir öğretmen (hard-delete ile) silinirse buna bağlı kursların TeacherId'si
            //    otomatik olarak null'a çekilir, kurs kaydı etkilenmez.
            modelBuilder.Entity<Course>()
                .HasOne(c => c.Teacher)
                .WithMany(t => t.Courses)
                .HasForeignKey(c => c.TeacherId)
                .OnDelete(DeleteBehavior.SetNull);

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