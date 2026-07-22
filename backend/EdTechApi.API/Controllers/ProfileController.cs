using EdTechApi.Business.Interfaces;
using EdTechApi.DataAccess.Context;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace EdTechApi.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ProfileController : ControllerBase
    {
        private readonly IStudentService _studentService;
        private readonly AppDbContext _context;

        public ProfileController(IStudentService studentService, AppDbContext context)
        {
            _studentService = studentService;
            _context = context;
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetMe()
        {
            var username = GetCurrentUsername();
            if (string.IsNullOrEmpty(username)) return Unauthorized();

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
            if (user == null) return NotFound();

            var student = await _context.Students.FirstOrDefaultAsync(s => s.UserId == user.Id);

            if (student != null)
            {
                return Ok(new
                {
                    source = "student",
                    aboutMe = student.AboutMe,
                    profilePictureUrl = student.ProfilePictureUrl,
                    firstName = student.FirstName, // GERÇEK AD EKLENDİ
                    lastName = student.LastName    // GERÇEK SOYAD EKLENDİ
                });
            }

            return Ok(new
            {
                source = "user",
                aboutMe = user.AboutMe,
                profilePictureUrl = user.ProfilePictureUrl,
                firstName = "",
                lastName = ""
            });
        }

        [HttpPut("me")]
        public async Task<IActionResult> UpdateMe([FromBody] UpdateProfileRequest request)
        {
            var username = GetCurrentUsername();
            if (string.IsNullOrEmpty(username)) return Unauthorized();

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
            if (user == null) return NotFound("Bu hesaba karşılık gelen bir kayıt bulunamadı.");

            var student = await _context.Students.FirstOrDefaultAsync(s => s.UserId == user.Id);

            if (student != null)
            {
                student.AboutMe = request.AboutMe;
                student.ProfilePictureUrl = request.ProfilePictureUrl;

                user.AboutMe = request.AboutMe;
                user.ProfilePictureUrl = request.ProfilePictureUrl;

                await _context.SaveChangesAsync();
                return Ok(new { message = "Öğrenci profili başarıyla güncellendi.", source = "student" });
            }
            else
            {
                user.AboutMe = request.AboutMe;
                user.ProfilePictureUrl = request.ProfilePictureUrl;

                await _context.SaveChangesAsync();
                return Ok(new { message = "Kullanıcı profili başarıyla güncellendi.", source = "user" });
            }
        }

        private string? GetCurrentUsername()
        {
            return User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                ?? User.Identity?.Name;
        }
    }
}