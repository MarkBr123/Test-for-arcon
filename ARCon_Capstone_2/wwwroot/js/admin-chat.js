
//  GLOBAL STATE


let currentTab = "INTERNAL";
let currentSearch = "";
let currentConversationId = null;
let refreshInterval = null;
let activeUserId = null;
let currentUserRole = ""; // this will check what is the user type


//check user type
async function loadCurrentUser() {
    try {
        const res = await fetch("/api/convo-admin/me");
        const data = await res.json();

        currentUserRole = data.role?.toUpperCase();
    } catch (err) {
        console.error("Failed to load current user", err);
    }
}


//INIT


document.addEventListener("DOMContentLoaded", async () => {
    setupSearch();
    setupSendOnEnter();
    loadInternalUsers();
    startAutoRefresh();

    await loadCurrentUser();
});


// TAB SWITCHING


function switchTab(type) {
    const internalTab = document.getElementById("tab-internal");
    const externalTab = document.getElementById("tab-external");
    const title = document.getElementById("chatTitle");

    //  block technician from external tab
    if (type === "EXTERNAL" && currentUserRole === "AIRCON_TECHNICIAN") {
        alert("You are not allowed to access customer chats.");
        return;
    }

    // reset tab styles
    internalTab.classList.remove("active");
    externalTab.classList.remove("active");

    currentTab = type;

    //  CLEAR CHAT STATE (IMPORTANT)
    activeUserId = null;
    currentConversationId = null;
    window.lastMessages = null;

    // stop auto refresh
    if (window.chatInterval) {
        clearInterval(window.chatInterval);
    }

    //  clear UI
    const chatMessages = document.getElementById("chatMessages");
    if (chatMessages) chatMessages.innerHTML = "";

    const chatHeader = document.getElementById("chatHeader");
    if (chatHeader) chatHeader.innerHTML = "Select a user";

    // ================= TABS =================
    if (type === "INTERNAL") {
        internalTab.classList.add("active");

        if (title) title.innerText = "Airconi Team";

        loadInternalUsers();
    } else {
        externalTab.classList.add("active");

        if (title) title.innerText = "Customer Chat";

        loadExternalUsers();
    }
}


//  USER LOADING


async function loadInternalUsers() {
    try {
        const res = await fetch(`/api/convo-admin/internal-users`);
        const data = await res.json();
        renderUsers(data);
    }
    catch (err) {
        console.error(err);

    }
}

async function loadExternalUsers() {
    try {
        const res = await fetch(`/api/convo-admin/external-users`);
        const data = await res.json();
        renderUsers(data);
    }
    catch (err) {
        console.error(err);
    }
}

async function fetchUsers(baseUrl) {
    try {
        let url = baseUrl;

        if (currentSearch) {
            url += `?search=${encodeURIComponent(currentSearch)}`;
        }

        const res = await fetch(url);

        if (!res.ok) {
            renderUsers([]);
            return;
        }

        const users = await res.json();
        renderUsers(users);

    } catch (err) {
        console.error("Error loading users:", err);
    }
}


// RENDER USERS

function renderUsers(users) {
    const container = document.getElementById("userList");
    container.innerHTML = "";

    if (!users?.length) {
        container.innerHTML = `<div style="padding:10px; color:#999;">No users found</div>`;
        return;
    }

    const isExternal = currentTab === "EXTERNAL";
    const canTake = ["ADMIN", "CSM", "SUPER_ADMIN"].includes(currentUserRole);

    users.forEach(user => {
        const userDiv = document.createElement("div");
        userDiv.className = "mm-user";

        const isDisabled = isExternal && !canTake;

        userDiv.innerHTML = `
            <div class="mm-avatar"></div>

            <div style="flex:1;">
                <strong>${user.name || "No Name"}</strong><br/>

                <small>
                    <span class="mm-role ${getRoleClass(user.role)}">
                        ${user.role ?? ""}
                    </span>
                    <span class="${user.isOnline ? 'mm-online' : 'mm-offline'}">
                        • ${user.isOnline ? "Online" : "Offline"}
                    </span>
                </small>

                ${(Number(user.unreadCount) || 0) > 0 ? `
                    <div class="mm-unread-text">
                        (${user.unreadCount} unread message${user.unreadCount > 1 ? "s" : ""})
                    </div>
                ` : ""}
            </div>

            <!-- 🔥 RIGHT ACTION -->
            ${isExternal
                ? (canTake
                    ? `<button class="mm-take-btn">Take</button>`
                    : `<span class="mm-disabled-text">Not allowed</span>`
                )
                : `<div class="mm-summary-icon" title="View Summary">⋯</div>`
            }
        `;

        // TAKE CHAT (external only)
        const takeBtn = userDiv.querySelector(".mm-take-btn");
        if (takeBtn) {
            takeBtn.addEventListener("click", (e) => {
                e.stopPropagation(); // prevent row click
                takeChat(user.userId);
            });
        }

        // SUMMARY (internal only)
        const summaryBtn = userDiv.querySelector(".mm-summary-icon");
        if (summaryBtn) {
            summaryBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                openUserSummary(user.userId);
            });
        }

        // CHAT CLICK
        userDiv.addEventListener("click", () => {
            if (isDisabled) return; // ❌ block technicians in external

            handleUserClick(user, userDiv);
        });

        // ACTIVE STATE
        if (user.userId === activeUserId) {
            userDiv.classList.add("active");
        }

        container.appendChild(userDiv);
    });
}

