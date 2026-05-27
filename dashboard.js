document.addEventListener("DOMContentLoaded", async () => {
    const userToken = localStorage.getItem('nexusAuthToken');
    const userId = localStorage.getItem('nexusUserId');

    const welcomeSub = document.getElementById('welcomeSubtext');

    if (!userToken || !userId) {
        welcomeSub.textContent = "No login data found. Redirecting...";
        setTimeout(() => window.location.href = 'login.html', 1500);
        return;
    }

    welcomeSub.textContent = "Connecting to your profile...";

    try {
        const rtdbUrl = `https://nexuspro-cf948-default-rtdb.europe-west1.firebasedatabase.app/users/${userId}.json?auth=${userToken}`;
        
        let response = await fetch(rtdbUrl);
        let userData = await response.json();

        if (!userData) {
            // Create default profile
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

        // Update UI with user data
        const userName = userData.name || "Student User";
        const userRole = userData.role || "student";

        document.getElementById('welcomeHeading').textContent = `Welcome Back, ${userName}!`;
        welcomeSub.textContent = "Profile loaded successfully ✅";

        const roleBadge = document.getElementById('roleBadge');
        roleBadge.textContent = userRole.toUpperCase();

        if (userRole === 'admin') {
            roleBadge.className = "px-2.5 py-1 text-xs font-bold uppercase rounded-md bg-red-950 text-red-400 border border-red-900/40 tracking-wider";
            document.getElementById('adminSection').classList.remove('hidden');
            
            // Load saved AI model if any
            if (userData.preferredAIModel) {
                document.getElementById('aiModelSelect').value = userData.preferredAIModel;
            }
        } else {
            roleBadge.className = "px-2.5 py-1 text-xs font-bold uppercase rounded-md bg-blue-950 text-blue-400 border border-blue-900/40 tracking-wider";
        }

    } catch (error) {
        console.error(error);
        welcomeSub.textContent = "Connection failed. Please check your internet.";
    }
});

// ====================== ADMIN FUNCTIONS ======================

// Save selected AI Model to Firebase
async function saveAIModel() {
    const userId = localStorage.getItem('nexusUserId');
    const userToken = localStorage.getItem('nexusAuthToken');
    const selectedModel = document.getElementById('aiModelSelect').value;

    if (!userId || !userToken) return;

    const rtdbUrl = `https://nexuspro-cf948-default-rtdb.europe-west1.firebasedatabase.app/users/${userId}.json?auth=${userToken}`;

    try {
        await fetch(rtdbUrl, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ preferredAIModel: selectedModel })
        });

        alert(`✅ AI Model changed to: ${selectedModel}`);
    } catch (error) {
        alert("Failed to save AI model preference.");
    }
}

// News Monitor
function monitorNews() {
    alert("📢 News Monitor Activated\n\nThis feature is ready. You can create news-monitor.html later.");
    // window.location.href = 'news-monitor.html';
}

// Community Monitor
function monitorCommunity() {
    alert("👥 Community Monitor Activated\n\nThis feature is ready. You can create community-moderate.html later.");
    // window.location.href = 'community-moderate.html';
}

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'login.html';
});
