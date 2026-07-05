/**
 * Nexus Pro 2.0 - Core Dashboard Management Engine
 */

const FIREBASE_CONFIG = {
    apiKey: "AIzaSyDbt1wfOLhRls_JG2ysysfHvqRBL8LRpBI",
    databaseURL: "https://nexuspro-cf948-default-rtdb.europe-west1.firebasedatabase.app"
};

// Data cleansing to protect layout layers against layout code injections
function sanitizeString(str) {
    if (!str) return '';
    const tempDiv = document.createElement('div');
    tempDiv.textContent = str;
    return tempDiv.innerHTML;
}

// Global UI Dashboard Controller Initialization Sequence
async function verifyAndInitializeDashboard() {
    const userId = localStorage.getItem('nexusUserId');
    const secureToken = localStorage.getItem('nexusAuthToken');
    const cachedRole = localStorage.getItem('nexusUserRole') || 'student';

    // If there is no active token session, immediately return them to security checkpoint
    if (!userId || !secureToken) {
        console.warn("Session verification token missing. Exiting to gateway.");
        executeHardLogout();
        return;
    }

    try {
        const dbUrl = FIREBASE_CONFIG.databaseURL.replace(/\/$/, "");

        // Securely fetch user data directly using the validated session token
        const response = await fetch(`${dbUrl}/users/${userId}.json?auth=${secureToken}`);
        
        if (!response.ok) throw new Error(`Database authentication failure: ${response.status}`);
        const profileData = await response.json();

        // FALLBACK MAPPING: If a newly signed-up profile hasn't fully propagated, provide a safe template
        const finalProfile = profileData || {
            name: "Scholar",
            role: cachedRole,
            status: "active",
            gameMetrics: { totalXP: 0, currentLevel: 1 }
        };

        if (finalProfile.status === 'suspended' || finalProfile.status === 'banned') {
            alert("🔒 Access privileges revoked. This account has been suspended.");
            executeHardLogout();
            return;
        }

        // Apply clean variables directly to DOM text points
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

        // Setup Gamification progression layers
        if (finalProfile.gameMetrics) {
            const currentXp = parseInt(finalProfile.gameMetrics.totalXP || 0);
            const currentLevel = parseInt(finalProfile.gameMetrics.currentLevel || 1);
            if (document.getElementById('userXpText')) document.getElementById('userXpText').innerText = `${currentXp.toLocaleString()} XP`;
            if (document.getElementById('userLevelText')) document.getElementById('userLevelText').innerText = `Level ${currentLevel}`;
        }

    } catch (criticalError) {
        console.error("Dashboard Engine Fallback Active:", criticalError.message);
        // Fail-safe visibility so screen never locks up on poor connections
        const welcomeHeading = document.getElementById('welcomeHeading');
        if (welcomeHeading) welcomeHeading.innerHTML = "Welcome to Nexus Workspace!";
    } finally {
        clearPreloaderOverlay();
    }
}

// Smoothly animation-fade out the modern skeleton preloader mask
function clearPreloaderOverlay() {
    const loaderMask = document.getElementById('nexusPreloader');
    if (!loaderMask) return;
    loaderMask.classList.add('opacity-0', 'pointer-events-none');
    setTimeout(() => { loaderMask.remove(); }, 500);
}

function executeHardLogout() {
    localStorage.clear();
    window.location.replace('login.html');
}

// INITIALIZE HAMBURGER MENU ACTIONS AND INTERFACES
document.addEventListener("DOMContentLoaded", () => {
    const menuToggleBtn = document.getElementById('menuToggleBtn');
    const menuCloseBtn = document.getElementById('menuCloseBtn');
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    const mobileSidebar = document.getElementById('mobileSidebar');

    function openMobileMenu() {
        mobileMenuOverlay.classList.remove('hidden');
        setTimeout(() => {
            mobileMenuOverlay.classList.remove('opacity-0');
            mobileSidebar.classList.remove('-translate-x-full');
        }, 10);
    }

    function closeMobileMenu() {
        mobileSidebar.classList.add('-translate-x-full');
        mobileMenuOverlay.classList.add('opacity-0');
        setTimeout(() => {
            mobileMenuOverlay.classList.add('hidden');
        }, 300);
    }

    menuToggleBtn?.addEventListener('click', openMobileMenu);
    menuCloseBtn?.addEventListener('click', closeMenuSequence);
    mobileMenuOverlay?.addEventListener('click', closeMenuSequence);

    // Auto close drawer when clicking any link inside it
    document.querySelectorAll('.mobile-link').forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });

    // Handle logout operations listeners
    document.getElementById('logoutBtn')?.addEventListener('click', () => { if (confirm("Sign out of Nexus Pro?")) executeHardLogout(); });
    document.getElementById('sidebarLogoutBtn')?.addEventListener('click', () => { if (confirm("Sign out of Nexus Pro?")) executeHardLogout(); });

    // Initialize execution run thread
    verifyAndInitializeDashboard();
});
