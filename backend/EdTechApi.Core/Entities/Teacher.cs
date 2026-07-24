namespace EdTechApi.Core.Entities
{
    public class Teacher
    {
        public int Id { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string TeacherNumber { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Branch { get; set; } // Uzmanlık alanı / branş (opsiyonel)
        public DateTime Date { get; set; } = DateTime.UtcNow;
        public string? ProfilePictureUrl { get; set; }
        public string? AboutMe { get; set; }

        // Student'taki UserId ile aynı mantık: bu öğretmen kaydının hangi giriş hesabına
        // (User) ait olduğunu belirtir. Şu an için opsiyonel — öğretmenlerin ayrıca giriş
        // hesabı olması zorunlu değil, admin panelinden de eklenebilirler.
        public int? UserId { get; set; }
        public User? User { get; set; }

        // --- YENİ EKLENEN NAVİGASYON ---
        // Bu öğretmene atanmış kurslar (Course.TeacherId -> Teacher.Id ilişkisinin karşı tarafı).
        public ICollection<Course> Courses { get; set; } = new List<Course>();

        // Soft-delete: "silme" işlemi artık satırı DB'den kaldırmıyor, sadece işaretliyor.
        // Böylece Raporlar sayfasındaki "Silinen Öğretmenler" gerçek veriye dayanabiliyor.
        public bool IsDeleted { get; set; } = false;
        public DateTime? DeletedAt { get; set; }
    }
}