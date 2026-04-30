document.addEventListener("DOMContentLoaded", () => {
    const boxes = document.querySelectorAll(".otp-box");
    const hiddenInput = document.getElementById("code");
    const form = document.getElementById("otpForm");
    const button = document.getElementById("verifyBtn");
    const resendBtn = document.getElementById("resendBtn");
    const errorMessage = document.querySelector(".error-message");
    const timer = document.getElementById("timer");

    let isSubmitting = false;

    // handle error (shake + clear)
    if (errorMessage) {
        boxes.forEach(box => {
            box.value = "";
            box.classList.add("shake");
        });

        setTimeout(() => {
            boxes.forEach(box => box.classList.remove("shake"));
            boxes[0].focus();
        }, 300);
    }

    // input handling
    boxes.forEach((box, index) => {
        box.addEventListener("input", (e) => {
            box.value = box.value.replace(/\D/g, "");

            if (box.value && index < boxes.length - 1) {
                boxes[index + 1].focus();
            }

            updateHidden();
            autoSubmit();
        });

        // backspace navigation
        box.addEventListener("keydown", (e) => {
            if (e.key === "Backspace" && !box.value && index > 0) {
                boxes[index - 1].focus();
            }
        });

        // paste support
        box.addEventListener("paste", (e) => {
            const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);

            paste.split("").forEach((char, i) => {
                if (boxes[i]) boxes[i].value = char;
            });

            updateHidden();
            autoSubmit();
            e.preventDefault();
        });

        boxes.forEach((box, index) => {
            box.addEventListener("focus", () => {
                box.select(); 
            });
        });

        boxes.forEach((box) => {
            box.addEventListener("input", () => {
                if (box.value) {
                    box.classList.add("filled");
                } else {
                    box.classList.remove("filled");
                }
            });
        });
    });

    function updateHidden() {
        hiddenInput.value = Array.from(boxes).map(b => b.value).join("");
    }

    function autoSubmit() {
        if (/^\d{6}$/.test(hiddenInput.value) && !isSubmitting) {
            form.requestSubmit();
        }
    }

    // form validation
    form.addEventListener("submit", (e) => {
        if (isSubmitting) {
            e.preventDefault();
            return;
        }

        if (!/^\d{6}$/.test(hiddenInput.value)) {
            e.preventDefault();
            shakeBoxes();
            return;
        }

        isSubmitting = true;
        button.disabled = true;
        button.innerText = "Verifying...";
    });

    function shakeBoxes() {
        boxes.forEach(box => box.classList.add("shake"));
        setTimeout(() => {
            boxes.forEach(box => box.classList.remove("shake"));
        }, 300);
    }

    // timer
    let timeLeft = 300;
    const interval = setInterval(() => {
        const min = Math.floor(timeLeft / 60);
        const sec = timeLeft % 60;

        timer.innerText = `Expires in ${min}:${sec.toString().padStart(2, '0')}`;
        timeLeft--;

        if (timeLeft < 0) {
            clearInterval(interval);
            timer.innerText = "OTP expired";
        }
    }, 1000);

    // resend cooldown
    let cooldown = 30;
    resendBtn.disabled = true;

    const resendInterval = setInterval(() => {
        cooldown--;
        resendBtn.innerText = `Resend OTP (${cooldown}s)`;

        if (cooldown <= 0) {
            clearInterval(resendInterval);
            resendBtn.disabled = false;
            resendBtn.innerText = "Resend OTP";
        }
    }, 1000);

    // resend click
    resendBtn.addEventListener("click", () => {
        window.location.href = "/Auth/ResendOtp"; //build this next
    });

    // focus first box
    boxes[0].focus();
});