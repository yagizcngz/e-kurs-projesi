namespace EdTechApi.Core.Entities
{
    public class SupportRequest
    {
        public int Id { get; set; }
        public int? UserId { get; set; } // Hangi kullanıcı gönderdi (Guest ise null)
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string Message { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public bool IsResolved { get; set; } = false;
        public string? ReplyMessage { get; set; }
        public DateTime? RepliedAt { get; set; }
        // Navigation property
        public User? User { get; set; }

        public bool IsDeletedByAdmin { get; set; } = false;
    }
}
