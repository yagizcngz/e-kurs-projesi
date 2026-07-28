namespace EdTechApi.Core.Entities
{
    public class Enrollment
    {
        public int Id { get; set; }
        public int StudentId { get; set; }
        public int CourseId { get; set; }
        public decimal Grade { get; set; }
        public DateTime EnrollmentDate { get; set; } = DateTime.UtcNow;
        public string Status { get; set; } = "Devam Ediyor";

        public Student Student { get; set; } = null!;
        public Course Course { get; set; } = null!;

        // Soft-delete: "silme" işlemi artık satırı DB'den kaldırmıyor, sadece işaretliyor.
        // Böylece Raporlar sayfasındaki "Silinen Kayıtlar" gerçek veriye dayanabiliyor.
        public bool IsDeleted { get; set; } = false;
        public DateTime? DeletedAt { get; set; }
    }
}