// ai-solver.js

function addMessage(text, isUser) {
    const chatArea = document.getElementById('chatArea');

    // Remove welcome message on first real message
    const welcome = chatArea.querySelector('.welcome-msg');
    if (welcome) welcome.remove();

    const div = document.createElement('div');
    div.className = `flex ${isUser ? 'justify-end' : 'justify-start'}`;
    div.innerHTML = `
        <div class="${isUser ? 'chat-bubble-user' : 'chat-bubble-ai'} p-4 max-w-[85%] text-[15px] leading-relaxed">
            ${text}
        </div>
    `;
    chatArea.appendChild(div);
    chatArea.scrollTop = chatArea.scrollHeight;
}

function showTyping() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.classList.remove('hidden');
        const chatArea = document.getElementById('chatArea');
        chatArea.appendChild(indicator); // move to bottom
        chatArea.scrollTop = chatArea.scrollHeight;
    }
}

function hideTyping() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.classList.add('hidden');
    }
}

async function sendQuestion() {
    const input = document.getElementById('questionInput');
    const question = input.value.trim();
    if (!question) return;

    addMessage(question, true);
    input.value = '';
    input.focus();

    showTyping();

    try {
        const response = await fetch('/api/solve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question: question,
                subject: "all",
                userId: localStorage.getItem('nexusUserId'),
                userName: localStorage.getItem('userName') || "Student"
            })
        });

        const data = await response.json();
        hideTyping();

        if (data.success) {
            addMessage(data.answer, false);
        } else {
            addMessage("❌ " + (data.error || "Something went wrong"), false);
        }
    } catch (err) {
        hideTyping();
        addMessage("❌ Connection error. Please try again.", false);
    }
}

// ========== DOWNLOAD CHAT AS PDF ==========
function downloadChatAsPDF() {
    const chatArea = document.getElementById('chatArea');
    const bubbles = chatArea.querySelectorAll('.chat-bubble-user, .chat-bubble-ai');

    if (bubbles.length === 0) {
        alert("No messages to download yet.");
        return;
    }

    // Create a temporary printable container
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Nexus AI Chat</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    padding: 40px;
                    color: #111;
                    line-height: 1.6;
                    max-width: 800px;
                    margin: 0 auto;
                }
                h1 {
                    font-size: 22px;
                    margin-bottom: 5px;
                    color: #1e40af;
                }
                .meta {
                    color: #6b7280;
                    font-size: 13px;
                    margin-bottom: 30px;
                    border-bottom: 1px solid #e5e7eb;
                    padding-bottom: 15px;
                }
                .message {
                    margin-bottom: 18px;
                    padding: 14px 18px;
                    border-radius: 12px;
                    max-width: 90%;
                }
                .user {
                    background: #2563eb;
                    color: white;
                    margin-left: auto;
                    border-bottom-right-radius: 4px;
                }
                .ai {
                    background: #f3f4f6;
                    color: #111;
                    border-bottom-left-radius: 4px;
                }
                .label {
                    font-size: 11px;
                    font-weight: 600;
                    margin-bottom: 4px;
                    opacity: 0.7;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
            </style>
        </head>
        <body>
            <h1>Nexus AI Chat</h1>
            <div class="meta">
                Exported on ${new Date().toLocaleString()}
            </div>
    `);

    bubbles.forEach(bubble => {
        const isUser = bubble.classList.contains('chat-bubble-user');
        const text = bubble.innerText;
        printWindow.document.write(`
            <div class="message ${isUser ? 'user' : 'ai'}">
                <div class="label">${isUser ? 'You' : 'Nexus AI'}</div>
                ${text.replace(/\n/g, '<br>')}
            </div>
        `);
    });

    printWindow.document.write(`
        </body>
        </html>
    `);

    printWindow.document.close();

    // Wait a moment then trigger print → Save as PDF
    setTimeout(() => {
        printWindow.print();
    }, 400);
}

// ========== INIT ==========
document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById('questionInput');
    
    input.addEventListener("keypress", e => {
        if (e.key === "Enter") sendQuestion();
    });
});