//Role Colors
function getRoleClass(role) {
    if (!role) return "";

    const r = role.toUpperCase();

    if (r.includes("ADMIN")) return "mm-role-admin";
    if (r.includes("CSM")) return "mm-role-csm";
    if (r.includes("TECHNICIAN")) return "mm-role-tech";

    return "mm-role-default";
}


// HANDLE USER CLICK


async function handleUserClick(user, userDiv) {
    const isSameUser = user.userId === activeUserId;

    // highlight
    document.querySelectorAll(".mm-user").forEach(u => u.classList.remove("active"));
    userDiv.classList.add("active");

    activeUserId = user.userId;

    updateChatHeader(user);

    const isExternal = currentTab === "EXTERNAL";

    // get / create conversation
    const data = await openConversation(user.userId, isExternal);
    if (!data) return;

    const isSameConversation = currentConversationId === data.conversationId;
    currentConversationId = data.conversationId;

    // mark as read (safe)
    try {
        await fetch('/api/convo-admin/mark-read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentConversationId)
        });
    } catch (err) {
        console.error("Mark read error:", err);
    }

    // force refresh if same user or same convo
    if (isSameUser || isSameConversation) {
        window.lastMessages = null;
    }

    //  load messages
    await loadMessages();

    //  prevent multiple intervals (IMPORTANT)
    if (window.chatInterval) {
        clearInterval(window.chatInterval);
    }

    startAutoRefresh();
}



//  SEARCH (DEBOUNCED)


function setupSearch() {
    const input = document.getElementById("chatSearch");
    if (!input) return;

    input.addEventListener("input", debounce(e => {
        currentSearch = e.target.value.trim();

        currentTab === "INTERNAL"
            ? loadInternalUsers()
            : loadExternalUsers();
    }, 300));
}

function debounce(fn, delay = 300) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
    };
}


// 🔥 CONVERSATION

async function openConversation(targetUserId, isExternal) {
    try {
        const res = await fetch('/api/convo-admin/get-or-create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                targetUserId,
                isExternal
            })
        });

        //  better handling (no need for manual text parsing)
        if (!res.ok) {
            const errorText = await res.text();
            console.error("STATUS:", res.status);
            console.error("ERROR:", errorText);
            return null;
        }

        const data = await res.json();

        //  safety check
        if (!data || !data.conversationId) {
            console.error("Invalid response:", data);
            return null;
        }

        return data;

    } catch (err) {
        console.error("Error opening conversation:", err);
        return null;
    }
}


// MESSAGES


async function loadMessages(conversationId) {
    try {
        const res = await fetch(`/api/convo-admin/${conversationId}/messages?t=${Date.now()}`);

        if (!res.ok) return;

        const messages = await res.json();
        renderMessages(messages);

    } catch (err) {
        console.error("Error loading messages:", err);
    }
}



const isVideoPlaying = document.querySelector("video:not([paused])");


