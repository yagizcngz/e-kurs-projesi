namespace EdTechApi.Core.Entities
{
    public class User
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty; 
        
        // Sisteme yeni eklenen herkes varsayılan olarak "User" (Kullanıcı) rolüyle başlar
        public string Role { get; set; } = "User"; 
    }
}