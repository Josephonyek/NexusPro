/**
 * Nexus Pro 2.0 - Core Dashboard Management Engine (Optimized Stack)
 */

const FIREBASE_CONFIG = {
    apiKey: "AIzaSyDbt1wfOLhRls_JG2ysysfHvqRBL8LRpBI",
    databaseURL: "https://nexuspro-cf948-default-rtdb.europe-west1.firebasedatabase.app"
};

function sanitizeString(str) {
    if (!str) return '';
    const tempDiv = document.createElement('div');
    tempDiv.textContent = str;
    return tempDiv.innerHTML;
}

async function verifyAndInitializeDashboard() {
    const userId = localStorage.getItem('nexusUserId');
    const secureToken = localStorage.getItem('nexusAuthToken');
    const cachedRole = localStorage.getItem('nexusUserRole') || 'student';

    if (!userId || !secureToken) {
        executeHardLogout();
        return;
    }

    try {
        const dbUrl = FIREBASE_CONFIG.databaseURL.replace(/\/$/, "");
        const response = await fetch(`${dbUrl}/users/${userId}.json?auth=${secureToken}`);
        
        if (!response.ok) throw new Error(`Database authentication failure`);
        const profileData = await response.json();

        const finalProfile = profileData || {
            name: "Scholar",
            role: cachedRole,
            status: "active",
            gameMetrics: { totalXP: 0, currentLevel: 1 }
        };

        if (finalProfile.status === 'suspended' || finalProfile.status === 'banned') {
            alert("🔒 Access privileges revoked.");
            executeHardLogout();
            return;
        }

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
            }
        }

        if (finalProfile.gameMetrics) {
            const currentXp = parseInt(finalProfile.gameMetrics.totalXP || 0);
            const currentLevel = parseInt(finalProfile.gameMetrics.currentLevel || 1);
            if (document.getElementById('userXpText')) document.getElementById('userXpText').innerText = `${currentXp.toLocaleString()} XP`;
            if (document.getElementById('userLevelText')) document.getElementById('userLevelText').innerText = `Level ${currentLevel}`;
        }

    } catch (criticalError) {
        console.error("Dashboard Engine Fallback Active:", criticalError.message);
        const welcomeHeading = document.getElementById('welcomeHeading');
        if (welcomeHeading) welcomeHeading.innerHTML = "Welcome to Nexus Workspace!";
    } finally {
        clearPreloaderOverlay();
    }
}

function clearPreloaderOverlay() {
    const loaderMask = document.getElementById('nexusPreloader');
    if (!loaderMask) return;
    
    loaderMask.classList.add('opacity-0', 'scale-98', 'pointer-events-none');
    setTimeout(() => { 
        loaderMask.remove(); 
    }, 200);
}

function executeHardLogout() {
    localStorage.clear();
    window.location.replace('login.html');
}

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
        }, 200);
    }

    menuToggleBtn?.addEventListener('click', openMobileMenu);
    menuCloseBtn?.addEventListener('click', closeMobileMenu);
    mobileMenuOverlay?.addEventListener('click', closeMobileMenu);

    document.querySelectorAll('.mobile-link').forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });

    document.getElementById('logoutBtn')?.addEventListener('click', () => { if (confirm("Sign out of Nexus Pro?")) executeHardLogout(); });
    document.getElementById('sidebarLogoutBtn')?.addEventListener('click', () => { if (confirm("Sign out of Nexus Pro?")) executeHardLogout(); });

    verifyAndInitializeDashboard();
});
