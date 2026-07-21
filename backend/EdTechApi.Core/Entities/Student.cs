using System.Collections.Generic;

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
        // Navigation property indicating a student can have many enrollments
        public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
    }
}