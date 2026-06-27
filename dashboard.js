// Nexus Pro 2.0 - Core Dashboard Controller System

// Defensive Cross-Site Scripting (XSS) Sanitizer
function sanitize(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

async function verifyAndInitializeDashboard() {
    // 1. AUTHENTICATION LOCK: Instantly reject if local credentials do not exist
    const sessionToken = localStorage.getItem('nexusAuthToken');
    const userId = localStorage.getItem('nexusUserId');

    if (!sessionToken || !userId) {
        console.warn("Unauthorized access attempt caught. Redirecting to login sequence.");
        localStorage.clear();
        window.location.replace('login.html');
        return;
    }

    // 2. CONFIGURATION HANDSHAKE: Fetch dynamic backend maps
let databaseUrl = 'https://YOUR-PROJECT-ID-default-rtdb.firebaseio.com'; // 👈 Change this to your EXACT Firebase Database URL

try {
    const configResponse = await fetch('./api/firebaseConfig');
    if (configResponse.ok) {
        const firebaseConfig = await configResponse.json();
        if (firebaseConfig.databaseURL) {
            databaseUrl = firebaseConfig.databaseURL;
        }
    }
} catch (e) {
    console.log("Config endpoint offline, falling back to secure hardcoded URL string routing.");
}

const cleanDbUrl = databaseUrl.replace(/\/$/, "");
        const firebaseConfig = await configResponse.json();

        const databaseUrl = firebaseConfig.databaseURL || 'https://nexuspro-cf948-default-rtdb.europe-west1.firebasedatabase.app';
        const cleanDbUrl = databaseUrl.replace(/\/$/, "");

        // 3. SECURE NODE LOOKUP: Appends the auth token query parameter to satisfy security rules
        const userFetchResponse = await fetch(`${cleanDbUrl}/users/${userId}.json?auth=${sessionToken}`);
        
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

        // ACCESS AUTHORIZED: Begin populating dashboard panels securely
        const cleanName = sanitize(profileData.name || "Scholar");
        const cleanRole = sanitize(profileData.role || "student");

        document.getElementById('welcomeHeading').innerHTML = `Welcome Back, ${cleanName}!`;
        if (document.getElementById('welcomeSubtext')) {
            document.getElementById('welcomeSubtext').innerText = "Track assignments, review materials, or step into the learning academy panels.";
        }
        
        const roleBadge = document.getElementById('roleBadge');
        if (roleBadge) {
            roleBadge.innerText = cleanRole;
            // Dynamically apply visual aesthetics based on roles
            if (cleanRole === 'admin') {
                roleBadge.className = "px-2.5 py-1 text-xs font-bold uppercase rounded-md bg-red-950 text-red-400 border border-red-900/40 tracking-wider";
                // Reveal administrative operational units
                document.getElementById('adminSection')?.classList.remove('hidden');
                document.getElementById('sidebarAdminLinks')?.classList.remove('hidden');
            } else {
                roleBadge.className = "px-2.5 py-1 text-xs font-bold uppercase rounded-md bg-blue-950 text-blue-400 border border-blue-900/40 tracking-wider";
            }
        }

        // 5. GAMIFICATION PROGRESS METRICS: Populating XP parameters
        if (profileData.gameMetrics) {
            const currentXp = parseInt(profileData.gameMetrics.totalXP || 0);
            const currentLevel = parseInt(profileData.gameMetrics.currentLevel || 1);

            if (document.getElementById('userXpText')) document.getElementById('userXpText').innerText = `${currentXp.toLocaleString()} XP`;
            if (document.getElementById('userLevelText')) document.getElementById('userLevelText').innerText = `Level ${currentLevel}`;
        } else {
            if (document.getElementById('userXpText')) document.getElementById('userXpText').innerText = "0 XP";
            if (document.getElementById('userLevelText')) document.getElementById('userLevelText').innerText = "Level 1";
        }
        
        // Reveal components visually
        document.getElementById('xpBadge')?.classList.remove('hidden');
        document.getElementById('xpBadge')?.classList.add('flex');
        document.getElementById('levelBox')?.classList.remove('hidden');

        // ACCESS SEQUENCE COMPLETE: Drop styled preloader mask overlay screen cleanly
        dropPreloaderScreen();

    } catch (criticalError) {
        console.error("Dashboard Core Execution Exception:", criticalError);
        const preloaderTextNode = document.querySelector('#nexusPreloader p, #uploadPreloader p');
        if (preloaderTextNode) {
            preloaderTextNode.className = "text-xs font-bold text-red-400 uppercase text-center mt-2 px-4";
            preloaderTextNode.innerText = `Handshake Fault: Permission Denied or Lost Connection`;
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
    document.getElementById('logoutBtn')?.addEventListener('click', terminateSessionChannel);
    verifyAndInitializeDashboard();
});
