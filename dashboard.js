// Defensive input sanitization helper to stop XSS injection
function sanitizeInput(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

document.addEventListener("DOMContentLoaded", async () => {
    const userToken = localStorage.getItem('nexusAuthToken');
    const userId = localStorage.getItem('nexusUserId');

    // SECURITY CHECK: Kick unauthorized traffic out instantly before loading anything
    if (!userToken || !userId) {
        localStorage.clear();
        window.location.replace('login.html');
        return;
    }

    try {
        const rtdbUrl = `https://nexuspro-cf948-default-rtdb.europe-west1.firebasedatabase.app/users/${userId}.json?auth=${userToken}`;
        const response = await fetch(rtdbUrl);
        
        if (!response.ok) throw new Error("Unauthorized access token.");
        
        const userData = await response.json();

        // Ban Check Integration
        if (userData && userData.status === 'banned') {
            alert("This account is restricted from using Nexus Pro nodes.");
            localStorage.clear();
            window.location.replace('login.html');
            return;
        }

        const rawName = userData?.name || "New Student";
        let userRole = userData?.role || "student";

        const userName = sanitizeInput(rawName);
        userRole = sanitizeInput(userRole).toString().toLowerCase().trim();

        // Update Text Fields Safely
        document.getElementById('welcomeHeading').textContent = `Welcome, ${userName}!`;
        document.getElementById('welcomeSubtext').textContent = `Access your Nexus Pro workspace panel modules cleanly below.`;

        const roleBadge = document.getElementById('roleBadge');
        roleBadge.textContent = userRole.toUpperCase();

        if (userRole === 'admin') {
            roleBadge.className = "px-2.5 py-1 text-xs font-bold uppercase rounded-md bg-red-950 text-red-400 border border-red-900/40 tracking-wider";
            document.getElementById('adminSection').classList.remove('hidden');
        } else {
            roleBadge.className = "px-2.5 py-1 text-xs font-bold uppercase rounded-md bg-blue-950 text-blue-400 border border-blue-900/40 tracking-wider";
        }

        // ==========================================
        // 🚀 PRELOADER TERMINATION (ACCESS GRANTED)
        // ==========================================
        // 1. Reveal dashboard background content smoothly
        document.body.classList.add('access-granted');
        
        // 2. Fade out and remove the logo screen
        const preloader = document.getElementById('nexusPreloader');
        if (preloader) {
            preloader.classList.add('opacity-0', 'pointer-events-none');
            setTimeout(() => preloader.remove(), 500); // Completely wipes elements from DOM
        }

    } catch (error) {
        console.error("Identity Loop Exception:", error);
        localStorage.clear();
        window.location.replace('login.html');
    }
});

// Logout Routine
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.clear();
    window.location.replace('login.html');
});
