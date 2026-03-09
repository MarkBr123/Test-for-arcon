
//create new Service AC Type
async function saveAcType() {
    const input = document.getElementById("acTypeName");
    const name = input.value.trim();

    input.classList.remove("is-invalid");

    if (!name) {
        input.classList.add("is-invalid");
        return;
    }

    const response = await fetch("/api/service-aircon-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
    });

    if (response.ok) {
        input.value = "";

        const modal = bootstrap.Modal.getInstance(
            document.getElementById("acTypeModal")
        );
        modal.hide();

        // optional: refresh dropdown or list
        //location.reload();
    }
    else if (response.status === 409) {
        alert("Aircon type already exists.");
    }
    else {
        alert("Something went wrong.");
    }
}
    // clears modal inputs when reopened
    document.getElementById('acTypeModal')
        .addEventListener('hidden.bs.modal', () => {
        document.getElementById('acTypeName')
            .classList.remove('is-invalid');
        });

    document.getElementById('serviceCategoryModal')
        .addEventListener('hidden.bs.modal', () => {
        document.getElementById('categoryName')
            .classList.remove('is-invalid');
    document.getElementById('categoryDesc')
    .classList.remove('is-invalid');
        });


async function saveServiceCategory() {
    const nameInput = document.getElementById("categoryName");
    const descInput = document.getElementById("categoryDesc");
    const classSelect = document.getElementById("categoryClass");

    const name = nameInput.value.trim();
    const description = descInput.value.trim();
    const serviceClass = classSelect.value;

    nameInput.classList.remove("is-invalid");
    descInput.classList.remove("is-invalid");
    classSelect.classList.remove("is-invalid");

    let hasError = false;

    if (!name) {
        nameInput.classList.add("is-invalid");
        hasError = true;
    }

    if (!description) {
        descInput.classList.add("is-invalid");
        hasError = true;
    }

    if (!serviceClass) {
        classSelect.classList.add("is-invalid");
        hasError = true;
    }

    if (hasError) return;

    const response = await fetch("/api/service-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name,
            description,
            serviceClass   // ✅ NEW
        })
    });

    if (response.ok) {
        nameInput.value = "";
        descInput.value = "";
        classSelect.value = "";

        const modal = bootstrap.Modal.getInstance(
            document.getElementById("serviceCategoryModal")
        );
        modal.hide();
    }
    else if (response.status === 409) {
        alert("Category already exists.");
    }
    else {
        alert("Something went wrong.");
    }
}

