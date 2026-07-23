using EdTechApi.Business.Interfaces;
using EdTechApi.Core.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace EdTechApi.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CoursesController : ControllerBase
    {
        private readonly ICourseService _courseService;

        public CoursesController(ICourseService courseService)
        {
            _courseService = courseService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var courses = await _courseService.GetAllCoursesAsync();
            return Ok(courses);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var course = await _courseService.GetCourseByIdAsync(id);
            if (course == null)
            {
                return NotFound("Kurs bulunamadı.");
            }
            return Ok(course);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> CreateCourse([FromBody] Course newCourse)
        {
            await _courseService.AddCourseAsync(newCourse);
            return CreatedAtAction(nameof(GetById), new { id = newCourse.Id }, newCourse);
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCourse(int id, [FromBody] Course updatedCourse)
        {
            var success = await _courseService.UpdateCourseAsync(id, updatedCourse);
            if (!success)
            {
                return NotFound("Kurs bulunamadı.");
            }
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCourse(int id)
        {
            await _courseService.DeleteCourseAsync(id);
            return NoContent();
        }

        // Silinmiş (soft-deleted) kurslar — Raporlar sayfasındaki "Silinen Kurslar" kartı için
        [HttpGet("deleted")]
        public async Task<IActionResult> GetDeletedCourses()
        {
            var deleted = await _courseService.GetDeletedCoursesAsync();
            return Ok(deleted);
        }
    }
}