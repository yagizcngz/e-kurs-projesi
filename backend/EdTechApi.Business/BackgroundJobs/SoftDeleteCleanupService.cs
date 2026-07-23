using EdTechApi.DataAccess.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace EdTechApi.Business.BackgroundJobs
{
    public class SoftDeleteCleanupService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<SoftDeleteCleanupService> _logger;

        public SoftDeleteCleanupService(IServiceProvider serviceProvider, ILogger<SoftDeleteCleanupService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                _logger.LogInformation("Soft-delete temizlik görevi (job) çalışıyor...");

                try
                {
                    using (var scope = _serviceProvider.CreateScope())
                    {
                        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                        
                        // 30 gün öncesinin tarihini belirliyoruz
                        var thresholdDate = DateTime.UtcNow.AddDays(-30);

                        // Global filtreyi yoksayarak (IgnoreQueryFilters) silinmiş ve 30 günü doldurmuş öğrencileri buluyoruz
                        var oldStudents = await dbContext.Students
                            .IgnoreQueryFilters()
                            .Where(s => s.IsDeleted && s.DeletedAt != null && s.DeletedAt < thresholdDate)
                            .ToListAsync(stoppingToken);

                        if (oldStudents.Any())
                        {
                            dbContext.Students.RemoveRange(oldStudents);
                            _logger.LogInformation($"{oldStudents.Count} adet 30 günden eski silinmiş öğrenci kalıcı olarak veritabanından kaldırıldı.");
                        }

                        // Aynı işlemi AppDbContext'teki diğer tablolar için de tekrarlayabilirsin (Courses, Teachers, Enrollments)
                        var oldCourses = await dbContext.Courses
                            .IgnoreQueryFilters()
                            .Where(c => c.IsDeleted && c.DeletedAt != null && c.DeletedAt < thresholdDate)
                            .ToListAsync(stoppingToken);

                        if (oldCourses.Any())
                        {
                            dbContext.Courses.RemoveRange(oldCourses);
                        }

                        // Değişiklikleri veritabanına yansıt
                        await dbContext.SaveChangesAsync(stoppingToken);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Soft-delete temizlik görevi sırasında bir hata oluştu.");
                }

                // Döngünün tekrar çalışması için 24 saat (1 gün) bekletiyoruz
                await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
            }
        }
    }
}