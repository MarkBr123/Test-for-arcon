// ================= STATE =================
let conversationId = null;
let lastMessages = "";

// ================= ELEMENTS =================
const chatBtn = document.getElementById("chatFloatingBtn");
const chatSidebar = document.getElementById("chatSidebar");
const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const chatSendBtn = document.querySelector(".chat-footer button");

// ================= AUTH =================
function isLoggedIn() {
    return window.chatUserId && window.chatUserType === "CUSTOMER";
}

// ================= OPEN / CLOSE =================
// ================= OPEN CHAT MODAL =================
async function openChatSidebar() {
    chatSidebar.style.display = "flex";

    handleAuthState();

    if (isLoggedIn()) {
        await initConversation();
        await loadMessages();
        startAutoRefresh();

        if (conversationId) {
            await markAsRead(conversationId);
        }
    }
}

chatBtn.addEventListener("click", async () => {
    const isOpen = chatSidebar.style.display === "flex";

    if (isOpen) {
        closeChatSidebar();
    } else {
        await openChatSidebar();
    }
});

function closeChatSidebar() {
    chatSidebar.style.display = "none";
}

// ================= AUTH STATE =================
function handleAuthState() {
    if (!isLoggedIn()) {
        chatInput.disabled = true;
        chatSendBtn.disabled = true;

        addSystemMessage(
            "Please log in to chat with support 😊"
        );
    } else {
        chatInput.disabled = false;
        chatSendBtn.disabled = false;
    }
}

// ================= INIT CONVERSATION =================
async function initConversation() {
    try {
        const res = await fetch('/api/convo-admin/get-or-create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                targetUserId: window.chatUserId,
                isExternal: true
            })
        });

        const data = await res.json();
        conversationId = data.conversationId;
    } catch (err) {
        console.error("Init conversation error:", err);
    }
}

// ================= LOAD MESSAGES =================
async function loadMessages() {
    if (!conversationId) return;

    try {
        const res = await fetch(`/api/convo-admin/${conversationId}/messages`);
        const messages = await res.json();

        //  prevent unnecessary re-render
        const newData = JSON.stringify(messages);
        if (lastMessages === newData) return;
        lastMessages = newData;

        const isNearBottom =
            chatMessages.scrollHeight - chatMessages.scrollTop - chatMessages.clientHeight < 50;

        chatMessages.innerHTML = "";

        messages.forEach(msg => {
            const type = msg.isMine ? "sent" : "received";
            addMessage(msg, type); //  pass full object
        });

        // 🔥 only scroll if user is near bottom
        if (isNearBottom) {
            scrollToBottom();
        }
    } catch (err) {
        console.error("Load messages error:", err);
    }
}

// ================= SEND MESSAGE =================
async function sendCustomerMessage() {
    if (!isLoggedIn()) {
        addSystemMessage("Please log in to continue 😊");
        return;
    }

    const message = chatInput.value.trim();
    if (!message || !conversationId) return;

    try {
        // send to API
        await fetch('/api/convo-admin/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                conversationId: conversationId,
                message: message
            })
        });

        chatInput.value = "";

        // reload messages
        await loadMessages();
    } catch (err) {
        console.error("Send message error:", err);
    }
}

function addMessage(text, type, timeRaw = null) {
    const row = document.createElement("div");
    row.className = `chat-row ${type}`;

    const bubble = document.createElement("div");
    bubble.className = "chat-bubble";

    const time = document.createElement("div");
    time.className = "chat-time";
    time.innerText = timeRaw ? formatTime(timeRaw) : getCurrentTime();

    bubble.innerText = text;
    bubble.appendChild(time);

    row.appendChild(bubble);
    chatMessages.appendChild(row);
}

// ================= UI HELPERS =================

function addMessage(msg, type) {
    const row = document.createElement("div");
    row.className = `chat-row ${type}`;

    const bubble = document.createElement("div");
    bubble.className = "chat-bubble";

    let content = "";

    //  HANDLE MEDIA
    if (msg.media && msg.media.length > 0) {
        const file = msg.media[0];

        // IMAGE
        if (msg.message_type === "IMAGE") {
            content += `
                <img src="${file.file_url}"
                     style="max-width:200px; border-radius:10px; margin-bottom:5px;" />
            `;
        }

        //  VIDEO
        else if (msg.message_type === "VIDEO") {
            content += `
                <video controls
                       style="max-width:220px; border-radius:10px; margin-bottom:5px;">
                    <source src="${file.file_url}" type="video/mp4">
                </video>
            `;
        }

        //  FILE
        else {
            content += `
                <a href="${file.file_url}" target="_blank">
                    📄 ${file.file_name || "Open file"}
                </a>
            `;
        }
    }

    //  TEXT
    if (msg.message && msg.message_type === "TEXT") {
        content += `<div>${msg.message}</div>`;
    }

    //  TIME
    content += `<div class="chat-time">${formatTime(msg.created_at)}</div>`;

    bubble.innerHTML = content;

    row.appendChild(bubble);
    chatMessages.appendChild(row);
}
// ================= UTIL =================
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

chatInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault(); // stop newline
        sendCustomerMessage();
    }
});

function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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

/// make chats auto refresh
let chatInterval = null;

function startAutoRefresh() {
    if (chatInterval) return; // prevent duplicate intervals

    chatInterval = setInterval(() => {
        if (conversationId) {
            loadMessages();
        }
    }, 2000);
}

function stopAutoRefresh() {
    if (chatInterval) {
        clearInterval(chatInterval);
        chatInterval = null;
    }
}

function closeChatSidebar() {
    chatSidebar.style.display = "none";
    stopAutoRefresh(); //  important
}

///Chat Bubble Notification

function updateChatBadge(count) {
    const badge = document.getElementById("chatBadge");
    if (!badge) return;

    if (count > 0) {
        badge.style.display = "block";
        badge.innerText = count > 99 ? "99+" : count;
    } else {
        badge.style.display = "none";
    }
}

async function loadUnreadCount() {
    try {
        const res = await fetch('/api/convo-admin/unread-count');
        const data = await res.json();

        updateChatBadge(data.count);
    } catch (err) {
        console.error("Unread count error:", err);
    }
}

// every 2 sec
setInterval(loadUnreadCount, 2000);

async function markAsRead(conversationId) {
    try {
        await fetch('/api/convo-admin/mark-read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(conversationId)
        });

        //  reset badge instantly
        updateChatBadge(0);
    } catch (err) {
        console.error("Mark read error:", err);
    }
}