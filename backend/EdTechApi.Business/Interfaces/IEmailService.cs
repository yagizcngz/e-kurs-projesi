using System.Threading.Tasks;

namespace EdTechApi.Business.Interfaces
{
    public interface IEmailService
    {
        Task SendEmailAsync(string toEmail, string subject, string body);
    }
}
