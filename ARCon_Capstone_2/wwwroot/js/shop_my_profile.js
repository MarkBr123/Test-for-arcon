document.addEventListener(
    "DOMContentLoaded",
    () => {

        // Notifications
        async () => {

            await loadNotificationCount();
        }


        /* OPEN PROFILE MODAL */

        document.getElementById(
            "openProfileModal"
        )

            ?.addEventListener(
                "click",

                async (e) => {

                    e.preventDefault();

                    try {

                        const profileResponse =
                            await fetch(
                                "/api/auth/profile"
                            );

                        if (!profileResponse.ok) {

                            throw new Error(
                                "Failed to load profile."
                            );
                        }

                        const profile =
                            await profileResponse.json();

                        /* POPULATE */

                        document.getElementById(
                            "profileFirstName"
                        ).value =
                            profile.first_name ?? "";

                        document.getElementById(
                            "profileMiddleName"
                        ).value =
                            profile.middle_name ?? "";

                        document.getElementById(
                            "profileLastName"
                        ).value =
                            profile.last_name ?? "";

                        document.getElementById(
                            "profileEmail"
                        ).value =
                            profile.email ?? "";

                        document.getElementById(
                            "profileContactNo"
                        ).value =
                            profile.contact_no ?? "";

                        document.getElementById(
                            "profileBirthday"
                        ).value =
                            profile.birthday ?? "";

                        /* LOAD ADDRESSES */

                        const addressResponse =
                            await fetch(
                                "/api/shop/addresses"
                            );

                        const addresses =
                            await addressResponse.json();

                        renderAddresses(
                            addresses
                        );

                        /* OPEN MODAL */

                        const modal =
                            new bootstrap.Modal(

                                document.getElementById(
                                    "profileModal"
                                )
                            );

                        modal.show();
                    }
                    catch (err) {

                        console.error(err);

                        alert(
                            "Failed to load profile."
                        );
                    }
                }
            );
    }
);

/* =========================
   RENDER ADDRESSES
========================= */

function renderAddresses(
    addresses
) {

    const container =
        document.getElementById(
            "addressContainer"
        );

    container.innerHTML = "";

    if (
        !addresses ||
        addresses.length === 0
    ) {
        container.innerHTML = `

            <div class="text-muted">

                No addresses found.

            </div>
        `;

        return;
    }

    addresses.forEach(address => {

        container.innerHTML += `

            <div class="border
                        rounded
                        p-3
                        mb-3">

                <div class="d-flex
                            justify-content-between
                            align-items-start">

                    <div>

                        <div class="fw-semibold
                                    mb-1">

                            ${address.house_unit ?? ""}

                            ${address.street_name ?? ""}

                            ${address.is_default
                ? `
                    <span class="badge bg-primary ms-2">
                        Default
                    </span>
                  `
                : ""
            }

                        </div>

                        <div class="text-muted small">

                            ${address.barangay_name ?? ""},

                            ${address.municipality_name ?? ""},

                            ${address.province_name ?? ""}

                        </div>

                        <div class="text-muted small">

                            ZIP:
                            ${address.zip_code ?? "-"}

                        </div>

                    </div>

                    <div>

                        <button class="btn
                                    btn-sm
                                    btn-outline-danger"

                                onclick="archiveAddress(
                                    ${address.id}
                                )">

                            Archive

                        </button>

                    </div>

                </div>

            </div>
        `;
    });
}

/* =========================
   ARCHIVE ADDRESS
========================= */

async function archiveAddress(
    addressId
) {

    const confirmed =
        confirm(
            "Archive this address?"
        );

    if (!confirmed)
        return;

    try {

        const response =
            await fetch(

                `/api/shop/addresses/${addressId}/archive`,

                {
                    method: "PUT"
                }
            );

        const result =
            await response.json();

        if (!response.ok) {

            throw new Error(
                result.message ||
                "Failed to archive address."
            );
        }

        alert(result.message);

        /* REFRESH */

        document.getElementById(
            "openProfileModal"
        ).click();
    }
    catch (err) {

        console.error(err);

        alert(err.message);
    }
}






