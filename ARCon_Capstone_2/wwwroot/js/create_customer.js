document.addEventListener("DOMContentLoaded", () => {

    // =========================
    // ELEMENTS
    // =========================
    const btn = document.getElementById("btnCreateAccount");

    const fname = document.getElementById("fname");
    const lname = document.getElementById("lname");
    const mname = document.getElementById("mname");
    const email = document.getElementById("email");
    const contact = document.getElementById("contact");
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
    const landmark = document.getElementById("landmark");

    // =========================
    // ERROR HELPERS
    // =========================
    function showError(message) {
        const box = document.getElementById("formError");
        box.innerText = message;
        box.style.display = "block";
    }

    function clearError() {
        const box = document.getElementById("formError");
        box.innerText = "";
        box.style.display = "none";
    }
    //age validator
    function isValidAge(birthdayValue) {
        const today = new Date();
        const birthDate = new Date(birthdayValue);

        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();

        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        return age >= 18 && age <= 120;
    }

    // Clear error on user input (retry UX)
    [
        fname, lname, email, contact,
        birthday, password, cpassword,
        region, province, municipality, barangay
    ].forEach(el => {
        if (el) {
            el.addEventListener("input", clearError);
            el.addEventListener("change", clearError);
        }
    });

    // =========================
    // LOAD REGIONS
    // =========================
    fetch("/api/regions")
        .then(res => res.json())
        .then(data => {
            data.forEach(r => {
                const opt = document.createElement("option");
                opt.value = r.id;
                opt.textContent = r.region_name;
                region.appendChild(opt);
            });
        })
        .catch(err => console.error("Region load error:", err));

    // =========================
    // REGION → PROVINCE
    // =========================
    region.addEventListener("change", async () => {

        province.innerHTML = `<option value="">-- Select Province --</option>`;
        municipality.innerHTML = `<option value="">-- Select Municipality --</option>`;
        barangay.innerHTML = `<option value="">-- Select Barangay --</option>`;

        province.disabled = municipality.disabled = barangay.disabled = true;
        if (!region.value) return;

        const res = await fetch(`/api/provinces/regionID/${region.value}`);
        const data = await res.json();

        data.forEach(p => {
            const opt = document.createElement("option");
            opt.value = p.id;
            opt.textContent = p.province_name;
            province.appendChild(opt);
        });

        province.disabled = false;
    });

    // =========================
    // PROVINCE → MUNICIPALITY
    // =========================
    province.addEventListener("change", async () => {

        municipality.innerHTML = `<option value="">-- Select Municipality --</option>`;
        barangay.innerHTML = `<option value="">-- Select Barangay --</option>`;

        municipality.disabled = barangay.disabled = true;
        if (!province.value) return;

        const res = await fetch(`/api/municipality/provinceID/${province.value}`);
        const data = await res.json();

        data.forEach(m => {
            const opt = document.createElement("option");
            opt.value = m.id;
            opt.textContent = m.municipality_name;
            municipality.appendChild(opt);
        });

        municipality.disabled = false;
    });

    // =========================
    // MUNICIPALITY → BARANGAY
    // =========================
    municipality.addEventListener("change", async () => {

        barangay.innerHTML = `<option value="">-- Select Barangay --</option>`;
        barangay.disabled = true;
        if (!municipality.value) return;

        const res = await fetch(`/api/barangay/municipalityID/${municipality.value}`);
        const data = await res.json();

        data.forEach(b => {
            const opt = document.createElement("option");
            opt.value = b.id;
            opt.textContent = b.barangay_name;
            barangay.appendChild(opt);
        });

        barangay.disabled = false;
    });

    // =========================
    // SUBMIT
    // =========================
    btn.addEventListener("click", async () => {

        clearError();

        // Required fields
        if (
            !fname.value.trim() ||
            !lname.value.trim() ||
            !email.value.trim() ||
            !contact.value.trim() ||
            !birthday.value ||
            !password.value ||
            !cpassword.value
        ) {
            showError("Please fill in all required fields.");
            return;
        }

        // Address validation
        if (!region.value || !province.value || !municipality.value || !barangay.value) {
            showError("Please complete your address selection.");
            return;
        }

        // Password check
        if (password.value !== cpassword.value) {
            showError("Passwords do not match.");
            return;
        }

        if (!birthday.value) {
            showError("Birthday is required.");
            return;
        }

        if (!isValidAge(birthday.value)) {
            showError("Age must be 18 years old and above.");
            return;
        }


        btn.disabled = true;

        const payload = {
            first_name: fname.value,
            last_name: lname.value,
            middle_name: mname.value || null,
            birthday: birthday.value,
            email: email.value,
            contact_no: contact.value,
            password: password.value,
            address: {
                region_id: parseInt(region.value),
                province_id: parseInt(province.value),
                municipality_id: parseInt(municipality.value),
                barangay_id: parseInt(barangay.value),
                house_unit: house_unit.value || null,
                street_name: street_name.value || null,
                zip_code: zip_code.value || null,
                landmark: landmark.value || null
            }
        };

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.json();
                showError(err.message || "Registration failed.");
                btn.disabled = false;
                return;
            }

            alert("Account created successfully!");
            window.location.href = "/Shop/Home/Login";
        }
        catch (err) {
            console.error(err);
            showError("Server error. Please try again.");
            btn.disabled = false;
        }
    });
});



