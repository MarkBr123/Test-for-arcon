document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("loginForm");
    const button = document.getElementById("loginBtn");
    const identifier = document.getElementById("identifier");
    const password = document.getElementById("password");
    const toggle = document.getElementById("togglePassword");

    let isSubmitting = false;

    // Prevent double submit + validate
    form.addEventListener("submit", (e) => {
        if (isSubmitting) {
            e.preventDefault();
            return;
        }

        if (!identifier.value.includes("@") && identifier.value.length < 10) {
            alert("Enter a valid email or contact number.");
            e.preventDefault();
            return;
        }

        // loading state
        isSubmitting = true;
        button.disabled = true;
        button.innerText = "Logging in...";
    });

    // Show / hide password
    if (toggle) {
        toggle.addEventListener("click", () => {
            password.type =
                password.type === "password" ? "text" : "password";
        });
    }
});