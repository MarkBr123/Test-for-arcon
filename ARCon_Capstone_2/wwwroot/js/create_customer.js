document.addEventListener("DOMContentLoaded", () => {

    // =========================
    // ELEMENTS
    // =========================


    const btnCreateAccount =
        document.getElementById("btnCreateAccount");

    const btnNextToTerms =
        document.getElementById("btnNextToTerms");

    const termsModal =
        document.getElementById("termsModal");

    const closeTermsModal =
        document.getElementById("closeTermsModal");

    const agreeTerms =
        document.getElementById("agreeTerms");

    const termsScrollArea =
        document.getElementById("termsScrollArea");

    const fname = document.getElementById("fname");
    const lname = document.getElementById("lname");
    const mname = document.getElementById("mname");

    const nameFields = [fname, lname, mname];

    nameFields.forEach(field => {

        field.addEventListener("input", function () {

            // Remove invalid characters
            let value = this.value.replace(
                /[^A-Za-zÑñ .'-]/g,
                ""
            );

            // Prevent multiple spaces
            value = value.replace(/\s{2,}/g, " ");

            // Prevent repeated symbols
            value = value.replace(/([.'-]){2,}/g, "$1");

            // Prevent symbols at the beginning
            value = value.replace(/^[ .'-]+/, "");

            this.value = value;

        });

    });

    const email = document.getElementById("email");
    const contact = document.getElementById("contact");

    contact.addEventListener("input", function () {

        // Allow numbers and +
        let value = this.value.replace(/[^0-9+]/g, "");

        // Only allow + at the beginning
        value = value.replace(/(?!^)\+/g, "");

        // Limit length
        if (value.startsWith("+639")) {

            value = value.slice(0, 13);

        } else {

            value = value.slice(0, 11);

        }

        this.value = value;

    });

    const birthday = document.getElementById("birthday");

    const password = document.getElementById("password");
    const cpassword = document.getElementById("cpassword");

    const region = document.getElementById("region");
    const province = document.getElementById("province");
    const municipality = document.getElementById("municipality");
    const barangay = document.getElementById("barangay");

    const house_unit = document.getElementById("house_unit");
    const street_name = document.getElementById("street_name");

    const zip_code = document.getElementById("zip_code");

    zip_code.addEventListener("input", function () {

        // Numbers only
        let value = this.value.replace(/\D/g, "");

        // Limit to 4 digits
        this.value = value.slice(0, 4);

    });
    const landmark = document.getElementById("landmark");

    // =========================
    // TOAST SYSTEM
    // =========================

    function showToast(
        message,
        type = "error",
        title = null
    ) {

        const container =
            document.getElementById("toastContainer");

        const toast =
            document.createElement("div");

        toast.className =
            `custom-toast ${type}`;

        let icon = "⚠️";

        if (type === "success") {
            icon = "✅";
        }

        toast.innerHTML = `
            <div class="toast-icon">
                ${icon}
            </div>

            <div class="toast-content">

                <div class="toast-title">
                    ${title ||
            (
                type === "success"
                    ? "Success"
                    : "Registration Problem"
            )
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

    function showError(message) {

        showToast(
            message,
            "error"
        );
    }

    function showSuccess(message) {

        showToast(
            message,
            "success",
            "Welcome!"
        );
    }

    // =========================
    // INPUT ERROR STATES
    // =========================

    function markInvalid(el) {

        if (!el) return;

        el.classList.add("input-error");
    }

    function clearInvalid(el) {

        if (!el) return;

        el.classList.remove("input-error");
    }

    function clearAllInvalid() {

        document
            .querySelectorAll(".input-error")
            .forEach(el => {
                el.classList.remove("input-error");
            });
    }

    // =========================
    // AGE VALIDATOR
    // =========================

    function isValidAge(birthdayValue) {

        const today = new Date();

        const birthDate =
            new Date(birthdayValue);

        let age =
            today.getFullYear() -
            birthDate.getFullYear();

        const monthDifference =
            today.getMonth() -
            birthDate.getMonth();

        if (
            monthDifference < 0 ||
            (
                monthDifference === 0 &&
                today.getDate() < birthDate.getDate()
            )
        ) {
            age--;
        }

        return age >= 18 && age <= 120;
    }

    // =========================
    // CLEAR INVALID ON INPUT
    // =========================

    [
        fname,
        lname,
        email,
        contact,
        birthday,
        password,
        cpassword,
        region,
        province,
        municipality,
        barangay
    ].forEach(el => {

        if (!el) return;

        el.addEventListener("input", () => {
            clearInvalid(el);
        });

        el.addEventListener("change", () => {
            clearInvalid(el);
        });
    });

    // =========================
    // LOAD REGIONS
    // =========================

    fetch("/api/regions")
        .then(res => res.json())
        .then(data => {

            data.forEach(r => {

                const opt =
                    document.createElement("option");

                opt.value = r.id;
                opt.textContent = r.region_name;

                region.appendChild(opt);
            });
        })
        .catch(err => {

            console.error(
                "Region load error:",
                err
            );

            showError(
                "Unable to load address information."
            );
        });

    // =========================
    // REGION → PROVINCE
    // =========================

    region.addEventListener("change", async () => {

        province.innerHTML =
            `<option value="">-- Select Province --</option>`;

        municipality.innerHTML =
            `<option value="">-- Select Municipality / City --</option>`;

        barangay.innerHTML =
            `<option value="">-- Select Barangay --</option>`;

        province.disabled = true;
        municipality.disabled = true;
        barangay.disabled = true;

        if (!region.value) return;

        try {

            const res =
                await fetch(`/api/provinces/regionID/${region.value}`);

            const data =
                await res.json();

            data.forEach(p => {

                const opt =
                    document.createElement("option");

                opt.value = p.id;
                opt.textContent = p.province_name;

                province.appendChild(opt);
            });

            province.disabled = false;
        }
        catch {

            showError(
                "Unable to load provinces."
            );
        }
    });

    // =========================
    // PROVINCE → MUNICIPALITY
    // =========================

    province.addEventListener("change", async () => {

        municipality.innerHTML =
            `<option value="">-- Select Municipality / City --</option>`;

        barangay.innerHTML =
            `<option value="">-- Select Barangay --</option>`;

        municipality.disabled = true;
        barangay.disabled = true;

        if (!province.value) return;

        try {

            const res =
                await fetch(`/api/municipality/provinceID/${province.value}`);

            const data =
                await res.json();

            data.forEach(m => {

                const opt =
                    document.createElement("option");

                opt.value = m.id;
                opt.textContent =
                    m.municipality_name;

                municipality.appendChild(opt);
            });

            municipality.disabled = false;
        }
        catch {

            showError(
                "Unable to load municipalities."
            );
        }
    });

    // =========================
    // MUNICIPALITY → BARANGAY
    // =========================

    municipality.addEventListener("change", async () => {

        barangay.innerHTML =
            `<option value="">-- Select Barangay --</option>`;

        barangay.disabled = true;

        if (!municipality.value) return;

        try {

            const res =
                await fetch(`/api/barangay/municipalityID/${municipality.value}`);

            const data =
                await res.json();

            data.forEach(b => {

                const opt =
                    document.createElement("option");

                opt.value = b.id;
                opt.textContent =
                    b.barangay_name;

                barangay.appendChild(opt);
            });

            barangay.disabled = false;
        }
        catch {

            showError(
                "Unable to load barangays."
            );
        }
    });

    // =========================
    // PASSWORD TOGGLE
    // =========================

    document
        .querySelectorAll(".password-toggle-btn")
        .forEach(button => {

            button.addEventListener("click", () => {

                const targetId =
                    button.dataset.target;

                const input =
                    document.getElementById(targetId);

                if (!input) return;

                const isHidden =
                    input.type === "password";

                input.type =
                    isHidden
                        ? "text"
                        : "password";

                button.innerText =
                    isHidden
                        ? "🙈"
                        : "👁";
            });
        });

    // =========================
    // TERMS MODAL FLOW
    // =========================

    btnNextToTerms.addEventListener("click", () => {

        clearAllInvalid();

        const requiredFields = [
            fname,
            lname,
            email,
            contact,
            birthday,
            password,
            cpassword,
            house_unit,
            street_name,
            zip_code,
            landmark
        ];

        let hasError = false;

        requiredFields.forEach(field => {

            if (!field.value.trim()) {

                markInvalid(field);

                hasError = true;
            }
        });

        if (hasError) {

            showError(
                "Please complete all required fields."
            );

            return;
        }


        if (!house_unit.value.trim()) markInvalid(house_unit);
        if (!street_name.value.trim()) markInvalid(street_name);
        if (!zip_code.value.trim()) markInvalid(zip_code);
        if (!landmark.value.trim()) markInvalid(landmark);
        if (!region.value) markInvalid(region);
        if (!province.value) markInvalid(province);
        if (!municipality.value) markInvalid(municipality);
        if (!barangay.value) markInvalid(barangay);


        if (

            !house_unit.value.trim() ||
            !street_name.value.trim() ||
            !zip_code.value.trim() || 
            !landmark.value.trim() || 
            !region.value ||
            !province.value ||
            !municipality.value ||
            !barangay.value
        ) {

            showError(
                "Please complete your address information."
            );

            return;
        }

        const emailRegex =
            /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

        if (!emailRegex.test(email.value.trim())) {

            markInvalid(email);

            showError(
                "Please enter a valid email address."
            );

            return;
        }

        const contactRegex =
            /^(09\d{9}|\+639\d{9})$/;

        if (!contactRegex.test(contact.value)) {

            markInvalid(contact);

            showError(
                "Please enter a valid Philippine mobile number."
            );

            return;
        }

        if (password.value.length < 8) {

            markInvalid(password);

            showError(
                "Password must be at least 8 characters."
            );

            return;
        }

        if (
            !/(?=.*[A-Z])/.test(password.value) ||
            !/(?=.*[a-z])/.test(password.value) ||
            !/(?=.*\d)/.test(password.value) ||
            !/(?=.*[^A-Za-z0-9])/.test(password.value)
        ) {

            markInvalid(password);

            showError(
                "Password must contain uppercase, lowercase, number, and symbol."
            );

            return;
        }

        if (password.value !== cpassword.value) {

            markInvalid(password);
            markInvalid(cpassword);

            showError(
                "Passwords do not match."
            );

            return;
        }

        if (!isValidAge(birthday.value)) {

            markInvalid(birthday);

            showError(
                "You must be at least 18 years old to register."
            );

            return;
        }

        // OPEN MODAL

        termsModal.classList.add("active");
    });





    // CLOSE MODAL

    closeTermsModal.addEventListener("click", () => {

        termsModal.classList.remove("active");
    });

    // BACKDROP CLOSE

    termsModal.addEventListener("click", (e) => {

        if (e.target === termsModal) {

            termsModal.classList.remove("active");
        }
    });

    // ENABLE CHECKBOX AFTER SCROLL

    termsScrollArea.addEventListener("scroll", () => {

        const reachedBottom =

            termsScrollArea.scrollTop +
            termsScrollArea.clientHeight >=
            termsScrollArea.scrollHeight - 10;

        if (reachedBottom) {

            agreeTerms.disabled = false;
        }
    });

    // =========================
    // CREATE ACCOUNT
    // =========================

    btnCreateAccount.addEventListener("click", async () => {

        if (!agreeTerms.checked) {

            showError(
                "Please agree to the Privacy Policy and Terms."
            );

            return;
        }

        btnCreateAccount.disabled = true;

        btnCreateAccount.innerText =
            "Creating Account...";

        const payload = {

            first_name:
                fname.value.trim(),

            last_name:
                lname.value.trim(),

            middle_name:
                mname.value.trim() || null,

            birthday:
                birthday.value,

            email:
                email.value.trim(),

            contact_no:
                contact.value.trim(),

            password:
                password.value,

            address: {

                region_id:
                    parseInt(region.value),

                province_id:
                    parseInt(province.value),

                municipality_id:
                    parseInt(municipality.value),

                barangay_id:
                    parseInt(barangay.value),

                house_unit:
                    house_unit.value.trim() || null,

                street_name:
                    street_name.value.trim() || null,

                zip_code:
                    zip_code.value.trim() || null,

                landmark:
                    landmark.value.trim() || null
            }
        };

        try {

            const res =
                await fetch("/api/auth/register", {

                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body:
                        JSON.stringify(payload)
                });

            const data =
                await res.json();

            if (!res.ok) {

                showError(
                    data.message ||
                    "Registration failed."
                );

                btnCreateAccount.disabled = false;

                btnCreateAccount.innerText =
                    "Create Account";

                return;
            }

            // SUCCESS

            showToast(
                "Your account has been created successfully!",
                "success",
                "Welcome to AIRCON-i!"
            );

            // CLOSE TERMS MODAL

            termsModal.classList.remove("active");

            // BUTTON STATE

            btnCreateAccount.innerText =
                "Account Created";

            btnCreateAccount.disabled = true;

            // REDIRECT

            setTimeout(() => {

                window.location.href =
                    "/Shop/Home/Login";

            }, 3000);
        }
        catch (err) {

            console.error(err);

            showError(
                "Server error. Please try again later."
            );

            btnCreateAccount.disabled = false;

            btnCreateAccount.innerText =
                "Create Account";
        }
    });
});

