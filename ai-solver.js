let currentSubject = "all";

function createSubjectButtons() {
    const subjects = ["All Subjects", "Physics", "Chemistry", "Biology", "Mathematics"];
    const values = ["all", "physics", "chemistry", "biology", "math"];
    const container = document.getElementById('subjectButtons');

    subjects.forEach((name, i) => {
        const btn = document.createElement('button');
        btn.className = `px-5 py-2 rounded-2xl text-sm font-medium ${i === 0 ? 'bg-blue-600 text-white' : 'bg-gray-800 hover:bg-gray-700'}`;
        btn.textContent = name;
        btn.onclick = () => {
            document.querySelectorAll('#subjectButtons button').forEach(b => b.classList.remove('bg-blue-600', 'text-white'));
            btn.classList.add('bg-blue-600', 'text-white');
            currentSubject = values[i];
        };
        container.appendChild(btn);
    });
}

function addMessage(text, isUser) {
    const chatArea = document.getElementById('chatArea');
    const div = document.createElement('div');
    div.className = `flex ${isUser ? 'justify-end' : 'justify-start'}`;
    div.innerHTML = `<div class="${isUser ? 'chat-bubble-user' : 'chat-bubble-ai'} p-4 max-w-[85%]">${text}</div>`;
    chatArea.appendChild(div);
    chatArea.scrollTop = chatArea.scrollHeight;
}

async function sendQuestion() {
    const input = document.getElementById('questionInput');
    const question = input.value.trim();
    if (!question) return;

    addMessage(question, true);
    input.value = '';

    const thinkingId = 'thinking';
    const chatArea = document.getElementById('chatArea');
    chatArea.innerHTML += `<div id="${thinkingId}" class="flex justify-start"><div class="chat-bubble-ai p-4">Thinking...</div></div>`;
    chatArea.scrollTop = chatArea.scrollHeight;

    try {
        const response = await fetch('/api/solve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question: question,
                subject: currentSubject,
                userId: localStorage.getItem('nexusUserId'),
                userName: localStorage.getItem('userName') || "Student"
            })
        });

        const data = await response.json();
        document.getElementById(thinkingId)?.remove();

        if (data.success) {
            addMessage(data.answer, false);
        } else {
            addMessage("❌ " + (data.error || "Something went wrong"), false);
        }
    } catch (err) {
        document.getElementById(thinkingId)?.remove();
        addMessage("❌ Connection error. Please try again.", false);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    createSubjectButtons();
    document.getElementById('questionInput').addEventListener("keypress", e => {
        if (e.key === "Enter") sendQuestion();
    });
});
