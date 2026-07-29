using System;

namespace EdTechApi.Core.Entities
{
    public class TeachingRequest
    {
        public int Id { get; set; }
        
        public int CourseId { get; set; }
        public Course Course { get; set; } = null!;
        
        public int TeacherId { get; set; }
        public Teacher Teacher { get; set; } = null!;
        
        // Pending, Accepted, Rejected
        public string Status { get; set; } = "Pending";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public bool IsDeletedByAdmin { get; set; } = false;
    }
}
