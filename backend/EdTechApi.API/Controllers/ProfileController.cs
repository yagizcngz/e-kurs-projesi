using EdTechApi.Business.Interfaces;
using EdTechApi.DataAccess.Context;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace EdTechApi.API.Controllers
{
    // /api/students/me ve /api/auth/me'yi ayrı ayrı, sırayla çağırmak yerine (iki round-trip,
    // biri her zaman 404 dönen) TEK bir istekte "önce öğrenci mi, değilse kullanıcı mı" mantığını
    // burada, backend içinde hallediyoruz. /profil sayfası ve AppSidebar artık sadece bunu çağırıyor.
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

            var student = await _studentService.GetStudentByUsernameAsync(username);
            if (student != null)
            {
                return Ok(new
                {
                    source = "student",
                    aboutMe = student.AboutMe,
                    profilePictureUrl = student.ProfilePictureUrl,
                });
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
            if (user == null) return NotFound();

            return Ok(new
            {
                source = "user",
                aboutMe = user.AboutMe,
                profilePictureUrl = user.ProfilePictureUrl,
            });
        }

        [HttpPut("me")]
        public async Task<IActionResult> UpdateMe([FromBody] UpdateProfileRequest request)
        {
            var username = GetCurrentUsername();
            if (string.IsNullOrEmpty(username)) return Unauthorized();

            var studentUpdated = await _studentService.UpdateStudentProfileAsync(
                username, request.AboutMe, request.ProfilePictureUrl);

            if (studentUpdated)
            {
                return Ok(new { message = "Profil güncellendi.", source = "student" });
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
            if (user == null) return NotFound("Bu hesaba karşılık gelen bir kayıt bulunamadı.");

            user.AboutMe = request.AboutMe;
            user.ProfilePictureUrl = request.ProfilePictureUrl;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Profil güncellendi.", source = "user" });
        }

        private string? GetCurrentUsername()
        {
            return User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                ?? User.Identity?.Name;
        }
    }
}