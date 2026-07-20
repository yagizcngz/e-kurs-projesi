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
        
        public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
    }
}