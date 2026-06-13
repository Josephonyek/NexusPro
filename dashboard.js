// Defensive input sanitization helper
function sanitizeInput(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

document.addEventListener("DOMContentLoaded", async () => {
    const userToken = localStorage.getItem('nexusAuthToken');
    const userId = localStorage.getItem('nexusUserId');

    // SECURE BOOT: Kick out instantly if credentials are missing
    if (!userToken || !userId) {
        localStorage.clear();
        window.location.replace('login.html'); // replace prevents back-button loop hacks
        return;
    }

    try {
        const rtdbUrl = `https://nexuspro-cf948-default-rtdb.europe-west1.firebasedatabase.app/users/${userId}.json?auth=${userToken}`;
        const response = await fetch(rtdbUrl);
        
        // Handle invalid response directly (e.g., unauthorized token)
        if (!response.ok) throw new Error("Unauthorized Token Node");
        
        const userData = await response.json();

        // Ban System Check
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

        // Populate Dashboard Layout Parameters
        document.getElementById('welcomeHeading').textContent = `Welcome, ${userName}!`;
        document.getElementById('welcomeSubtext').textContent = `Access your Nexus Pro workspace panel modules cleanly below.`;

        const roleBadge = document.getElementById('roleBadge');
        roleBadge.textContent = userRole.toUpperCase();

        if (userRole === 'admin') {
            roleBadge.className = "px-2.5 py-1 text-xs font-bold uppercase rounded-md bg-red-950 text-red-400 border border-red-900/40 tracking-wider";
            document.getElementById('adminSection').classList.remove('hidden');
        } else {
            roleBadge.className = "px-2.5 py-1 text-xs font-bold uppercase rounded-md bg-blue-950 text-blue-400 border border-red-900/40 tracking-wider";
        }

        // ACCESS GRANTED: Fade out preloader and show dashboard body safely
        document.body.classList.add('access-granted');
        const preloader = document.getElementById('nexusPreloader');
        if (preloader) {
            preloader.classList.add('opacity-0', 'pointer-events-none');
            setTimeout(() => preloader.remove(), 500);
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
