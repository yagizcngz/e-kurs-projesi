using EdTechApi.Business.Interfaces;
using EdTechApi.Core.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Threading.Tasks;

namespace EdTechApi.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StudentsController : ControllerBase
    {
        private readonly IStudentService _studentService;

        public StudentsController(IStudentService studentService)
        {
            _studentService = studentService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var students = await _studentService.GetAllStudentsAsync();
            return Ok(students);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var student = await _studentService.GetStudentByIdAsync(id);
            if (student == null)
            {
                return NotFound("Öğrenci bulunamadı.");
            }
            return Ok(student);
        }

        // Giriş yapan kullanıcının KENDİ öğrenci profilini döner (ad-soyad eşleştirmesiyle).
        // /profil sayfasındaki "Kendim Hakkında" ve "Profil Fotoğrafı" bilgilerini buradan çekiyoruz.
        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> GetMyProfile()
        {
            var username = GetCurrentUsername();
            if (string.IsNullOrEmpty(username))
            {
                return Unauthorized();
            }

            var student = await _studentService.GetStudentByUsernameAsync(username);
            if (student == null)
            {
                // Örn. superadmin gibi bir Student kaydına karşılık gelmeyen hesaplar için
                return NotFound("Bu hesaba karşılık gelen bir öğrenci kaydı bulunamadı.");
            }

            return Ok(student);
        }

        // Giriş yapan kullanıcının kendi "Kendim Hakkında" ve profil fotoğrafını günceller.
        [Authorize]
        [HttpPut("me")]
        public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateProfileRequest request)
        {
            var username = GetCurrentUsername();
            if (string.IsNullOrEmpty(username))
            {
                return Unauthorized();
            }

            var success = await _studentService.UpdateStudentProfileAsync(
                username, request.AboutMe, request.ProfilePictureUrl);

            if (!success)
            {
                return NotFound("Bu hesaba karşılık gelen bir öğrenci kaydı bulunamadı.");
            }

            return Ok(new { message = "Profil güncellendi." });
        }

        [HttpPost]
        public async Task<IActionResult> CreateStudent([FromBody] Student newStudent)
        {
            try
            {
                await _studentService.AddStudentAsync(newStudent);
                return CreatedAtAction(nameof(GetById), new { id = newStudent.Id }, newStudent);
            }
            catch (InvalidOperationException ex)
            {
                // Servisten gelen benzersizlik hatasını yakalayıp arayüze iletiyoruz
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteStudent(int id)
        {
            await _studentService.DeleteStudentAsync(id);
            return NoContent();
        }
        [HttpPost("bulk-delete")]
        public async Task<IActionResult> DeleteMultipleStudents([FromBody] List<int> ids)
        {
            if (ids == null || !ids.Any()) return BadRequest("Silinecek öğrenci seçilmedi.");

            foreach (var id in ids)
            {
                // Mevcut servis metodunu kullanarak seçili id'leri sırasıyla siliyoruz
                await _studentService.DeleteStudentAsync(id);
            }

            return Ok();
        }

        // AuthController'da token "sub" claim'ine kullanıcı adını yazıyor. ASP.NET Core JWT
        // middleware'i bu claim'i genelde ClaimTypes.NameIdentifier'a eşler; her ihtimale karşı
        // ikisini de ve ham "sub" değerini de kontrol ediyoruz.
        private string? GetCurrentUsername()
        {
            return User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                ?? User.Identity?.Name;
        }
    }

    public class UpdateProfileRequest
    {
        public string? AboutMe { get; set; }
        public string? ProfilePictureUrl { get; set; }
    }
}