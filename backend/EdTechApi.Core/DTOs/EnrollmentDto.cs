namespace EdTechApi.Core.DTOs
{
    public class EnrollmentDto
    {
        public int Id { get; set; }
        public int StudentId { get; set; }
        public string StudentFullName { get; set; } = string.Empty;
        public string StudentNumber { get; set; } = string.Empty;
        public string CourseTitle { get; set; } = string.Empty;
        public int CourseId { get; set; }
        public DateTime EnrollmentDate { get; set; }
        public string Status { get; set; } = string.Empty;
    }
}
