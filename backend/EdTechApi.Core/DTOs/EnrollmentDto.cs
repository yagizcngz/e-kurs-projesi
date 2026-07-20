namespace EdTechApi.Core.DTOs
{
    public class EnrollmentDto
    {
        public int Id { get; set; }
        public string StudentFullName { get; set; } = string.Empty;
        public string StudentNumber { get; set; } = string.Empty;
        public string CourseTitle { get; set; } = string.Empty;
        public DateTime EnrollmentDate { get; set; }
    }
}
