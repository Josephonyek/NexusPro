document.addEventListener("DOMContentLoaded", async () => {
    const userToken = localStorage.getItem('nexusAuthToken');
    const userId = localStorage.getItem('nexusUserId');

    if (!userToken || !userId) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const rtdbUrl = `https://nexuspro-cf948-default-rtdb.firebaseio.com/users/${userId}.json?auth=${userToken}`;
        
        console.log("🔍 Fetching from:", rtdbUrl); // For debugging

        const response = await fetch(rtdbUrl, { 
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log("📡 Response Status:", response.status);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText || 'Permission denied or invalid token'}`);
        }

        const userData = await response.json();
        console.log("📦 User Data:", userData);

        if (!userData) {
            throw new Error("No profile data found for this user.");
        }

        // Success path
        const userName = userData.name || "Student User";
        const userRole = userData.role || "student";

        document.getElementById('welcomeHeading').textContent = `Welcome Back, ${userName}!`;
        document.getElementById('welcomeSubtext').textContent = `Access your Nexus Pro workspace panel modules cleanly below.`;

        const roleBadge = document.getElementById('roleBadge');
        roleBadge.textContent = userRole.toUpperCase();

        if (userRole === 'admin') {
            roleBadge.className = "px-2.5 py-1 text-xs font-bold uppercase rounded-md bg-red-950 text-red-400 border border-red-900/40 tracking-wider";
            document.getElementById('adminSection').classList.remove('hidden');
        } else {
            roleBadge.className = "px-2.5 py-1 text-xs font-bold uppercase rounded-md bg-blue-950 text-blue-400 border border-blue-900/40 tracking-wider";
        }

    } catch (error) {
        console.error("❌ Dashboard Error:", error);
        
        document.getElementById('welcomeHeading').textContent = "Welcome Back!";
        document.getElementById('welcomeSubtext').textContent = "Failed to load cloud profile variables. Running limited session mode.";
        
        const roleBadge = document.getElementById('roleBadge');
        roleBadge.textContent = "Limited Access";
        roleBadge.className = "px-2.5 py-1 text-xs font-bold uppercase rounded-md bg-yellow-900 text-yellow-400 border border-yellow-800 tracking-wider";
    }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'login.html';
});