/* =========================
   OPEN ADD ADDRESS MODAL
========================= */
document.getElementById(
    "addAddressBtn"
)

    ?.addEventListener(

        "click",

        async () => {

            try {

                /* =========================
                   ELEMENTS
                ========================= */

                const region =
                    document.getElementById(
                        "addRegion"
                    );

                const province =
                    document.getElementById(
                        "addProvince"
                    );

                const municipality =
                    document.getElementById(
                        "addMunicipality"
                    );

                const barangay =
                    document.getElementById(
                        "addBarangay"
                    );

                const house_unit =
                    document.getElementById(
                        "addHouseUnit"
                    );

                const street_name =
                    document.getElementById(
                        "addStreetName"
                    );

                const zip_code =
                    document.getElementById(
                        "addZipCode"
                    );

                const landmark =
                    document.getElementById(
                        "addLandmark"
                    );

                /* =========================
                   RESET FORM
                ========================= */

                house_unit.value = "";
                street_name.value = "";
                zip_code.value = "";
                landmark.value = "";

                /* =========================
                   RESET DROPDOWNS
                ========================= */

                region.innerHTML =
                    `<option value="">
                    -- Select Region --
                </option>`;

                province.innerHTML =
                    `<option value="">
                    -- Select Province --
                </option>`;

                municipality.innerHTML =
                    `<option value="">
                    -- Select Municipality --
                </option>`;

                barangay.innerHTML =
                    `<option value="">
                    -- Select Barangay --
                </option>`;

                province.disabled = true;
                municipality.disabled = true;
                barangay.disabled = true;

                /* =========================
                   LOAD REGIONS
                ========================= */

                const response =
                    await fetch(
                        "/api/regions"
                    );

                if (!response.ok) {

                    throw new Error(
                        "Failed to load regions."
                    );
                }

                const regions =
                    await response.json();

                regions.forEach(r => {

                    const opt =
                        document.createElement(
                            "option"
                        );

                    opt.value = r.id;

                    opt.textContent =
                        r.region_name;

                    region.appendChild(opt);
                });

                /* =========================
                   REGION → PROVINCE
                ========================= */

                region.onchange =
                    async () => {

                        province.innerHTML =
                            `<option value="">
                            -- Select Province --
                        </option>`;

                        municipality.innerHTML =
                            `<option value="">
                            -- Select Municipality --
                        </option>`;

                        barangay.innerHTML =
                            `<option value="">
                            -- Select Barangay --
                        </option>`;

                        province.disabled = true;
                        municipality.disabled = true;
                        barangay.disabled = true;

                        if (!region.value)
                            return;

                        try {

                            const res =
                                await fetch(

                                    `/api/provinces/regionID/${region.value}`
                                );

                            const data =
                                await res.json();

                            data.forEach(p => {

                                const opt =
                                    document.createElement(
                                        "option"
                                    );

                                opt.value =
                                    p.id;

                                opt.textContent =
                                    p.province_name;

                                province.appendChild(
                                    opt
                                );
                            });

                            province.disabled =
                                false;
                        }
                        catch {

                            alert(
                                "Unable to load provinces."
                            );
                        }
                    };

                /* =========================
                   PROVINCE → MUNICIPALITY
                ========================= */

                province.onchange =
                    async () => {

                        municipality.innerHTML =
                            `<option value="">
                            -- Select Municipality --
                        </option>`;

                        barangay.innerHTML =
                            `<option value="">
                            -- Select Barangay --
                        </option>`;

                        municipality.disabled =
                            true;

                        barangay.disabled =
                            true;

                        if (!province.value)
                            return;

                        try {

                            const res =
                                await fetch(

                                    `/api/municipality/provinceID/${province.value}`
                                );

                            const data =
                                await res.json();

                            data.forEach(m => {

                                const opt =
                                    document.createElement(
                                        "option"
                                    );

                                opt.value =
                                    m.id;

                                opt.textContent =
                                    m.municipality_name;

                                municipality.appendChild(
                                    opt
                                );
                            });

                            municipality.disabled =
                                false;
                        }
                        catch {

                            alert(
                                "Unable to load municipalities."
                            );
                        }
                    };

                /* =========================
                   MUNICIPALITY → BARANGAY
                ========================= */

                municipality.onchange =
                    async () => {

                        barangay.innerHTML =
                            `<option value="">
                            -- Select Barangay --
                        </option>`;

                        barangay.disabled =
                            true;

                        if (!municipality.value)
                            return;

                        try {

                            const res =
                                await fetch(

                                    `/api/barangay/municipalityID/${municipality.value}`
                                );

                            const data =
                                await res.json();

                            data.forEach(b => {

                                const opt =
                                    document.createElement(
                                        "option"
                                    );

                                opt.value =
                                    b.id;

                                opt.textContent =
                                    b.barangay_name;

                                barangay.appendChild(
                                    opt
                                );
                            });

                            barangay.disabled =
                                false;
                        }
                        catch {

                            alert(
                                "Unable to load barangays."
                            );
                        }
                    };

                /* =========================
                   OPEN MODAL
                ========================= */

                const modalElement =
                    document.getElementById(
                        "addAddressModal"
                    );

                const modal =
                    bootstrap.Modal
                        .getOrCreateInstance(
                            modalElement
                        );

                modal.show();
            }
            catch (err) {

                console.error(err);

                alert(
                    err.message
                );
            }
        }
);



