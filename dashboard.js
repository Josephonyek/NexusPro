/**
 * Nexus Pro 2.0 - Core Dashboard Management Engine (Direct Secure Database Integration)
 * File: dashboard.js
 */

const DB_BASE_URL = "https://nexuspro-cf948-default-rtdb.europe-west1.firebasedatabase.app";

function sanitizeString(str) {
    if (!str) return '';
    const tempDiv = document.createElement('div');
    tempDiv.textContent = str;
    return tempDiv.innerHTML;
}

async function verifyAndInitializeDashboard() {
    const userId = localStorage.getItem('nexusUserId');
    const secureToken = localStorage.getItem('nexusAuthToken');

    // Security Check: Kick unauthenticated sessions out instantly
    if (!userId || !secureToken) {
        executeHardLogout();
        return;
    }

    try {
        // Direct secure fetch using the user's secret token string
        const dbUrl = `${DB_BASE_URL}/users/${userId}.json?auth=${secureToken}`;
        const response = await fetch(dbUrl);
        
        if (!response.ok) throw new Error("Database network communication rejection.");
        const userData = await response.json();

        if (!userData) throw new Error("User profile node does not exist.");

        // Account Status Enforcement
        if (userData.status === 'suspended' || userData.status === 'banned') {
            alert("🔒 Access privileges revoked. This account has been flagged.");
            executeHardLogout();
            return;
        }

        const cleanName = sanitizeString(userData.name || "Scholar");
        const cleanRole = sanitizeString(userData.role || "student").toLowerCase().trim();

        // Update Interface Greeting
        const welcomeHeading = document.getElementById('welcomeHeading');
        if (welcomeHeading) welcomeHeading.innerHTML = `Welcome Back, ${cleanName}!`;
        
        // STRICT ROLE ENGINE AND CONTENT MATRIX INTERFACE ROUTING
        const roleBadge = document.getElementById('roleBadge');
        if (roleBadge) {
            roleBadge.innerText = cleanRole;
            
            if (cleanRole === 'admin') {
                roleBadge.className = "px-2.5 py-1 text-xs font-bold uppercase rounded-md bg-red-950 text-red-400 border border-red-900/40";
                
                // Show Admin Console & Navigation Links, Hide Student view completely
                document.getElementById('adminSection')?.classList.remove('hidden');
                document.getElementById('sidebarAdminLinks')?.classList.remove('hidden');
                document.getElementById('userContentSection')?.classList.add('hidden'); 
            } else {
                roleBadge.className = "px-2.5 py-1 text-xs font-bold uppercase rounded-md bg-blue-950 text-blue-400 border border-blue-900/40";
                
                // Show standard Student metrics, Lock secure Admin views away
                document.getElementById('adminSection')?.classList.add('hidden');
                document.getElementById('sidebarAdminLinks')?.classList.add('hidden');
                document.getElementById('userContentSection')?.classList.remove('hidden');
            }
        }

        // Gamification Processing for Student accounts
        if (userData.gameMetrics && cleanRole !== 'admin') {
            const currentXp = parseInt(userData.gameMetrics.totalXP || 0);
            const currentLevel = parseInt(userData.gameMetrics.currentLevel || 1);
            if (document.getElementById('userXpText')) document.getElementById('userXpText').innerText = `${currentXp.toLocaleString()} XP`;
            if (document.getElementById('userLevelText')) document.getElementById('userLevelText').innerText = `Level ${currentLevel}`;
        }

    } catch (criticalError) {
        console.error("Critical Dashboard Initialization Failure:", criticalError.message);
        // Fallback layout protection to prevent permanent screen freezing
        const welcomeHeading = document.getElementById('welcomeHeading');
        if (welcomeHeading) welcomeHeading.innerHTML = "Welcome to Nexus Workspace!";
        document.getElementById('userContentSection')?.classList.remove('hidden');
    } finally {
        // Drop preloader instantly now that database processing is complete
        clearPreloaderOverlay();
    }
}

function clearPreloaderOverlay() {
    const loaderMask = document.getElementById('nexusPreloader');
    if (!loaderMask) return;
    
    loaderMask.classList.add('opacity-0', 'scale-98', 'pointer-events-none');
    setTimeout(() => { loaderMask.remove(); }, 200); 
}

function executeHardLogout() {
    localStorage.clear();
    window.location.replace('login.html');
}

document.addEventListener("DOMContentLoaded", () => {
    // Failsafe backup to drop the loader if network conditions stall out completely
    setTimeout(clearPreloaderOverlay, 2500);

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
        setTimeout(() => { mobileMenuOverlay.classList.add('hidden'); }, 200);
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
