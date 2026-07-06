/**
 * Nexus Pro 2.0 - Core Dashboard Management Engine (Secured Backend Core Mapping)
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

    if (!userId || !secureToken) {
        executeHardLogout();
        return;
    }

    try {
        const response = await fetch(`/api/profile?userId=${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${secureToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) throw new Error("Security verification rejection.");
        const result = await response.json();

        if (!result.success) throw new Error(result.message);
        const finalProfile = result;

        if (finalProfile.status === 'suspended' || finalProfile.status === 'banned') {
            alert("🔒 Access privileges revoked.");
            executeHardLogout();
            return;
        }

        const cleanName = sanitizeString(finalProfile.name);
        const cleanRole = sanitizeString(finalProfile.role).toLowerCase().trim();

        const welcomeHeading = document.getElementById('welcomeHeading');
        if (welcomeHeading) welcomeHeading.innerHTML = `Welcome Back, ${cleanName}!`;
        
        const roleBadge = document.getElementById('roleBadge');
        if (roleBadge) {
            roleBadge.innerText = cleanRole;
            
            // ROLE CONTROL MATRIX VISIBILITY TOGGLE
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

        if (finalProfile.gameMetrics && cleanRole !== 'admin') {
            const currentXp = parseInt(finalProfile.gameMetrics.totalXP || 0);
            const currentLevel = parseInt(finalProfile.gameMetrics.currentLevel || 1);
            if (document.getElementById('userXpText')) document.getElementById('userXpText').innerText = `${currentXp.toLocaleString()} XP`;
            if (document.getElementById('userLevelText')) document.getElementById('userLevelText').innerText = `Level ${currentLevel}`;
        }

    } catch (criticalError) {
        console.error("Dashboard Engine Fallback Active:", criticalError.message);
        const welcomeHeading = document.getElementById('welcomeHeading');
        if (welcomeHeading) welcomeHeading.innerHTML = "Welcome to Nexus Workspace!";
        
        document.getElementById('userContentSection')?.classList.remove('hidden');
    } finally {
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
