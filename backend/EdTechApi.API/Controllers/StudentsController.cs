using EdTechApi.Business.Interfaces;
using EdTechApi.Core.Entities;
using Microsoft.AspNetCore.Mvc;
using System;
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
    }
}