using EdTechApi.Core.Entities;
using FluentValidation;

namespace EdTechApi.Business.ValidationRules
{
    public class StudentValidator : AbstractValidator<Student>
    {
        public StudentValidator()
        {
            RuleFor(s => s.FirstName).NotEmpty().WithMessage("Öğrenci adı boş bırakılamaz.");
            RuleFor(s => s.LastName).NotEmpty().WithMessage("Öğrenci soyadı boş bırakılamaz.");
            RuleFor(s => s.StudentNumber)
                .NotEmpty().WithMessage("Öğrenci numarası boş bırakılamaz.")
                .Length(9).WithMessage("Öğrenci numarası tam 9 haneli olmalıdır.");
        }
    }
}