function renderMessages(messages) {
    const container = document.getElementById("chatMessages");

    if (!container) return;

    //  STOP REFRESH IF VIDEO IS PLAYING
    const videos = container.querySelectorAll("video"); //  scope to container
    for (let v of videos) {
        if (!v.paused && !v.ended) {
            return;
        }
    }

    // STOP IF SAME DATA (NO CHANGE)
    const newData = JSON.stringify(messages);
    if (window.lastMessages === newData) return;
    window.lastMessages = newData;

    // Smart scroll check
    const isNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight < 50;

    container.innerHTML = "";

    messages.forEach(msg => {
        // SAFE fallback (in case isMine missing)
        const isMe = msg.isMine ?? (
            Number(msg.sender_id) === Number(window.currentUserId) &&
            msg.sender_type === window.currentUserRole
        );

        const row = document.createElement("div");
        row.className = `mm-row ${isMe ? "sent" : "received"}`;

        const bubble = document.createElement("div");
        bubble.className = `mm-message ${isMe ? "mm-sent" : "mm-received"}`;

        let content = "";

        // HANDLE MEDIA
        if (msg.media && msg.media.length > 0) {
            const file = msg.media[0];

            if (msg.message_type === "IMAGE") {
                content += `
                    <img src="${file.file_url}" 
                         onclick="openMediaModal('IMAGE', '${file.file_url}')"
                         style="max-width:220px; border-radius:12px; margin-bottom:5px; cursor:pointer;" />
                `;
            }
            else if (msg.message_type === "VIDEO") {
                content += `
                    <video controls 
                           onclick="event.stopPropagation(); openMediaModal('VIDEO', '${file.file_url}')"
                           style="max-width:250px; border-radius:12px; margin-bottom:5px; cursor:pointer;">
                        <source src="${file.file_url}" type="video/mp4">
                        Your browser does not support video.
                    </video>
                `;
            }
            else {
                content += `
                    <a href="${file.file_url}" target="_blank"
                       style="color:#0d6efd; text-decoration:none; font-weight:500;">
                        📄 ${file.file_name || "Open file"}
                    </a>
                `;
            }
        }

        //  TEXT
        if (msg.message && msg.message_type === "TEXT") {
            content += `<div>${msg.message}</div>`;
        }

        //  FINAL BUBBLE
        bubble.innerHTML = `
            ${content}
            <div class="mm-time">${formatTime(msg.created_at)}</div>
        `;

        row.appendChild(bubble);
        container.appendChild(row);
    });

    //  Smart scroll
    if (isNearBottom) {
        container.scrollTop = container.scrollHeight;
    }
} 

function formatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();

    const isToday =
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

    const time = date.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });

    const fullDate = date.toLocaleDateString([], {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric'
    });

    if (isToday) {
        return `Today, ${fullDate} ${time}`;
    }

    return `${fullDate} ${time}`;
}

function appendMessage(msg) {
    const container = document.getElementById("chatMessages");

    const isMe = msg.sender_id == window.currentUserId;

    const row = document.createElement("div");
    row.className = `mm-row ${isMe ? "sent" : "received"}`;

    const bubble = document.createElement("div");
    bubble.className = `mm-message ${isMe ? "mm-sent" : "mm-received"}`;
    bubble.textContent = msg.message;

    row.appendChild(bubble);
    container.appendChild(row);

    container.scrollTop = container.scrollHeight;
}


// CHAT HEADER


function updateChatHeader(user) {
    const header = document.getElementById("chatHeader");

    header.innerHTML = `
        <strong>${user.name || "Unknown"}</strong>
        <span style="color:#6b7280;">
            ${user.role ? `(${user.role})` : ""}
        </span>
    `;
}


// SEND MESSAGE


async function sendMessage() {
    const input = document.getElementById("chatInput");
    if (!input) return;

    const text = input.value.trim();
    if (!text || !currentConversationId) return;

    try {
        const res = await fetch('/api/convo-admin/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                conversationId: currentConversationId,
                message: text
            })
        });

        const data = await res.json();
        if (!res.ok) return console.error("Send failed:", data);

        appendMessage({
            message: data.message,
            sender_id: window.currentUserId
        });

        input.value = "";

    } catch (err) {
        console.error("Error sending message:", err);
    }
}


//  ENTER TO SEND


function setupSendOnEnter() {
    const input = document.getElementById("chatInput");

    if (!input) return;

    input.addEventListener("keypress", e => {
        if (e.key === "Enter") sendMessage();
    });
}


// AUTO REFRESH


function startAutoRefresh() {
    if (refreshInterval) clearInterval(refreshInterval);

    refreshInterval = setInterval(() => {

        // refresh messages
        if (currentConversationId) {
            loadMessages(currentConversationId);
        }

        //  refresh sidebar (unread)
        if (currentTab === "INTERNAL") {
            loadInternalUsers();
        } else {
            loadExternalUsers();
        }

    }, 2000);
}

window.addEventListener("beforeunload", () => {
    if (refreshInterval) clearInterval(refreshInterval);
});


//// File Upload part ///
const attachBtn = document.querySelector(".mm-attach");
const fileInput = document.getElementById("fileInput");

attachBtn.addEventListener("click", () => {
    fileInput.click();
});

//Handle File select
fileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = [
        "image/png",
        "image/jpeg",
        "application/pdf",
        "video/mp4"
    ];

    if (!allowedTypes.includes(file.type)) {
        alert("Only PNG, JPEG, PDF, MP4 allowed.");
        return;
    }

    if (file.size > 15 * 1024 * 1024) {
        alert("File must be under 15MB.");
        return;
    }

    await uploadFile(file);

    fileInput.value = "";
});

