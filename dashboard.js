// Nexus Pro 2.0 - Core Dashboard Controller System

// Defensive Cross-Site Scripting (XSS) Sanitizer
function sanitize(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

async function verifyAndInitializeDashboard() {
    // 1. AUTHENTICATION LOCK: Instantly reject if credentials do not exist in local cache
    const sessionToken = localStorage.getItem('nexusAuthToken');
    const userId = localStorage.getItem('nexusUserId');

    if (!sessionToken || !userId) {
        console.warn("Unauthorized access attempt caught. Redirecting to login sequence.");
        localStorage.clear();
        window.location.replace('login.html');
        return;
    }

    try {
        // 2. CONFIGURATION HANDSHAKE: Fetch server settings dynamically
        const configResponse = await fetch('./api/firebaseConfig');
        if (!configResponse.ok) throw new Error("Could not load secure database configuration maps.");
        const firebaseConfig = await configResponse.json();

        const databaseUrl = firebaseConfig.databaseURL || 'https://nexuspro-cf948-default-rtdb.europe-west1.firebasedatabase.app';
        const cleanDbUrl = databaseUrl.replace(/\/$/, "");

        // 3. SECURE NODE LOOKUP: Fetch user credentials directly from database path
        const userFetchResponse = await fetch(`${cleanDbUrl}/users/${userId}.json`);
        
        if (!userFetchResponse.ok) {
            throw new Error("Security verification failed on database query.");
        }

        const profileData = await userFetchResponse.json();

        // 4. SUSPENSION & BAN PROTECTION: Evict invalid or compromised accounts
        if (!profileData || profileData.status === 'suspended' || profileData.status === 'banned') {
            alert("🔒 Access Revoked: This profile node has been suspended or does not exist.");
            localStorage.clear();
            window.location.replace('login.html');
            return;
        }

        // ACCESS AUTHORIZED: Begin populating elements defensively
        
        // Render Role Badges and Welcome Greetings Safely
        const cleanName = sanitize(profileData.name || "Scholar");
        const cleanRole = sanitize(profileData.role || "student");

        document.getElementById('welcomeHeading').innerHTML = `Welcome Back, ${cleanName}!`;
        document.getElementById('welcomeSubtext').innerText = "Track assignments, review materials, or step into the learning arcade panels.";
        
        const roleBadge = document.getElementById('roleBadge');
        roleBadge.innerText = cleanRole;
        
        // Dynamically style badge colors based on authentication role metrics
        if (cleanRole === 'admin') {
            roleBadge.className = "px-2.5 py-1 text-xs font-bold uppercase rounded-md bg-red-950 text-red-400 border border-red-900/40 tracking-wider";
            // Unhide Administrative Grid Desk Panels and Sidebar Links
            document.getElementById('adminSection')?.classList.remove('hidden');
            document.getElementById('sidebarAdminLinks')?.classList.remove('hidden');
        } else {
            roleBadge.className = "px-2.5 py-1 text-xs font-bold uppercase rounded-md bg-blue-950 text-blue-400 border border-blue-900/40 tracking-wider";
        }

        // 5. GAMIFICATION METRICS INTEGRATION: Inject user XP level components
        if (profileData.gameMetrics) {
            const currentXp = parseInt(profileData.gameMetrics.totalXP || 0);
            const currentLevel = parseInt(profileData.gameMetrics.currentLevel || 1);

            document.getElementById('userXpText').innerText = `${currentXp.toLocaleString()} XP`;
            document.getElementById('userLevelText').innerText = `Level ${currentLevel}`;
            
            // Reveal gamification structures visually once values settle
            document.getElementById('xpBadge')?.classList.remove('hidden');
            document.getElementById('xpBadge')?.classList.add('flex');
            document.getElementById('levelBox')?.classList.remove('hidden');
        } else {
            // Default structural display if game metrics object is fresh or uninitialized
            document.getElementById('userXpText').innerText = "0 XP";
            document.getElementById('userLevelText').innerText = "Level 1";
            document.getElementById('xpBadge')?.classList.remove('hidden');
            document.getElementById('xpBadge')?.classList.add('flex');
            document.getElementById('levelBox')?.classList.remove('hidden');
        }

        // ACCESS SEQUENCE COMPLETE: Reveal body viewport canvas and drop the styled preloader overlay
        document.body.classList.add('access-granted');
        dropPreloaderScreen();

    } catch (criticalError) {
        console.error("Dashboard Core Execution Exception:", criticalError);
        // Show clear debugging text directly inside the loading window before crashing out gracefully
        const preloaderTextNode = document.querySelector('#nexusPreloader p');
        if (preloaderTextNode) {
            preloaderTextNode.className = "text-xs font-bold text-red-400 uppercase text-center mt-2 px-4";
            preloaderTextNode.innerText = `Handshake Fault: ${criticalError.message}`;
        }
    }
}

function dropPreloaderScreen() {
    const preloaderElement = document.getElementById('nexusPreloader');
    if (!preloaderElement) return;

    preloaderElement.classList.add('opacity-0', 'pointer-events-none');
    setTimeout(() => {
        preloaderElement.remove();
    }, 500);
}

// System Eviction Log-Out Module Routine
function terminateSessionChannel() {
    if (confirm("Are you sure you want to log out of Nexus Pro?")) {
        localStorage.clear();
        window.location.replace('login.html');
    }
}

// Hook Global Events on Runtime Execution Loop
document.addEventListener("DOMContentLoaded", () => {
    // Bind click listeners cleanly across navigation elements
    document.getElementById('logoutBtn')?.addEventListener('click', terminateSessionChannel);
    
    // Execute server verification sequence
    verifyAndInitializeDashboard();
});
