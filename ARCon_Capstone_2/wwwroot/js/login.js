document.addEventListener("DOMContentLoaded", () => {

    // =========================
    // ELEMENTS
    // =========================

    const form =
        document.getElementById("loginForm");

    const button =
        document.getElementById("loginBtn");

    const identifier =
        document.getElementById("identifier");

    const password =
        document.getElementById("password");

    const toggle =
        document.getElementById("togglePassword");

    const isAdminLogin =
        document.getElementById("isAdminLogin");

    const accessIdGroup =
        document.getElementById("accessIdGroup");

    const accessId =
        document.getElementById("accessId");

    let isSubmitting = false;

    // =========================
    // TOAST FUNCTION
    // =========================

    function showToast(
        message,
        type = "error"
    ) {

        const container =
            document.getElementById("toastContainer");

        const toast =
            document.createElement("div");

        toast.className =
            `custom-toast ${type}`;

        toast.innerHTML = `
            <div class="toast-icon">
                ${type === "error" ? "⚠️" : "✅"}
            </div>

            <div class="toast-content">

                <div class="toast-title">

                    ${type === "error"
                ? "Login Failed"
                : "Success"
            }

                </div>

                <div class="toast-message">

                    ${message}

                </div>

            </div>
        `;

        container.appendChild(toast);

        setTimeout(() => {

            toast.remove();

        }, 5000);
    }

    // =========================
    // SERVER ERROR
    // =========================

    if (window.serverError) {

        showToast(
            window.serverError,
            "error"
        );
    }

    // =========================
    // ADMIN LOGIN TOGGLE
    // =========================

    if (isAdminLogin) {

        isAdminLogin.addEventListener("change", () => {

            if (isAdminLogin.checked) {

                // SHOW ACCESS ID

                accessIdGroup.style.display =
                    "block";

                accessId.required = true;

                // UPDATE UI

                identifier.placeholder =
                    "Admin Email or Contact Number";

                button.innerText =
                    "Login as Admin";
            }
            else {

                // HIDE ACCESS ID

                accessIdGroup.style.display =
                    "none";

                accessId.required = false;

                accessId.value = "";

                // RESET UI

                identifier.placeholder =
                    "Email or Contact Number";

                button.innerText =
                    "Login";
            }
        });
    }

    // =========================
    // FORM SUBMIT
    // =========================

    form.addEventListener("submit", (e) => {

        if (isSubmitting) {

            e.preventDefault();

            return;
        }

        // =========================
        // ACCESS ID VALIDATION
        // =========================

        if (
            isAdminLogin.checked &&
            !accessId.value.trim()
        ) {

            e.preventDefault();

            showToast(
                "AIRCON-i Access ID is required for admin login."
            );

            return;
        }

        // =========================
        // IDENTIFIER VALIDATION
        // =========================

        if (
            !identifier.value.includes("@") &&
            identifier.value.length < 10
        ) {

            e.preventDefault();

            showToast(
                "Please enter a valid email address or mobile number."
            );

            return;
        }

        // =========================
        // PASSWORD VALIDATION
        // =========================

        if (password.value.length < 6) {

            e.preventDefault();

            showToast(
                "Password must be at least 6 characters."
            );

            return;
        }

        // =========================
        // LOADING STATE
        // =========================

        isSubmitting = true;

        button.disabled = true;

        button.innerText =
            isAdminLogin.checked
                ? "Logging in as Admin..."
                : "Logging in...";
    });

    // =========================
    // SHOW / HIDE PASSWORD
    // =========================

    if (toggle) {

        toggle.addEventListener("click", () => {

            password.type =

                password.type === "password"
                    ? "text"
                    : "password";

            toggle.classList.toggle("active");
        });
    }
});

