using EdTechApi.Business.Interfaces;
using EdTechApi.Core.Entities;
using EdTechApi.DataAccess.Context;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EdTechApi.Business.Services
{
    public class StudentService : IStudentService
    {
        private readonly AppDbContext _context;

        public StudentService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Student>> GetAllStudentsAsync()
        {
            return await _context.Students.ToListAsync();
        }

        public async Task<Student?> GetStudentByIdAsync(int id)
        {
            return await _context.Students.FindAsync(id);
        }

        public async Task AddStudentAsync(Student student)
        {
            // Aynı öğrenci numarasına sahip kayıt var mı kontrolü
            bool isNumberExist = await _context.Students.AnyAsync(s => s.StudentNumber == student.StudentNumber);
            
            if (isNumberExist)
            {
                // Varsa bir istisna (exception) fırlatıyoruz, bunu Controller yakalayacak
                throw new InvalidOperationException("Bu öğrenci numarası sistemde zaten kayıtlı. Lütfen farklı bir numara giriniz.");
            }

            await _context.Students.AddAsync(student);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteStudentAsync(int id)
        {
            var student = await _context.Students.FindAsync(id);
            if (student != null)
            {
                _context.Students.Remove(student);
                await _context.SaveChangesAsync();
            }
        }
    }
}