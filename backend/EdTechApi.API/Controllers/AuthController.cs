using EdTechApi.DataAccess.Context;
using EdTechApi.Core.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System;

namespace EdTechApi.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly AppDbContext _context;

        public AuthController(IConfiguration configuration, AppDbContext context)
        {
            _configuration = configuration;
            _context = context;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request) // Model RegisterRequest olarak güncellendi
        {
            var userExists = await _context.Users.AnyAsync(u => u.Username == request.Username);
            if (userExists)
                return BadRequest("Bu kullanıcı adı zaten alınmış.");

            // GÜVENLİK KONTROLÜ: İlk admini oluşturmak için pratik bir yöntem.
            // Gerçek projede bu kısımlar Seed Data ile atılır.
            string assignedRole = request.Username == "superadmin" ? "Admin" : "User";

            // 1. Önce Kullanıcı (User) Hesabını Oluştur
            var newUser = new User
            {
                Username = request.Username,
                Password = BCrypt.Net.BCrypt.HashPassword(request.Password),
                Role = assignedRole // Rolü dışarıdan JSON ile değil, kendi mantığımızla atıyoruz.
            };

            await _context.Users.AddAsync(newUser);
            await _context.SaveChangesAsync();

            // 2. Eğer rolü 'User' ise anında bir Öğrenci (Student) profili oluştur ve UserId ile bağla
            if (assignedRole == "User")
            {
                var newStudent = new Student
                {
                    FirstName = request.FirstName,
                    LastName = request.LastName,
                    StudentNumber = "OGR-" + newUser.Id.ToString().PadLeft(4, '0'), // Örn: OGR-0015
                    Email = request.Username + "@ekurs.com", // Otomatik geçici e-posta
                    Date = DateTime.Now,
                    UserId = newUser.Id // EŞLEŞTİRME BURADA YAPILIYOR
                };

                await _context.Students.AddAsync(newStudent);
                await _context.SaveChangesAsync();
            }

            return Ok(new { message = $"Kullanıcı başarıyla oluşturuldu." });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == request.Username);

            // Kullanıcı veritabanında yoksa VEYA gönderilen şifrenin çözülmüş hali veritabanındakiyle eşleşmiyorsa
            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.Password))
            {
                return Unauthorized("Geçersiz kullanıcı adı veya şifre.");
            }

            var tokenString = GenerateJwtToken(user);
            return Ok(new { token = tokenString });
        }

        // Giriş yapan kullanıcının KENDİ hesap bilgilerini (Kendim Hakkında, profil fotoğrafı) döner.
        // Bu, bir Student kaydına karşılık gelmeyen hesaplar (örn. admin) için kullanılır —
        // /profil sayfası önce /api/students/me'yi dener, o 404 dönerse buraya düşer.
        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> GetMe()
        {
            var username = GetCurrentUsername();
            if (string.IsNullOrEmpty(username)) return Unauthorized();

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
            if (user == null) return NotFound();

            return Ok(new
            {
                user.Id,
                user.Username,
                user.Role,
                user.AboutMe,
                user.ProfilePictureUrl,
            });
        }

        // Giriş yapan kullanıcının kendi "Kendim Hakkında" ve profil fotoğrafını günceller.
        [Authorize]
        [HttpPut("me")]
        public async Task<IActionResult> UpdateMe([FromBody] UpdateUserProfileRequest request)
        {
            var username = GetCurrentUsername();
            if (string.IsNullOrEmpty(username)) return Unauthorized();

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
            if (user == null) return NotFound();

            user.AboutMe = request.AboutMe;
            user.ProfilePictureUrl = request.ProfilePictureUrl;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Profil güncellendi." });
        }

        private string GenerateJwtToken(User user) // Parametreyi User nesnesi alacak şekilde değiştirdik
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Username),
                new Claim(ClaimTypes.Role, user.Role), // KULLANICININ ROLÜNÜ BİLETE MÜHÜRLÜYORUZ
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddMinutes(180), // 30 dakika geçerli olacak
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        // StudentsController'daki ile aynı mantık: "sub" claim'i genelde ClaimTypes.NameIdentifier'a
        // eşlenir; her ihtimale karşı ikisini de ve ham "sub" değerini de kontrol ediyoruz.
        private string? GetCurrentUsername()
        {
            return User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                ?? User.Identity?.Name;
        }
    }

    public class LoginRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class UpdateUserProfileRequest
    {
        public string? AboutMe { get; set; }
        public string? ProfilePictureUrl { get; set; }
    }

    // YENİ EKLENEN MODEL
    public class RegisterRequest
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}