
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

