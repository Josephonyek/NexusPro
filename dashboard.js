document.addEventListener("DOMContentLoaded", async () => {
    const userToken = localStorage.getItem('nexusAuthToken');
    const userId = localStorage.getItem('nexusUserId');

    const welcomeSub = document.getElementById('welcomeSubtext');

    if (!userToken || !userId) {
        welcomeSub.textContent = "No login data. Redirecting...";
        setTimeout(() => window.location.href = 'login.html', 1500);
        return;
    }

    welcomeSub.textContent = "Connecting to your profile...";

    try {
        const rtdbUrl = `https://nexuspro-cf948-default-rtdb.europe-west1.firebasedatabase.app/users/${userId}.json?auth=${userToken}`;
        
        let response = await fetch(rtdbUrl);
        let userData = await response.json();

        if (!userData) {
            // Create default profile if missing
            const defaultProfile = {
                name: "New Student",
                role: "student",
                createdAt: Date.now()
            };
            await fetch(rtdbUrl, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(defaultProfile)
            });
            userData = defaultProfile;
        }

        // === UPDATED WELCOME MESSAGE ===
        const userName = userData.name || "New Student";
        const userRole = userData.role || "student";

        document.getElementById('welcomeHeading').textContent = `Welcome, ${userName}!`;
        document.getElementById('welcomeSubtext').textContent = `Access your Nexus Pro workspace panel modules cleanly below.`;

        // Role Badge
        const roleBadge = document.getElementById('roleBadge');
        roleBadge.textContent = userRole.toUpperCase();

        if (userRole === 'admin') {
            roleBadge.className = "px-2.5 py-1 text-xs font-bold uppercase rounded-md bg-red-950 text-red-400 border border-red-900/40 tracking-wider";
            document.getElementById('adminSection').classList.remove('hidden');
        } else {
            roleBadge.className = "px-2.5 py-1 text-xs font-bold uppercase rounded-md bg-blue-950 text-blue-400 border border-blue-900/40 tracking-wider";
        }

    } catch (error) {
        console.error(error);
        document.getElementById('welcomeHeading').textContent = "Welcome!";
        document.getElementById('welcomeSubtext').textContent = "Connection issue. Please refresh.";
    }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'login.html';
});

// === ADMIN FUNCTIONS ===
function saveGlobalAIModel() {
    const model = document.getElementById('aiModelSelect').value;
    alert(`✅ Global AI Model changed to: ${model}\n(This will apply to all users in the next update)`);
}

function showAIUsage() {
    alert("📊 AI Usage Monitor\n\nComing soon: Track how many questions each user asks.");
}

function showUserManagement() {
    alert("👥 User Management\n\nComing soon: View all users, edit profiles, ban accounts.");
}

function showFootballMonitor() {
    alert("⚽ Football Monitor\n\nComing soon: See how users interact with the football feature.");
}
