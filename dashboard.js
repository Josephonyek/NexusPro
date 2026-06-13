// Quick defensive function to sanitize string parameters from the database
function sanitizeInput(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

document.addEventListener("DOMContentLoaded", async () => {
    const userToken = localStorage.getItem('nexusAuthToken');
    const userId = localStorage.getItem('nexusUserId');

    if (!userToken || !userId) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const rtdbUrl = `https://nexuspro-cf948-default-rtdb.europe-west1.firebasedatabase.app/users/${userId}.json?auth=${userToken}`;
        const response = await fetch(rtdbUrl);
        const userData = await response.json();

        // Check if user has a custom account status block set by administrator dashboard controls
        if (userData && userData.status === 'banned') {
            alert("This account has been restricted from accessing Nexus Pro nodes.");
            localStorage.clear();
            window.location.href = 'login.html';
            return;
        }

        const rawName = userData?.name || "New Student";
        let userRole = userData?.role || "student";

        // Sanitize the inputs received over HTTP from the remote network
        const userName = sanitizeInput(rawName);
        userRole = sanitizeInput(userRole).toString().toLowerCase().trim();

        // Welcome Message
        document.getElementById('welcomeHeading').textContent = `Welcome, ${userName}!`;
        document.getElementById('welcomeSubtext').textContent = `Access your Nexus Pro workspace panel modules cleanly below.`;

        // Role Badge
        const roleBadge = document.getElementById('roleBadge');
        roleBadge.textContent = userRole.toUpperCase();

        // Show Admin Panel only if role matches exactly "admin"
        if (userRole === 'admin') {
            roleBadge.className = "px-2.5 py-1 text-xs font-bold uppercase rounded-md bg-red-950 text-red-400 border border-red-900/40 tracking-wider";
            document.getElementById('adminSection').classList.remove('hidden');
        } else {
            roleBadge.className = "px-2.5 py-1 text-xs font-bold uppercase rounded-md bg-blue-950 text-blue-400 border border-blue-900/40 tracking-wider";
        }

    } catch (error) {
        console.error("Secure Initialization Loop Error:", error);
        document.getElementById('welcomeHeading').textContent = "Welcome!";
        document.getElementById('welcomeSubtext').textContent = "Connection issue. Please refresh.";
    }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'login.html';
});
