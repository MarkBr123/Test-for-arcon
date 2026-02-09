document.addEventListener('DOMContentLoaded', function () {
    // Schedule Repair Button Scroll to Form
    const scheduleBtn = document.getElementById('scheduleRepairBtn');
    const repairFormSection = document.querySelector('.repair-form-section');

    if (scheduleBtn && repairFormSection) {
        scheduleBtn.addEventListener('click', function () {
            repairFormSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });

            // Add focus to first input field
            setTimeout(() => {
                const firstInput = document.querySelector('#repairForm input');
                if (firstInput) {
                    firstInput.focus();
                }
            }, 300);
        });
    }

    // FAQ Accordion Functionality
    const faqQuestions = document.querySelectorAll('.faq-question');

    faqQuestions.forEach(question => {
        question.addEventListener('click', function () {
            const faqItem = this.parentElement;
            const answer = this.nextElementSibling;
            const icon = this.querySelector('.faq-icon');

            // Toggle active class
            faqItem.classList.toggle('active');

            // Toggle icon and answer
            if (faqItem.classList.contains('active')) {
                icon.textContent = '−';
                answer.style.maxHeight = answer.scrollHeight + 'px';
                answer.style.padding = '15px 0';
            } else {
                icon.textContent = '+';
                answer.style.maxHeight = '0';
                answer.style.padding = '0';
            }
        });
    });

    // Repair Form Submission - 
    const repairForm = document.getElementById('repairForm');
    const formMessage = document.getElementById('formMessage');

    if (repairForm) {
        repairForm.addEventListener('submit', function (e) {
            e.preventDefault();

            // Basic form validation
            let isValid = true;
            const errors = [];

            // Check required fields 
            const requiredFields = ['name', 'email', 'phone', 'repairType', 'description'];
            requiredFields.forEach(field => {
                const input = document.getElementById(field);
                if (input) {
                    if (!input.value.trim()) {
                        isValid = false;
                        errors.push(`${getFieldLabel(field)} is required`);
                        input.style.borderColor = '#e74c3c';
                    } else {
                        input.style.borderColor = '#ddd';
                    }
                }
            });

            // Email validation
            const emailInput = document.getElementById('email');
            if (emailInput && emailInput.value) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(emailInput.value)) {
                    isValid = false;
                    errors.push('Please enter a valid email address');
                    emailInput.style.borderColor = '#e74c3c';
                }
            }

            // Phone validation (basic)
            const phoneInput = document.getElementById('phone');
            if (phoneInput && phoneInput.value) {
                const phoneRegex = /^[\d\s\-\+\(\)]+$/;
                if (!phoneRegex.test(phoneInput.value) || phoneInput.value.replace(/\D/g, '').length < 10) {
                    isValid = false;
                    errors.push('Please enter a valid phone number');
                    phoneInput.style.borderColor = '#e74c3c';
                }
            }

            if (!isValid) {
                const errorMsg = errors.length > 0 ? errors.join('<br>') : 'Please fill in all required fields correctly.';
                showFormMessage(errorMsg, 'error');
                return;
            }

            // Show submitting message
            showFormMessage('Submitting your repair request...', 'info');

            // Simulate form submission
            setTimeout(() => {
                // Collect form data
                const formData = {
                    name: document.getElementById('name').value,
                    email: document.getElementById('email').value,
                    phone: document.getElementById('phone').value,
                    repairType: document.getElementById('repairType').value,
                    description: document.getElementById('description').value,
                    urgency: document.querySelector('input[name="urgency"]:checked')?.value || 'normal',
                    submittedAt: new Date().toISOString()
                };

                // In a real app, you would send this to your backend
                console.log('Form data:', formData);

                // Show success message
                showFormMessage('Thank you! Your repair request has been submitted successfully. We will contact you within 24 hours.', 'success');

                // Reset form
                repairForm.reset();

                // Reset radio buttons to default
                const normalUrgency = document.querySelector('input[name="urgency"][value="normal"]');
                if (normalUrgency) normalUrgency.checked = true;

                // Reset all borders
                const inputs = repairForm.querySelectorAll('input, select, textarea');
                inputs.forEach(input => {
                    input.style.borderColor = '#ddd';
                });

                // Scroll to success message
                if (formMessage) {
                    formMessage.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                }
            }, 1500);
        });
    }

    // Form input validation on blur
    const formInputs = document.querySelectorAll('#repairForm input, #repairForm textarea, #repairForm select');
    formInputs.forEach(input => {
        input.addEventListener('blur', function () {
            validateField(this);
        });

        input.addEventListener('focus', function () {
            this.style.borderColor = '#4CAF50';
        });
    });

    // Urgency option selection 
    const urgencyOptions = document.querySelectorAll('.urgency-option');
    urgencyOptions.forEach(option => {
        option.addEventListener('click', function () {
            // Get the radio input inside the label
            const radioInput = this.querySelector('input[type="radio"]');
            if (radioInput) {
                radioInput.checked = true;
            }

            // Update visual styling
            urgencyOptions.forEach(opt => {
                opt.style.backgroundColor = '#f8f9fa';
                opt.style.borderColor = '#ddd';
            });

            this.style.backgroundColor = '#e3f2fd';
            this.style.borderColor = '#2196F3';
        });
    });

    // Initialize urgency styling based on default checked radio
    const defaultChecked = document.querySelector('input[name="urgency"]:checked');
    if (defaultChecked) {
        const parentLabel = defaultChecked.closest('.urgency-option');
        if (parentLabel) {
            parentLabel.style.backgroundColor = '#e3f2fd';
            parentLabel.style.borderColor = '#2196F3';
        }
    }

    // Helper Functions
    function showFormMessage(message, type = 'info') {
        if (!formMessage) {
            console.warn('Form message element not found');
            return;
        }

        formMessage.innerHTML = message;
        formMessage.className = 'form-message';
        formMessage.classList.add(type);
        formMessage.style.display = 'block';

        // Style based on type
        if (type === 'error') {
            formMessage.style.backgroundColor = '#f8d7da';
            formMessage.style.color = '#721c24';
            formMessage.style.border = '1px solid #f5c6cb';
            formMessage.style.padding = '15px';
            formMessage.style.margin = '15px 0';
            formMessage.style.borderRadius = '5px';
        } else if (type === 'success') {
            formMessage.style.backgroundColor = '#d4edda';
            formMessage.style.color = '#155724';
            formMessage.style.border = '1px solid #c3e6cb';
            formMessage.style.padding = '15px';
            formMessage.style.margin = '15px 0';
            formMessage.style.borderRadius = '5px';
        } else {
            formMessage.style.backgroundColor = '#d1ecf1';
            formMessage.style.color = '#0c5460';
            formMessage.style.border = '1px solid #bee5eb';
            formMessage.style.padding = '15px';
            formMessage.style.margin = '15px 0';
            formMessage.style.borderRadius = '5px';
        }
    }

    function validateField(field) {
        if (!field.value.trim()) {
            field.style.borderColor = '#e74c3c';
            return false;
        }

        if (field.type === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(field.value)) {
                field.style.borderColor = '#e74c3c';
                return false;
            }
        }

        if (field.id === 'phone') {
            const phoneRegex = /^[\d\s\-\+\(\)]+$/;
            if (!phoneRegex.test(field.value) || field.value.replace(/\D/g, '').length < 10) {
                field.style.borderColor = '#e74c3c';
                return false;
            }
        }

        field.style.borderColor = '#4CAF50';
        return true;
    }

    function getFieldLabel(fieldId) {
        const labels = {
            'name': 'Full Name',
            'email': 'Email Address',
            'phone': 'Phone Number',
            'repairType': 'Repair Type',
            'description': 'Problem Description'
        };
        return labels[fieldId] || fieldId;
    }

    // Animate service cards on scroll
    if ('IntersectionObserver' in window) {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver(function (entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // Observe service cards
        const serviceCards = document.querySelectorAll('.service-card');
        serviceCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            card.style.transitionDelay = `${index * 0.1}s`;
            observer.observe(card);
        });
    }

    // Initialize FAQ answers to be hidden
    const faqAnswers = document.querySelectorAll('.faq-answer');
    faqAnswers.forEach(answer => {
        answer.style.maxHeight = '0';
        answer.style.overflow = 'hidden';
        answer.style.transition = 'max-height 0.3s ease, padding 0.3s ease';
    });
});