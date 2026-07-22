namespace EdTechApi.Core.Entities
{
    public class Course
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public int MaxCapacity { get; set; }

        // --- YENİ EKLENEN SÜTUNLAR ---
        public decimal Price { get; set; } // Fiyat tutmak için en güvenli tip decimal'dir
        public string Instructor { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty; // Kurs içeriği / açıklaması

        // --- YENİ EKLENEN SÜTUN ---
        // Kurs kapak fotoğrafının göreli URL'i (örn. /uploads/course-images/xxx.png).
        // Boşsa frontend otomatik olarak stok bir fotoğraf gösterir.
        public string? ImageUrl { get; set; }

        public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
    }
}