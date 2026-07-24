using EdTechApi.DataAccess.Context;
using EdTechApi.Core.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace EdTechApi.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly AppDbContext _context;

        // --- Sabit Kayıt Kodları (Geliştirme Ortamı İçin) ---
        private const string TEACHER_CODE = "12345";
        private const string ADMIN_CODE = "88888";

        public AuthController(IConfiguration configuration, AppDbContext context)
        {
            _configuration = configuration;
            _context = context;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            // Kullanıcı adı veya E-posta kontrolü
            var userExists = await _context.Users.AnyAsync(u => u.Username == request.Username);
            if (userExists)
                return BadRequest("Bu kullanıcı adı zaten alınmış.");

            // Rol ataması: Gelen RegistrationCode'a göre karar veriyoruz
            string assignedRole = "User"; // Varsayılan Öğrenci

            if (!string.IsNullOrEmpty(request.RegistrationCode))
            {
                if (request.RegistrationCode == ADMIN_CODE)
                {
                    assignedRole = "Admin";
                }
                else if (request.RegistrationCode == TEACHER_CODE)
                {
                    assignedRole = "Teacher";
                }
                else
                {
                    return BadRequest("Geçersiz Kayıt Kodu.");
                }
            }

            // Geriye dönük uyumluluk: superadmin adı da Admin yapar
            if (request.Username == "superadmin" && assignedRole == "User")
            {
                assignedRole = "Admin";
            }

            // 1. Önce Kullanıcı (User) Hesabını Oluştur
            var newUser = new User
            {
                Username = request.Username,
                Password = BCrypt.Net.BCrypt.HashPassword(request.Password),
                Role = assignedRole,
                FirstName = request.FirstName, // EKLENDİ
                LastName = request.LastName    // EKLENDİ
            };

            await _context.Users.AddAsync(newUser);
            await _context.SaveChangesAsync();

            // 2. Eğer rolü 'User' ise anında bir Öğrenci (Student) profili oluştur
            if (assignedRole == "User")
            {
                var newStudent = new Student
                {
                    FirstName = request.FirstName,
                    LastName = request.LastName,
                    Email = request.Email ?? (request.Username + "@ekurs.com"), // Gelen emaili kullan
                    Date = DateTime.Now,
                    UserId = newUser.Id 
                };

                await _context.Students.AddAsync(newStudent);
                await _context.SaveChangesAsync(); // Bu satırdan sonra newStudent.Id atanmış olur

                // Öğrenci numarasını, sistemdeki diğer öğrencilerle aynı formatta üretiyoruz:
                // "YY" (yılın son 2 hanesi) + Student.Id'nin 7 haneye tamamlanmış hali (örn. 260000014)
                string yearPrefix = DateTime.Now.ToString("yy");
                newStudent.StudentNumber = yearPrefix + newStudent.Id.ToString().PadLeft(7, '0');
                await _context.SaveChangesAsync();
            }
            // 3. Eğer rolü 'Teacher' ise anında bir Öğretmen (Teacher) profili oluştur
            else if (assignedRole == "Teacher")
            {
                 var newTeacher = new Teacher
                 {
                     FirstName = request.FirstName,
                     LastName = request.LastName,
                     Email = request.Email ?? (request.Username + "@ekurs.com"),
                     Date = DateTime.Now,
                     UserId = newUser.Id
                 };
                 await _context.Teachers.AddAsync(newTeacher);
                 await _context.SaveChangesAsync(); // Bu satırdan sonra newTeacher.Id atanmış olur

                 // Öğrencilerle aynı formatta numara üretiyoruz:
                 // "YY" (yılın son 2 hanesi) + Id'nin 7 haneye tamamlanmış hali
                 string teacherYearPrefix = DateTime.Now.ToString("yy");
                 newTeacher.TeacherNumber = teacherYearPrefix + newTeacher.Id.ToString().PadLeft(7, '0');
                 await _context.SaveChangesAsync();
            }

            return Ok(new { message = $"Kullanıcı başarıyla oluşturuldu. Atanan Rol: {assignedRole}" });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == request.Username);

            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.Password))
            {
                return Unauthorized("Geçersiz kullanıcı adı veya şifre.");
            }

            var tokenString = GenerateJwtToken(user);
            return Ok(new { token = tokenString });
        }

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

        private string GenerateJwtToken(User user)
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Username),
                new Claim(ClaimTypes.Role, user.Role),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddMinutes(180),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

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

    public class RegisterRequest
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        
        // YENİ EKLENEN ALANLAR
        public string Email { get; set; } = string.Empty;
        public string? RegistrationCode { get; set; } 
    }
}