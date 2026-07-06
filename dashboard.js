/**
 * Nexus Pro 2.0 - Core Dashboard Management Engine (Ultra-Resilient Speed Stack)
 * File: dashboard.js
 */

function sanitizeString(str) {
    if (!str) return '';
    const tempDiv = document.createElement('div');
    tempDiv.textContent = str;
    return tempDiv.innerHTML;
}

async function verifyAndInitializeDashboard() {
    const userId = localStorage.getItem('nexusUserId');
    const secureToken = localStorage.getItem('nexusAuthToken');

    // Emergency escape: if no session, clean out and drop back to login
    if (!userId || !secureToken) {
        executeHardLogout();
        return;
    }

    // Set a strict 1-second timeout for the backend serverless fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000);

    try {
        // Try the secure Vercel API endpoint first
        const response = await fetch(`/api/profile?userId=${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${secureToken}`,
                'Content-Type': 'application/json'
            },
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) throw new Error("API Route missing or offline.");
        const result = await response.json();
        if (!result.success) throw new Error(result.message);
        
        renderDashboardView(result);

    } catch (criticalError) {
        console.warn("API Endpoint slow or missing. Switching to direct database fallback...", criticalError.message);
        clearTimeout(timeoutId);

        // FALLBACK: Directly query the Firebase RTDB if the local server api is down
        try {
            const dbFallbackUrl = `https://nexuspro-cf948-default-rtdb.europe-west1.firebasedatabase.app/users/${userId}.json?auth=${secureToken}`;
            const fallbackResponse = await fetch(dbFallbackUrl);
            
            if (fallbackResponse.ok) {
                const fbData = await fallbackResponse.json();
                if (fbData) {
                    renderDashboardView({
                        success: true,
                        name: fbData.name || "Scholar",
                        role: fbData.role || "student",
                        status: fbData.status || "active",
                        gameMetrics: fbData.gameMetrics || { totalXP: 0, currentLevel: 1 }
                    });
                    return;
                }
            }
        } catch (fbError) {
            console.error("Direct fallback failed as well:", fbError.message);
        }

        // LAST RESORT FAILSAFE: Force lookups visually open instead of locking the screen
        const welcomeHeading = document.getElementById('welcomeHeading');
        if (welcomeHeading) welcomeHeading.innerHTML = "Welcome to Nexus Workspace!";
        document.getElementById('userContentSection')?.classList.remove('hidden');
    } finally {
        // ESSENTIAL: Drop the loading preloader immediately 
        clearPreloaderOverlay();
    }
}

// Separate UI rendering layer for optimal execution speed
function renderDashboardView(profileData) {
    if (profileData.status === 'suspended' || profileData.status === 'banned') {
        alert("🔒 Access privileges revoked.");
        executeHardLogout();
        return;
    }

    const cleanName = sanitizeString(profileData.name);
    const cleanRole = sanitizeString(profileData.role).toLowerCase().trim();

    const welcomeHeading = document.getElementById('welcomeHeading');
    if (welcomeHeading) welcomeHeading.innerHTML = `Welcome Back, ${cleanName}!`;
    
    const roleBadge = document.getElementById('roleBadge');
    if (roleBadge) {
        roleBadge.innerText = cleanRole;
        
        if (cleanRole === 'admin') {
            roleBadge.className = "px-2.5 py-1 text-xs font-bold uppercase rounded-md bg-red-950 text-red-400 border border-red-900/40";
            document.getElementById('adminSection')?.classList.remove('hidden');
            document.getElementById('sidebarAdminLinks')?.classList.remove('hidden');
            document.getElementById('userContentSection')?.classList.add('hidden'); 
        } else {
            roleBadge.className = "px-2.5 py-1 text-xs font-bold uppercase rounded-md bg-blue-950 text-blue-400 border border-blue-900/40";
            document.getElementById('adminSection')?.classList.add('hidden');
            document.getElementById('sidebarAdminLinks')?.classList.add('hidden');
            document.getElementById('userContentSection')?.classList.remove('hidden');
        }
    }

    if (profileData.gameMetrics && cleanRole !== 'admin') {
        const currentXp = parseInt(profileData.gameMetrics.totalXP || 0);
        const currentLevel = parseInt(profileData.gameMetrics.currentLevel || 1);
        if (document.getElementById('userXpText')) document.getElementById('userXpText').innerText = `${currentXp.toLocaleString()} XP`;
        if (document.getElementById('userLevelText')) document.getElementById('userLevelText').innerText = `Level ${currentLevel}`;
    }
}

function clearPreloaderOverlay() {
    const loaderMask = document.getElementById('nexusPreloader');
    if (!loaderMask) return;
    
    loaderMask.classList.add('opacity-0', 'scale-98', 'pointer-events-none');
    setTimeout(() => { loaderMask.remove(); }, 1500); 
}

function executeHardLogout() {
    localStorage.clear();
    window.location.replace('login.html');
}

document.addEventListener("DOMContentLoaded", () => {
    // Force a failsafe backup drop of preloader if anything locks completely up for more than 2 seconds
    setTimeout(clearPreloaderOverlay, 2000);

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
