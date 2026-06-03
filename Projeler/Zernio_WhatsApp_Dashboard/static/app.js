/* ==========================================================================
   STATE MANAGEMENT
   ========================================================================== */
let activeConversation = null; // Currently selected conversation object
let sandboxConfig = null;      // Caches accountId, template name, etc.
let allConversations = [];    // Caches conversation array for search filters
let messagePollInterval = null;// Interval reference for active chat polling

/* ==========================================================================
   DOM ELEMENTS
   ========================================================================== */
const elements = {
    conversationsList: document.getElementById('conversations-list'),
    conversationsLoading: document.getElementById('conversations-loading'),
    chatSearch: document.getElementById('chat-search'),
    
    noChatState: document.getElementById('no-chat-state'),
    activeChatState: document.getElementById('active-chat-state'),
    activeChatName: document.getElementById('active-chat-name'),
    activeChatPlatform: document.getElementById('active-chat-platform'),
    sandboxNumber: document.getElementById('sandbox-number'),
    messagesList: document.getElementById('messages-list'),
    messageForm: document.getElementById('message-form'),
    messageInput: document.getElementById('message-input'),
    
    // Modal
    openInitiateModalBtn: document.getElementById('open-initiate-modal-btn'),
    initiateModal: document.getElementById('initiate-modal'),
    closeModalBtn: document.getElementById('close-modal-btn'),
    cancelModalBtn: document.getElementById('cancel-modal-btn'),
    submitInitiateBtn: document.getElementById('submit-initiate-btn'),
    initiatePhone: document.getElementById('initiate-phone'),
    initiateError: document.getElementById('initiate-error'),
    initiateSuccess: document.getElementById('initiate-success'),
    initiateSpinner: document.getElementById('initiate-spinner')
};

/* ==========================================================================
   INITIALIZATION & API CALLS
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Fetch Sandbox and Health info
    fetchSandboxStatus();
    
    // 2. Load conversations list
    loadConversations();
    
    // 3. Attach Event Listeners
    setupEventListeners();
});

function setupEventListeners() {
    // Search filter
    elements.chatSearch.addEventListener('input', filterConversations);
    
    // Message submit
    elements.messageForm.addEventListener('submit', handleSendMessage);
    
    // Modal toggle
    elements.openInitiateModalBtn.addEventListener('click', openModal);
    elements.closeModalBtn.addEventListener('click', closeModal);
    elements.cancelModalBtn.addEventListener('click', closeModal);
    elements.submitInitiateBtn.addEventListener('click', handleInitiateConversation);
    
    // Modal close when clicking backdrop
    elements.initiateModal.addEventListener('click', (e) => {
        if (e.target === elements.initiateModal) closeModal();
    });
}

/* ==========================================================================
   SANDBOX STATUS & PHONE NUMBERS
   ========================================================================== */
async function fetchSandboxStatus() {
    try {
        const response = await fetch('/api/sandbox-status');
        if (response.ok) {
            const data = await response.json();
            if (data.sandbox && data.sandbox.accountId) {
                sandboxConfig = data.sandbox;
                elements.sandboxNumber.textContent = sandboxConfig.phoneNumber;
                console.log("Zernio Sandbox config loaded successfully:", sandboxConfig);
            }
        }
    } catch (error) {
        console.error("Error fetching sandbox status:", error);
    }
}

/* ==========================================================================
   CONVERSATIONS (SIDEBAR)
   ========================================================================== */
async function loadConversations(selectTargetId = null) {
    try {
        elements.conversationsLoading.classList.remove('d-none');
        const response = await fetch('/api/conversations');
        elements.conversationsLoading.classList.add('d-none');
        
        if (response.ok) {
            const result = await response.json();
            allConversations = result.data || [];
            renderConversations(allConversations);
            
            // Auto-select a conversation if requested
            if (selectTargetId) {
                const target = allConversations.find(c => c.id === selectTargetId || c.participantId === selectTargetId);
                if (target) selectConversation(target);
            }
        } else {
            elements.conversationsList.innerHTML = `<li class="list-loader text-danger"><i class="fa-solid fa-triangle-exclamation"></i> Sohbetler yuklenemedi: ${response.statusText}</li>`;
        }
    } catch (error) {
        elements.conversationsLoading.classList.add('d-none');
        elements.conversationsList.innerHTML = `<li class="list-loader text-danger"><i class="fa-solid fa-triangle-exclamation"></i> Baglanti hatasi</li>`;
        console.error("Error loading conversations:", error);
    }
}

