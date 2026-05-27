document.addEventListener("DOMContentLoaded", async () => {
    const userToken = localStorage.getItem('nexusAuthToken');
    const userId = localStorage.getItem('nexusUserId');

    // Kick out unauthenticated visitors
    if (!userToken || !userId) {
        window.location.href = 'login.html';
        return;
    }

    try {
        // Fetch the user's specific Firestore entry document directly via REST API
        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/nexuspro-cf948/databases/(default)/documents/users/${userId}`;
        
        const response = await fetch(firestoreUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${userToken}`
            }
        });

        if (!response.ok) {
            throw new Error("Failed to fetch user role parameters.");
        }

        const userData = await response.json();
        
        // Extract field values based on Firestore JSON styling structures
        const userName = userData.fields.name.stringValue;
        const userRole = userData.fields.role.stringValue; // Will be "student" or "admin"

        // Update UI greetings dynamically
        document.getElementById('welcomeHeading').textContent = `Welcome Back, ${userName}!`;
        
        const roleBadge = document.getElementById('roleBadge');
        roleBadge.textContent = userRole;

        // Role Evaluation Routing Conditional
        if (userRole === 'admin') {
            // Style the badge red and show the Admin control section
            roleBadge.className = "px-2.5 py-1 text-xs font-bold uppercase rounded-md bg-red-950 text-red-400 border border-red-900/40";
            document.getElementById('adminSection').classList.remove('hidden');
        } else {
            // Style the badge blue for standard student profiles
            roleBadge.className = "px-2.5 py-1 text-xs font-bold uppercase rounded-md bg-blue-950 text-blue-400 border border-blue-900/40";
        }

    } catch (error) {
        console.error("Dashboard router error:", error);
        // Fallback profile text if network delays drop role check
        document.getElementById('welcomeHeading').textContent = "Welcome Back, User!";
        document.getElementById('roleBadge').textContent = "User";
    }
});

// Sign Out Routine
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('nexusAuthToken');
    localStorage.removeItem('nexusUserId');
    window.location.href = 'login.html';
});