/* =========================
   SAVE ADDRESS
========================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const saveAddressBtn =
            document.getElementById(
                "saveAddressBtn"
            );

        if (!saveAddressBtn) {

            console.error(
                "saveAddressBtn not found"
            );

            return;
        }

        saveAddressBtn.addEventListener(

            "click",

            async () => {

                try {

                    /* =========================
                       PAYLOAD
                    ========================= */

                    const payload = {

                        regionId:

                            parseInt(

                                document.getElementById(
                                    "addRegion"
                                ).value
                            ),

                        provinceId:

                            parseInt(

                                document.getElementById(
                                    "addProvince"
                                ).value
                            ),

                        municipalityId:

                            parseInt(

                                document.getElementById(
                                    "addMunicipality"
                                ).value
                            ),

                        barangayId:

                            parseInt(

                                document.getElementById(
                                    "addBarangay"
                                ).value
                            ),

                        houseUnit:

                            document.getElementById(
                                "addHouseUnit"
                            ).value,

                        streetName:

                            document.getElementById(
                                "addStreetName"
                            ).value,

                        zipCode:

                            document.getElementById(
                                "addZipCode"
                            ).value,

                        landmark:

                            document.getElementById(
                                "addLandmark"
                            ).value,

                        isDefault: false
                    };

                    console.log(
                        "PAYLOAD:",
                        payload
                    );

                    /* =========================
                       API CALL
                    ========================= */

                    const response =
                        await fetch(
                            "/api/shop/",
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body: JSON.stringify(
                                    payload
                                )
                            }
                        );

                    const result =
                        await response.json();

                    console.log(result);

                    if (!response.ok) {

                        throw new Error(

                            result.message ||

                            "Failed to save address."
                        );
                    }

                    alert(
                        result.message
                    );

                    /* CLOSE MODAL */

                    const modalElement =
                        document.getElementById(
                            "addAddressModal"
                        );

                    const modal =
                        bootstrap.Modal
                            .getOrCreateInstance(
                                modalElement
                            );

                    modal.hide();

                }
                catch (err) {

                    console.error(err);

                    alert(err.message);
                }
            }
        );
    }
);






