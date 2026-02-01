let appConfirmModal;

appConfirmModal = new bootstrap.Modal(
    document.getElementById("appConfirmModal")
);

// CONFIRM
function showConfirm({ title, message, onConfirm }) {
    document.getElementById("appConfirmTitle").innerText = title;
    document.getElementById("appConfirmMessage").innerText = message;

    const okBtn = document.getElementById("appConfirmOkBtn");
    okBtn.onclick = () => {
        appConfirmModal.hide();
        onConfirm();
    };

    appConfirmModal.show();
}

// TOASTS
function notifySuccess(message) {
    showToast("Success", message, "bg-success");
}

function notifyError(message) {
    showToast("Error", message, "bg-danger");
}

function notifyInfo(message) {
    showToast("Info", message, "bg-primary");
}

function showToast(title, message, headerClass) {
    const toastEl = document.getElementById("appToast");

    document.getElementById("appToastTitle").innerText = title;
    document.getElementById("appToastMessage").innerText = message;

    const header = toastEl.querySelector(".toast-header");
    header.className = `toast-header text-white ${headerClass}`;

    new bootstrap.Toast(toastEl).show();
}