function renderConversations(conversations) {
    elements.conversationsList.innerHTML = '';
    
    if (conversations.length === 0) {
        elements.conversationsList.innerHTML = '<li class="list-loader">Aktif sohbet bulunmuyor.</li>';
        return;
    }
    
    conversations.forEach(conv => {
        const li = document.createElement('li');
        li.className = 'conv-item';
        if (activeConversation && activeConversation.id === conv.id) {
            li.classList.add('active');
        }
        
        // Formulate preview message
        const lastMsg = conv.lastMessage || "Medya veya Sablon";
        
        li.innerHTML = `
            <div class="conv-avatar">
                <i class="fa-solid ${conv.platform === 'whatsapp' ? 'fa-square-phone' : 'fa-user'}"></i>
            </div>
            <div class="conv-details">
                <div class="conv-row">
                    <span class="conv-name" title="${conv.participantName || conv.participantUsername}">${conv.participantName || conv.participantUsername}</span>
                    <span class="conv-badge">${conv.platform}</span>
                </div>
                <span class="conv-preview" title="${lastMsg}">${lastMsg}</span>
            </div>
        `;
        
        li.addEventListener('click', () => selectConversation(conv));
        elements.conversationsList.appendChild(li);
    });
}

function filterConversations(e) {
    const query = e.target.value.toLowerCase().trim();
    if (!query) {
        renderConversations(allConversations);
        return;
    }
    
    const filtered = allConversations.filter(c => {
        const name = (c.participantName || '').toLowerCase();
        const username = (c.participantUsername || '').toLowerCase();
        const id = (c.id || '').toLowerCase();
        return name.includes(query) || username.includes(query) || id.includes(query);
    });
    
    renderConversations(filtered);
}

/* ==========================================================================
   CONVERSATION DETAILS & MESSAGES (CHAT VIEW)
   ========================================================================== */