/* =========================
   CHANGE PASSWORD
========================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const changePasswordBtn =
            document.getElementById(
                "changePasswordBtn"
            );

        if (!changePasswordBtn)
            return;

        changePasswordBtn.addEventListener(

            "click",

            async function () {

                try {

                    /* =========================
                       LOADING STATE
                    ========================= */

                    changePasswordBtn.disabled =
                        true;

                    const originalText =
                        changePasswordBtn.innerHTML;

                    changePasswordBtn.innerHTML =
                        "Updating...";

                    /* =========================
                       PAYLOAD
                    ========================= */

                    const payload = {

                        current_password:

                            document.getElementById(
                                "currentPassword"
                            )

                                .value

                                .trim(),

                        new_password:

                            document.getElementById(
                                "newPassword"
                            )

                                .value

                                .trim(),

                        confirm_password:

                            document.getElementById(
                                "confirmPassword"
                            )

                                .value

                                .trim()
                    };

                    /* =========================
                       API CALL
                    ========================= */

                    const response =
                        await fetch(
                            "/api/auth/change-password",
                            {
                                method: "PUT",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body: JSON.stringify(
                                    payload
                                )
                            }
                        );

                    const result =
                        await response.json();

                    /* =========================
                       ERROR
                    ========================= */

                    if (!response.ok) {

                        let errorMessage =

                            result.message ||

                            "Failed to change password.";

                        /* VALIDATION ERRORS */

                        if (result.errors) {

                            errorMessage =

                                result.errors

                                    .flatMap(
                                        x => x.errors
                                    )

                                    .join("\n");
                        }

                        throw new Error(
                            errorMessage
                        );
                    }

                    /* =========================
                       SUCCESS
                    ========================= */

                    alert(
                        result.message
                    );

                    /* =========================
                       CLEAR FIELDS
                    ========================= */

                    document.getElementById(
                        "currentPassword"
                    ).value = "";

                    document.getElementById(
                        "newPassword"
                    ).value = "";

                    document.getElementById(
                        "confirmPassword"
                    ).value = "";

                    /* =========================
                       RESET BUTTON
                    ========================= */

                    changePasswordBtn.innerHTML =
                        originalText;

                    changePasswordBtn.disabled =
                        false;
                }
                catch (err) {

                    console.error(err);

                    alert(err.message);

                    changePasswordBtn.innerHTML =
                        "Change Password";

                    changePasswordBtn.disabled =
                        false;
                }
            }
        );
    }
);


/* =========================
   SAVE PROFILE
========================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const saveProfileBtn =
            document.getElementById(
                "saveProfileBtn"
            );

        if (!saveProfileBtn)
            return;

        saveProfileBtn.addEventListener(

            "click",

            async function () {

                try {

                    /* LOADING */

                    saveProfileBtn.disabled =
                        true;

                    const originalText =
                        saveProfileBtn.innerHTML;

                    saveProfileBtn.innerHTML =
                        "Saving...";

                    /* PAYLOAD */

                    const payload = {

                        email:

                            document.getElementById(
                                "profileEmail"
                            )

                                .value

                                .trim(),

                        contact_no:

                            document.getElementById(
                                "profileContactNo"
                            )

                                .value

                                .trim()
                    };

                    /* API */

                    const response =
                        await fetch(
                            "/api/auth/profile/contact",
                            {
                                method: "PUT",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body: JSON.stringify(
                                    payload
                                )
                            }
                        );

                    const result =
                        await response.json();

                    if (!response.ok) {

                        let errorMessage =

                            result.message ||

                            "Failed to update profile.";

                        if (result.errors) {

                            errorMessage =

                                result.errors

                                    .flatMap(
                                        x => x.errors
                                    )

                                    .join("\n");
                        }

                        throw new Error(
                            errorMessage
                        );
                    }

                    alert(
                        result.message
                    );

                    /* RESET */

                    saveProfileBtn.innerHTML =
                        originalText;

                    saveProfileBtn.disabled =
                        false;
                }
                catch (err) {

                    console.error(err);

                    alert(err.message);

                    saveProfileBtn.innerHTML =
                        "Save Profile";

                    saveProfileBtn.disabled =
                        false;
                }
            }
        );
    }
);


