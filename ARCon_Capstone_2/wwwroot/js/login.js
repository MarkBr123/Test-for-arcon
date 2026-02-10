document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("loginForm");
    const button = document.getElementById("loginBtn");
    const identifier = document.getElementById("identifier");
    const password = document.getElementById("password");
    const toggle = document.getElementById("togglePassword");

    // Prevent double submit + show loading
    form.addEventListener("submit", () => {
        if (!identifier.value.trim() || !password.value.trim()) {
            alert("Please enter your email/contact number and password.");
            return false;
        }

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
