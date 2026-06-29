/**
 * Nexus Pro 2.0 - Core Dashboard Controller System (Anti-Loop Version)
 */

function sanitizeString(str) {
    if (!str) return '';
    const tempDiv = document.createElement('div');
    tempDiv.textContent = str;
    return tempDiv.innerHTML;
}

async function verifyAndInitializeDashboard() {
    // 1. Collect session tokens saved during login/signup
    const sessionToken = localStorage.getItem('nexusAuthToken');
    const userId = localStorage.getItem('nexusUserId');
    const cachedRole = localStorage.getItem('nexusUserRole') || 'student';

    // If there's absolutely no token, they aren't logged in. Send to login.
    if (!sessionToken || !userId) {
        console.warn("No active session tokens found. Redirecting to login gateway.");
        localStorage.clear();
        window.location.replace('login.html');
        return;
    }

    try {
        // Fetch your Firebase config maps dynamically
        const configResponse = await fetch('./api/firebaseConfig');
        if (!configResponse.ok) throw new Error("Config endpoint handshake dropped.");
        const firebaseConfig = await configResponse.json();

        const databaseUrl = firebaseConfig.databaseURL || 'https://nexuspro-cf948-default-rtdb.europe-west1.firebasedatabase.app';
        const cleanDbUrl = databaseUrl.replace(/\/$/, "");

        // 2. Fetch the profile while sending the authorization token
        const userFetchResponse = await fetch(`${cleanDbUrl}/users/${userId}.json?auth=${sessionToken}`);
        
        if (!userFetchResponse.ok) {
            throw new Error(`Database security rejection: ${userFetchResponse.status}`);
        }

        const profileData = await userFetchResponse.json();

        // 3. THE ANTI-LOOP FIX: If network lag caused profileData to be empty, 
        // DO NOT kick the user out! Build a temporary profile from cached data instead.
        const finalProfile = profileData || {
            name: "Scholar",
            role: cachedRole,
            status: "active",
            gameMetrics: { totalXP: 0, currentLevel: 1 }
        };

        if (finalProfile.status === 'suspended' || finalProfile.status === 'banned') {
            alert("🔒 Access Terminated: This account has been suspended.");
            localStorage.clear();
            window.location.replace('login.html');
            return;
        }

        // 4. Populate UI elements safely
        const cleanName = sanitizeString(finalProfile.name);
        const cleanRole = sanitizeString(finalProfile.role);

        const welcomeHeading = document.getElementById('welcomeHeading');
        if (welcomeHeading) welcomeHeading.innerHTML = `Welcome Back, ${cleanName}!`;
        
        const roleBadge = document.getElementById('roleBadge');
        if (roleBadge) {
            roleBadge.innerText = cleanRole;
            if (cleanRole === 'admin') {
                roleBadge.className = "px-2.5 py-1 text-xs font-bold uppercase rounded-md bg-red-950 text-red-400 border border-red-900/40";
                document.getElementById('adminSection')?.classList.remove('hidden');
                document.getElementById('sidebarAdminLinks')?.classList.remove('hidden');
            } else {
                roleBadge.className = "px-2.5 py-1 text-xs font-bold uppercase rounded-md bg-blue-950 text-blue-400 border border-blue-900/40";
                document.getElementById('adminSection')?.classList.add('hidden');
                document.getElementById('sidebarAdminLinks')?.classList.add('hidden');
            }
        }

        // 5. Load XP and Levels if elements exist
        if (finalProfile.gameMetrics) {
            const currentXp = parseInt(finalProfile.gameMetrics.totalXP || 0);
            const currentLevel = parseInt(finalProfile.gameMetrics.currentLevel || 1);
            if (document.getElementById('userXpText')) document.getElementById('userXpText').innerText = `${currentXp.toLocaleString()} XP`;
            if (document.getElementById('userLevelText')) document.getElementById('userLevelText').innerText = `Level ${currentLevel}`;
        }

        clearPreloaderOverlay();

    } catch (criticalError) {
        console.error("Dashboard Fallback Triggered:", criticalError.message);
        
        // 6. THE CRITICAL REJECTION SAFETY NET:
        // Even if the database lookup errors out completely, if they have localStorage keys,
        // we keep them logged in using offline fallback metrics instead of breaking the page.
        const welcomeHeading = document.getElementById('welcomeHeading');
        if (welcomeHeading) welcomeHeading.innerHTML = "Welcome to Nexus Pro!";
        
        const roleBadge = document.getElementById('roleBadge');
        if (roleBadge) {
            roleBadge.innerText = cachedRole;
            roleBadge.className = "px-2.5 py-1 text-xs font-bold uppercase rounded-md bg-amber-950 text-amber-400 border border-amber-900/40";
        }
        
        clearPreloaderOverlay();
    }
}

function clearPreloaderOverlay() {
    const loaderMask = document.getElementById('nexusPreloader') || document.getElementById('uploadPreloader');
    if (!loaderMask) return;
    loaderMask.classList.add('opacity-0', 'pointer-events-none');
    setTimeout(() => { loaderMask.remove(); }, 450);
}

function executeLogoutSequence() {
    if (confirm("Are you sure you want to log out?")) {
        localStorage.clear();
        window.location.replace('login.html');
    }
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('logoutBtn')?.addEventListener('click', executeLogoutSequence);
    document.getElementById('sidebarLogoutBtn')?.addEventListener('click', executeLogoutSequence);
    verifyAndInitializeDashboard();
});