/* =========================
   PASSWORD TOGGLE
========================= */

document.querySelectorAll(
    ".password-toggle"
)

    .forEach(button => {

        button.addEventListener(
            "click",

            () => {

                const targetId =

                    button.dataset.target;

                const input =

                    document.getElementById(
                        targetId
                    );

                if (!input)
                    return;

                if (
                    input.type ===
                    "password"
                ) {
                    input.type = "text";

                    button.innerHTML =
                        "🙈";
                }
                else {

                    input.type =
                        "password";

                    button.innerHTML =
                        "";
                }
            }
        );
    });


/* =========================
FORCE CLEAN MODAL BACKDROP
========================= */

document.addEventListener(

    "hidden.bs.modal",

    () => {

        document.body.classList.remove(
            "modal-open"
        );

        document.body.style = "";

        document
            .querySelectorAll(
                ".modal-backdrop"
            )

            .forEach(b => b.remove());
    }
);


//////////////// CUSTOMER NOTIFICATIONS  ////////////////

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        await loadNotificationCount();

        document
            .getElementById(
                "notificationButton"
            )
            ?.addEventListener(
                "click",
                loadNotifications
            );
    }
);



// =====================================
// NOTIFICATION COUNT
// =====================================

async function loadNotificationCount() {

    try {

        const response =
            await fetch(
                "/api/customer-notifications/unread-count"
            );

        const data =
            await response.json();

        console.log(
            "Notification Count:",
            data.count
        );

        const badge =
            document.getElementById(
                "notificationCount"
            );

        if (!badge)
            return;



        if (data.count > 0) {

            badge.innerText =
                data.count;

            badge.style.display =
                "inline-block";
        }
        else {

            badge.style.display =
                "none";
        }
    }
    catch (err) {

        console.error(
            "Failed to load notification count:",
            err
        );
    }
}



// =====================================
// LOAD NOTIFICATIONS
// =====================================

async function loadNotifications() {

    try {

        const response =
            await fetch(
                "/api/customer-notifications/my-notifications"
            );

        const notifications =
            await response.json();

        const body =
            document.querySelector(
                "#notificationModal .modal-body"
            );

        if (!body)
            return;



        if (
            notifications.length === 0
        ) {

            body.innerHTML = `
                <div class="notification-empty">

                    <i class="bi bi-bell-slash"></i>

                    <div>
                        No notifications yet
                    </div>

                </div>
            `;

            return;
        }



        body.innerHTML = "";



        notifications.forEach(n => {

            body.innerHTML += `

                <div class="
                        notification-item
                        ${!n.is_read ? "unread" : ""}
                    "
                    onclick="
                        openNotification(
                            ${n.id}
                        )
                    ">

                    <div class="notification-icon">

                        <i class="bi bi-bell-fill"></i>

                    </div>

                    <div class="notification-details">

                        <div class="notification-title">

                            ${n.title}

                        </div>

                        <div class="notification-message">

                            ${n.message}

                        </div>

                        <div class="notification-time">

                            ${new Date(
                n.created_at
            ).toLocaleString()}

                        </div>

                    </div>

                </div>

            `;
        });
    }
    catch (err) {

        console.error(
            "Failed to load notifications:",
            err
        );
    }
}

async function openNotification(
    notificationId
) {

    try {

        await fetch(
            `/api/customer-notifications/${notificationId}/mark-read`,
            {
                method: "PUT"
            }
        );

        window.location.href =
            "/Shop/Orders/MyPurchases";
    }
    catch (err) {

        console.error(
            err
        );
    }
}