function uploadFile(file) {
    return new Promise((resolve, reject) => {

        const formData = new FormData();
        formData.append("conversationId", currentConversationId);
        formData.append("file", file);

        const xhr = new XMLHttpRequest();

        const status = document.getElementById("uploadStatus");
        const bar = document.getElementById("uploadProgressBar");
        const progress = document.getElementById("uploadProgress");

        // SHOW PROGRESS BAR
        bar.style.display = "block";
        progress.style.width = "0%";
        status.innerText = "Uploading...";

        xhr.open("POST", "/api/convo-admin/upload", true);

        // PROGRESS EVENT
        xhr.upload.onprogress = function (e) {
            if (e.lengthComputable) {
                const percent = Math.round((e.loaded / e.total) * 100);
                progress.style.width = percent + "%";
                status.innerText = `Uploading... ${percent}%`;
            }
        };

        // SUCCESS
        xhr.onload = function () {
            bar.style.display = "none";

            if (xhr.status === 200) {
                status.innerText = "✅ Upload successful";
                setTimeout(() => status.innerText = "", 2000);

                resolve(JSON.parse(xhr.responseText));

                // refresh chat
                loadMessages(currentConversationId);
            } else {
                status.innerText = "❌ Upload failed";
                reject(xhr.responseText);
            }
        };

        //  ERROR
        xhr.onerror = function () {
            bar.style.display = "none";
            status.innerText = "❌ Upload error";
            reject("Upload failed");
        };

        xhr.send(formData);
    });
}

/// Media Modal //
function openMediaModal(type, url) {
    const modal = document.getElementById("mediaModal");
    const img = document.getElementById("modalImage");
    const video = document.getElementById("modalVideo");

    modal.style.display = "flex";

    if (type === "IMAGE") {
        img.src = url;
        img.style.display = "block";
        video.style.display = "none";
    }
    else if (type === "VIDEO") {
        video.src = url;
        video.style.display = "block";
        img.style.display = "none";
    }
}

function closeMediaModal() {
    const modal = document.getElementById("mediaModal");
    const img = document.getElementById("modalImage");
    const video = document.getElementById("modalVideo");

    modal.style.display = "none";

    img.src = "";
    video.src = "";
}

/// USER Summary 
async function openUserSummary(userId) {
    try {
        const res = await fetch(`/api/adminusers/${userId}/summary`);
        if (!res.ok) throw new Error("Failed to fetch");

        const data = await res.json();

        showSummaryModal(data);

    } catch (err) {
        console.error(err);
        alert("Failed to load user summary");
    }
}

function showSummaryModal(user) {
    const container = document.getElementById("summaryContent");

    container.innerHTML = `
        <div class="mm-summary-layout">

            <!-- LEFT SIDE -->
            <div class="mm-left">

                <!-- BASIC INFO -->
                <div class="mm-summary-card">
                    <h4>👤 Basic Info</h4>

                    <div class="mm-grid">
                        <div>
                            <label>Name</label>
                            <div>${user.first_name} ${user.last_name}</div>
                        </div>

                        <div>
                            <label>Status</label>
                            <div>
                                <span class="mm-badge ${user.status === 'ACTIVE' ? 'mm-green' : 'mm-gray'}">
                                    ${user.status}
                                </span>
                            </div>
                        </div>

                        <div>
                            <label>Email</label>
                            <div>${user.email_address}</div>
                        </div>

                        <div>
                            <label>Contact</label>
                            <div>${user.contact_no}</div>
                        </div>

                        <div>
                            <label>Birthday</label>
                            <div>${user.birthday ?? "-"}</div>
                        </div>

                        <div>
                            <label>Last Login</label>
                            <div>${user.last_login ?? "-"}</div>
                        </div>

                        <div>
                            <label>Created</label>
                            <div>${user.created_at}</div>
                        </div>
                    </div>
                </div>

                <!-- ROLES -->
                <div class="mm-summary-card">
                    <h4>🛡 Roles</h4>
                    <div class="mm-badge-group">
                        ${user.roles.map(r => `<span class="mm-badge mm-blue">${r}</span>`).join("")}
                    </div>
                </div>

            </div>

            <!-- RIGHT SIDE -->
            <div class="mm-right">

                <div class="mm-summary-card">
                    <h4>📅 Work Schedule</h4>

                    <div class="mm-schedule">
                        ${user.schedule.map(s => `
                            <div class="mm-schedule-row">
                                <div class="mm-day">${s.day_of_week}</div>

                                <div class="mm-time">
                                    ${s.is_restday
            ? `<span class="mm-badge mm-gray">Rest Day</span>`
            : `${s.login_time} - ${s.logout_time}`
        }
                                </div>
                            </div>
                        `).join("")}
                    </div>

                </div>

            </div>

        </div>
    `;

    document.getElementById("summaryModal").style.display = "flex";
}
function closeSummaryModal() {
    document.getElementById("summaryModal").style.display = "none";
}

window.addEventListener("click", function (e) {
    const modal = document.getElementById("summaryModal");

    if (e.target === modal) {
        closeSummaryModal();
    }
});