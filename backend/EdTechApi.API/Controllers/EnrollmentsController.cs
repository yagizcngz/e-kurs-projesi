using EdTechApi.Business.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace EdTechApi.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EnrollmentsController : ControllerBase
    {
        private readonly IEnrollmentService _enrollmentService;

        public EnrollmentsController(IEnrollmentService enrollmentService)
        {
            _enrollmentService = enrollmentService;
        }

            [HttpPost("student/{studentId}/course/{courseId}")]
    public async Task<IActionResult> Enroll(int studentId, int courseId)
    {
        await _enrollmentService.EnrollStudentAsync(studentId, courseId);
        return Ok(new { message = "Öğrenci kursa başarıyla kaydedildi!" });
    }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _enrollmentService.DeleteEnrollmentAsync(id);
            return Ok(new { message = "Kayıt başarıyla silindi." });
        }

        [HttpGet]
        public async Task<IActionResult> GetAllEnrollments()
        {
            var enrollments = await _enrollmentService.GetAllEnrollmentsAsync();
            return Ok(enrollments);
        }
    }
}