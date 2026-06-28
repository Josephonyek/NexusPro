/**
 * Nexus Pro 2.0 - Core Dashboard Controller System
 * Architecture: Clean Vanilla JS, Modular Event Handlers, Security-First Logic
 */

// 1. DATA PROTECTION LAYER: Prevent XSS attacks by cleansing input strings
function sanitizeString(str) {
    if (!str) return '';
    const tempDiv = document.createElement('div');
    tempDiv.textContent = str;
    return tempDiv.innerHTML;
}

// 2. INITIALIZATION PIPELINE: Verifies session token and populates dashboard metadata
async function verifyAndInitializeDashboard() {
    // Collect active session parameters from local browser vault
    const sessionToken = localStorage.getItem('nexusAuthToken');
    const userId = localStorage.getItem('nexusUserId');

    // SECURITY CHECK: If no credentials exist, intercept instantly and bounce to login.html
    if (!sessionToken || !userId) {
        console.warn("🔒 Unauthorized console access detected. Evicting session state.");
        localStorage.clear();
        window.location.replace('login.html');
        return;
    }

    try {
        // Retrieve local environment database routing maps
        const configResponse = await fetch('./api/firebaseConfig');
        if (!configResponse.ok) throw new Error("Backend connection handshake dropped.");
        const firebaseConfig = await configResponse.json();

        // Establish core configuration map variables with standard project fallback mapping
        const databaseUrl = firebaseConfig.databaseURL || 'https://nexuspro-cf948-default-rtdb.europe-west1.firebasedatabase.app';
        const cleanDbUrl = databaseUrl.replace(/\/$/, "");

        // AUTHENTICATED FETCH: Appends the cryptographically secure token using REST query notation (?auth=)
        // This satisfies your database rules: ".read": "auth != null && auth.uid === $uid"
        const userFetchResponse = await fetch(`${cleanDbUrl}/users/${userId}.json?auth=${sessionToken}`);
        
        if (!userFetchResponse.ok) {
            throw new Error(`Database connection rejected with status: ${userFetchResponse.status}`);
        }

        const profileData = await userFetchResponse.json();

        // FAILSAFE HOOK: Handle initialization edge cases for brand new accounts
        const finalProfile = profileData || {
            name: "New Scholar",
            role: "student",
            status: "active",
            gameMetrics: { totalXP: 0, currentLevel: 1 }
        };

        // ENFORCED SUSPENSION MATRIX: Instantly kick out banned accounts
        if (finalProfile.status === 'suspended' || finalProfile.status === 'banned') {
            alert("🔒 Access Terminated: This account has been flagged and suspended.");
            localStorage.clear();
            window.location.replace('login.html');
            return;
        }

        // 3. UI RENDERING AND POPULATION LAYER
        const cleanName = sanitizeString(finalProfile.name);
        const cleanRole = sanitizeString(finalProfile.role || "student");

        // Welcome Header Greeting Update
        const welcomeHeading = document.getElementById('welcomeHeading');
        if (welcomeHeading) {
            welcomeHeading.innerHTML = `Welcome Back, ${cleanName}!`;
        }
        
        // Dynamically style UI badges based on internal user role authorizations
        const roleBadge = document.getElementById('roleBadge');
        if (roleBadge) {
            roleBadge.innerText = cleanRole;
            
            if (cleanRole === 'admin') {
                roleBadge.className = "px-2.5 py-1 text-xs font-bold uppercase rounded-md bg-red-950 text-red-400 border border-red-900/40 tracking-wider";
                // Unhide advanced administrative features
                document.getElementById('adminSection')?.classList.remove('hidden');
                document.getElementById('sidebarAdminLinks')?.classList.remove('hidden');
            } else {
                roleBadge.className = "px-2.5 py-1 text-xs font-bold uppercase rounded-md bg-blue-950 text-blue-400 border border-blue-900/40 tracking-wider";
                // Keep admin layout blocks hidden away from students
                document.getElementById('adminSection')?.classList.add('hidden');
                document.getElementById('sidebarAdminLinks')?.classList.add('hidden');
            }
        }

        // 4. GAMIFICATION SYSTEMS MODEL LOOKUP
        if (finalProfile.gameMetrics) {
            const currentXp = parseInt(finalProfile.gameMetrics.totalXP || 0);
            const currentLevel = parseInt(finalProfile.gameMetrics.currentLevel || 1);

            if (document.getElementById('userXpText')) document.getElementById('userXpText').innerText = `${currentXp.toLocaleString()} XP`;
            if (document.getElementById('userLevelText')) document.getElementById('userLevelText').innerText = `Level ${currentLevel}`;
        }
        
        // Clear layout state blocks
        document.getElementById('xpBadge')?.classList.remove('hidden');
        document.getElementById('xpBadge')?.classList.add('flex');
        document.getElementById('levelBox')?.classList.remove('hidden');

        // Initialized successfully. Drop loader layer.
        clearPreloaderOverlay();

    } catch (criticalError) {
        console.error("❌ Dashboard Thread Fault Intercepted:", criticalError.message);
        
        // EMERGENCY LOCAL SAFE-PATH ROUTING WAYPOINT:
        // If server data lookup breaks or stalls out, don't execute an endless redirect loop. 
        // Read fallback metrics out of localStorage cache variables to provide a structural safety web.
        const cachedRole = localStorage.getItem('nexusUserRole') || 'student';
        
        const welcomeHeading = document.getElementById('welcomeHeading');
        if (welcomeHeading) {
            welcomeHeading.innerHTML = "Welcome to Nexus Pro Console (Offline Sync Mode)";
        }
        
        const roleBadge = document.getElementById('roleBadge');
        if (roleBadge) {
            roleBadge.innerText = cachedRole;
            roleBadge.className = "px-2.5 py-1 text-xs font-bold uppercase rounded-md bg-amber-950 text-amber-400 border border-amber-900/40";
        }
        
        clearPreloaderOverlay();
    }
}

// 5. SCREEN TRANSITION ENGINE: Safely transitions animations out of loading screens
function clearPreloaderOverlay() {
    const loaderMask = document.getElementById('nexusPreloader') || document.getElementById('uploadPreloader');
    if (!loaderMask) return;

    loaderMask.classList.add('opacity-0', 'pointer-events-none');
    setTimeout(() => {
        loaderMask.remove();
    }, 450);
}

// 6. SESSION DESTRUCTION STRATEGY: Safely evicts local arrays and flags back home
function executeLogoutSequence() {
    if (confirm("Are you sure you want to end your active session on Nexus Pro?")) {
        localStorage.clear();
        window.location.replace('login.html');
    }
}

// 7. RUNTIME ENTRY EVENT HOOK LOOP
document.addEventListener("DOMContentLoaded", () => {
    // Bind operational components to specific UI targets
    document.getElementById('logoutBtn')?.addEventListener('click', executeLogoutSequence);
    document.getElementById('sidebarLogoutBtn')?.addEventListener('click', executeLogoutSequence);
    
    // Fire up initialization core routine
    verifyAndInitializeDashboard();
});
