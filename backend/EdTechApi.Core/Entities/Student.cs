namespace EdTechApi.Core.Entities
{
    public class Student
    {
        public int Id { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string StudentNumber { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public string? ProfilePictureUrl { get; set; }
        public string? AboutMe { get; set; }

        // Bu öğrenci kaydının hangi giriş hesabına (User) ait olduğunu belirtir.
        // Nullable, çünkü admin panelinden eklenen bir öğrencinin henüz bir giriş
        // hesabı (User) olmayabilir; kullanıcı ilk kez /profil sayfasını açtığında
        // ad-soyad eşleşmesiyle otomatik bağlanır (bkz. StudentService.GetStudentByUsernameAsync).
        public int? UserId { get; set; }
        public User? User { get; set; }

        // Navigation property indicating a student can have many enrollments
        public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
    }
}