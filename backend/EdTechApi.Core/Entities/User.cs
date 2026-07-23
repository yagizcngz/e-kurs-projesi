namespace EdTechApi.Core.Entities
{
    public class User
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;

        // YENİ EKLENEN ALANLAR
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;

        public string Role { get; set; } = "User";
        public string? AboutMe { get; set; }
        public string? ProfilePictureUrl { get; set; }
    }
}