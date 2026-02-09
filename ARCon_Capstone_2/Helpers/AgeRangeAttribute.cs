using System.ComponentModel.DataAnnotations;

namespace ARCon_Capstone_2.Helpers
{
    public class AgeRangeAttribute : ValidationAttribute
    {
        private readonly int _minAge;
        private readonly int _maxAge;

        public AgeRangeAttribute(int minAge, int maxAge)
        {
            _minAge = minAge;
            _maxAge = maxAge;
        }

        protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
        {
            if (value == null)
                return new ValidationResult("Birthday is required.");

            if (value is not DateOnly birthDate)
                return new ValidationResult("Invalid birth date.");

            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            int age = today.Year - birthDate.Year;

            // Adjust if birthday hasn't occurred yet this year
            if (birthDate > today.AddYears(-age))
                age--;

            if (age < _minAge || age > _maxAge)
                return new ValidationResult($"Age must be between {_minAge} and {_maxAge} years.");

            return ValidationResult.Success;
        }
    }
}
