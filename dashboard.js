document.addEventListener("DOMContentLoaded", async () => {
    const userToken = localStorage.getItem('nexusAuthToken');
    const userId = localStorage.getItem('nexusUserId');

    // Security Guard: Route anonymous traffic straight out to portal page
    if (!userToken || !userId) {
        window.location.href = 'login.html';
        return;
    }

    try {
        // Direct integration targeted at your exact Nexus Pro Realtime Database cluster
        const rtdbUrl = `https://nexuspro-cf948-default-rtdb.firebaseio.com/users/${userId}.json?auth=${userToken}`;
        
        const response = await fetch(rtdbUrl, { method: 'GET' });

        if (!response.ok) {
            throw new Error("Server communication barrier hit.");
        }

        const userData = await response.json();
        
        // Safety check if database record exists but object node structure returns null
        if (!userData) {
            throw new Error("No database profile data linked to this account ID.");
        }

        // Parse variables out of the structured Realtime Database JSON format
        const userName = userData.name || "Student User";
        const userRole = userData.role || "student"; // Defaults cleanly to student if empty

        // 1. Refresh textual presentation headings
        document.getElementById('welcomeHeading').textContent = `Welcome Back, ${userName}!`;
        document.getElementById('welcomeSubtext').textContent = `Access your Nexus Pro workspace panel modules cleanly below.`;
        
        // 2. Render Role Badges & System Privileges conditionally
        const roleBadge = document.getElementById('roleBadge');
        roleBadge.textContent = userRole;

        if (userRole === 'admin') {
            // Apply Red Administrator styling tokens
            roleBadge.className = "px-2.5 py-1 text-xs font-bold uppercase rounded-md bg-red-950 text-red-400 border border-red-900/40 tracking-wider";
            
            // Show the top hidden admin panel container
            document.getElementById('adminSection').classList.remove('hidden');
        } else {
            // Apply Standard Student styling tokens
            roleBadge.className = "px-2.5 py-1 text-xs font-bold uppercase rounded-md bg-blue-950 text-blue-400 border border-blue-900/40 tracking-wider";
        }

    } catch (error) {
        console.error("Dashboard engine access configuration issue:", error);
        
        // Graceful UI fallbacks if database latency blocks role reading
        document.getElementById('welcomeHeading').textContent = "Welcome Back!";
        document.getElementById('welcomeSubtext').textContent = "Failed to load cloud profile variables. Running limited session mode.";
        
        const roleBadge = document.getElementById('roleBadge');
        roleBadge.textContent = "Verified Account";
        roleBadge.className = "px-2.5 py-1 text-xs font-bold uppercase rounded-md bg-gray-800 text-gray-400 border border-gray-700 tracking-wider";
    }
});

// Purge authorization signatures when hitting log out
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('nexusAuthToken');
    localStorage.removeItem('nexusUserId');
    window.location.href = 'login.html';
});
