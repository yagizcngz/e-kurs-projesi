using EdTechApi.Business.Interfaces;
using EdTechApi.Core.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EdTechApi.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TeachersController : ControllerBase
    {
        private readonly ITeacherService _teacherService;

        public TeachersController(ITeacherService teacherService)
        {
            _teacherService = teacherService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var teachers = await _teacherService.GetAllTeachersAsync();
            return Ok(teachers);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var teacher = await _teacherService.GetTeacherByIdAsync(id);
            if (teacher == null)
            {
                return NotFound("Öğretmen bulunamadı.");
            }
            return Ok(teacher);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> CreateTeacher([FromBody] Teacher newTeacher)
        {
            await _teacherService.AddTeacherAsync(newTeacher);
            return CreatedAtAction(nameof(GetById), new { id = newTeacher.Id }, newTeacher);
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTeacher(int id, [FromBody] Teacher updatedTeacher)
        {
            var success = await _teacherService.UpdateTeacherAsync(id, updatedTeacher);
            if (!success)
            {
                return NotFound("Öğretmen bulunamadı.");
            }
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTeacher(int id)
        {
            await _teacherService.DeleteTeacherAsync(id);
            return NoContent();
        }

        [HttpPost("bulk-delete")]
        public async Task<IActionResult> DeleteMultipleTeachers([FromBody] List<int> ids)
        {
            if (ids == null || !ids.Any()) return BadRequest("Silinecek öğretmen seçilmedi.");

            foreach (var id in ids)
            {
                await _teacherService.DeleteTeacherAsync(id);
            }

            return Ok();
        }

        // Silinmiş (soft-deleted) öğretmenler — Raporlar sayfasındaki "Silinen Öğretmenler" kartı için
        [HttpGet("deleted")]
        public async Task<IActionResult> GetDeletedTeachers()
        {
            var deleted = await _teacherService.GetDeletedTeachersAsync();
            return Ok(deleted);
        }
    }
}