function selectConversation(conversation) {
    // Clear previous polling interval
    if (messagePollInterval) {
        clearInterval(messagePollInterval);
    }
    
    activeConversation = conversation;
    
    // Highlight the active conversation in sidebar
    const items = elements.conversationsList.querySelectorAll('.conv-item');
    items.forEach((item, index) => {
        const conv = allConversations[index];
        if (conv && conv.id === conversation.id) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Update Header
    elements.activeChatName.textContent = conversation.participantName || conversation.participantUsername;
    elements.activeChatPlatform.textContent = conversation.platform;
    
    // Switch Views
    elements.noChatState.classList.add('d-none');
    elements.activeChatState.classList.remove('d-none');
    
    // Load messages immediately
    loadMessages(conversation.id, conversation.accountId);
    
    // Setup message polling (every 5 seconds)
    messagePollInterval = setInterval(() => {
        loadMessages(conversation.id, conversation.accountId, false); // silent reload
    }, 5000);
}

async function loadMessages(conversationId, accountId, showSpinner = true) {
    if (showSpinner) {
        elements.messagesList.innerHTML = '<div class="list-loader"><i class="fa-solid fa-circle-notch fa-spin"></i> Mesajlar yukleniyor...</div>';
    }
    
    try {
        const url = `/api/messages?conversationId=${conversationId}&accountId=${accountId}`;
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            renderMessages(data.messages || []);
        } else {
            if (showSpinner) {
                elements.messagesList.innerHTML = `<div class="list-loader text-danger"><i class="fa-solid fa-triangle-exclamation"></i> Mesajlar yuklenemedi: ${response.statusText}</div>`;
            }
        }
    } catch (error) {
        if (showSpinner) {
            elements.messagesList.innerHTML = '<div class="list-loader text-danger"><i class="fa-solid fa-triangle-exclamation"></i> Baglanti hatasi</div>';
        }
        console.error("Error loading messages:", error);
    }
}

function renderMessages(messages) {
    const isAtBottom = elements.messagesList.scrollHeight - elements.messagesList.scrollTop <= elements.messagesList.clientHeight + 100;
    
    elements.messagesList.innerHTML = '';
    
    if (messages.length === 0) {
        elements.messagesList.innerHTML = '<div class="list-loader">Konusma gecmisi bos.</div>';
        return;
    }
    
    messages.forEach(msg => {
        const isOutgoing = msg.direction === 'outgoing';
        const wrapper = document.createElement('div');
        wrapper.className = `msg-wrapper ${isOutgoing ? 'outgoing' : 'incoming'}`;
        
        // Format timestamp nicely
        let timeStr = '';
        if (msg.sentAt || msg.createdAt) {
            try {
                const date = new Date(msg.sentAt || msg.createdAt);
                timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } catch (e) {
                timeStr = msg.sentAt || msg.createdAt;
            }
        }
        
        let messageText = msg.message || '';
        let isTemplate = false;
        
        // Handle template rendering
        if (messageText.startsWith('[template]')) {
            isTemplate = true;
            messageText = messageText.replace('[template] ', '');
        }
        
        // Status checks
        let statusIcon = '';
        if (isOutgoing) {
            if (msg.deliveryStatus === 'delivered') {
                statusIcon = '<i class="fa-solid fa-check-double msg-status-icon"></i>';
            } else if (msg.deliveryStatus === 'sent') {
                statusIcon = '<i class="fa-solid fa-check msg-status-icon"></i>';
            }
        }
        
        wrapper.innerHTML = `
            ${isTemplate ? `<span class="msg-template-badge"><i class="fa-solid fa-file-code"></i> ${messageText}</span>` : ''}
            <div class="msg-bubble">
                ${isTemplate ? 'Sablon baslatildi.' : escapeHTML(messageText)}
            </div>
            <div class="msg-footer">
                <span class="msg-sender">${isOutgoing ? 'Sen' : (msg.senderName || 'Hakan')}</span>
                <span class="msg-time">${timeStr}</span>
                ${statusIcon}
            </div>
        `;
        elements.messagesList.appendChild(wrapper);
    });
    
    // Auto scroll to bottom if user was already at bottom
    if (isAtBottom) {
        scrollToBottom();
    }
}

function scrollToBottom() {
    elements.messagesList.scrollTop = elements.messagesList.scrollHeight;
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

/* ==========================================================================
   SEND MESSAGES
   ========================================================================== */
async function handleSendMessage(e) {
    e.preventDefault();
    if (!activeConversation || !sandboxConfig) return;
    
    const text = elements.messageInput.value.trim();
    if (!text) return;
    
    elements.messageInput.value = '';
    
    const payload = {
        conversationId: activeConversation.id,
        accountId: activeConversation.accountId,
        message: text
    };
    
    try {
        const response = await fetch('/api/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            // Instantly load messages to reflect the sent message
            loadMessages(activeConversation.id, activeConversation.accountId, false);
            scrollToBottom();
            
            // Reload conversations list in sidebar to update preview
            loadConversations();
        } else {
            const err = await response.json();
            alert(`Mesaj gonderilemedi: ${err.error || response.statusText}`);
        }
    } catch (error) {
        console.error("Error sending message:", error);
        alert("Baglanti hatasi. Mesaj iletilemedi.");
    }
}

/* ==========================================================================
   MODAL & CONVERSATION INITIATION (TEMPLATE)
   ========================================================================== */
function openModal() {
    elements.initiatePhone.value = "+905076231510"; // Default value
    elements.initiateError.classList.add('d-none');
    elements.initiateSuccess.classList.add('d-none');
    elements.initiateModal.classList.remove('d-none');
}

function closeModal() {
    elements.initiateModal.classList.add('d-none');
}

async function handleInitiateConversation() {
    const phone = elements.initiatePhone.value.trim();
    if (!phone) {
        showInitiateError("Telefon numarasi girmelisiniz.");
        return;
    }
    
    // UI state: loading
    elements.initiateSpinner.classList.remove('d-none');
    elements.submitInitiateBtn.disabled = true;
    elements.initiateError.classList.add('d-none');
    
    try {
        const response = await fetch('/api/conversations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ phone })
        });
        
        elements.initiateSpinner.classList.add('d-none');
        elements.submitInitiateBtn.disabled = false;
        
        if (response.ok) {
            const result = await response.json();
            elements.initiateSuccess.classList.remove('d-none');
            
            setTimeout(() => {
                closeModal();
                // Load conversations and auto-select the new one
                const newPhoneFormatted = phone.replace("+", "").trim();
                loadConversations(newPhoneFormatted);
            }, 1500);
        } else {
            const err = await response.json();
            showInitiateError(err.error || response.statusText);
        }
    } catch (error) {
        elements.initiateSpinner.classList.add('d-none');
        elements.submitInitiateBtn.disabled = false;
        showInitiateError("Sunucuya baglanirken hata olustu.");
        console.error("Error initiating conversation:", error);
    }
}

function showInitiateError(msg) {
    elements.initiateError.textContent = msg;
    elements.initiateError.classList.remove('d-none');
}
