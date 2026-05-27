// Execute profile validations instantly when page structural nodes load
document.addEventListener("DOMContentLoaded", async () => {
    const userToken = localStorage.getItem('nexusAuthToken');
    const userId = localStorage.getItem('nexusUserId');

    // Kick out unauthenticated visitors instantly
    if (!userToken || !userId) {
        window.location.href = 'login.html';
        return;
    }

    try {
        // Fetch current snapshot directly from your custom Realtime Database JSON cluster endpoint
        const rtdbUrl = `https://nexuspro-cf948-default-rtdb.firebaseio.com/users/${userId}.json?auth=${userToken}`;
        
        const response = await fetch(rtdbUrl, { method: 'GET' });

        if (!response.ok) {
            throw new Error("Unable to retrieve remote target details.");
        }

        const userData = await response.json();
        
        if (!userData) {
            throw new Error("Profile node entry missing.");
        }

        // Clean parameter mapping extraction from JSON payload object
        const userName = userData.name || "User";
        const userRole = userData.role || "student"; // "student" or "admin"

        // Inject data into layout typography nodes
        document.getElementById('welcomeHeading').textContent = `Welcome Back, ${userName}!`;
        
        const roleBadge = document.getElementById('roleBadge');
        roleBadge.textContent = userRole;

        // Core Conditional UI Customization Based on Role
        if (userRole === 'admin') {
            // Apply Red styling context to admin badges
            roleBadge.className = "px-2.5 py-1 text-xs font-bold uppercase rounded-md bg-red-950 text-red-400 border border-red-900/40";
            
            // Uncover the hidden administrative control container markup card
            document.getElementById('adminSection').classList.remove('hidden');
        } else {
            // Standard Blue theme parameters for regular student interfaces
            roleBadge.className = "px-2.5 py-1 text-xs font-bold uppercase rounded-md bg-blue-950 text-blue-400 border border-blue-900/40";
        }

    } catch (error) {
        console.error("Dashboard routing error context caught:", error);
        
        // Fail-safe graceful interface values if database fetch encounters structural delay
        document.getElementById('welcomeHeading').textContent = "Welcome Back!";
        document.getElementById('roleBadge').textContent = "Verified User";
    }
});

// Clear out ongoing caching items during deliberate sign out processes
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('nexusAuthToken');
    localStorage.removeItem('nexusUserId');
    
    // Bounce user back to portal gate entry interface
    window.location.href = 'login.html';
});
