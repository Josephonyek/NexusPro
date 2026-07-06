/**
 * Nexus Pro 2.0 - Core Dashboard Management Engine (Secured & Optimized Stack)
 * File: dashboard.js
 */

// Data cleansing to protect layout layers against raw text script injections
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

    // If there is no active token session, immediately return them to security checkpoint
    if (!userId || !secureToken) {
        executeHardLogout();
        return;
    }

    try {
        // SECURE ARCHITECTURE REROUTE: Instead of parsing database keys on client-side, 
        // we request authorization metrics from our private backend relay endpoint.
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

        // Account status enforcement check
        if (finalProfile.status === 'suspended' || finalProfile.status === 'banned') {
            alert("🔒 Access privileges revoked. This account has been flagged.");
            executeHardLogout();
            return;
        }

        const cleanName = sanitizeString(finalProfile.name);
        const cleanRole = sanitizeString(finalProfile.role);

        // Populate header greeting data node
        const welcomeHeading = document.getElementById('welcomeHeading');
        if (welcomeHeading) welcomeHeading.innerHTML = `Welcome Back, ${cleanName}!`;
        
        // STRICT DYNAMIC ROLE VISIBILITY AND MATRIX CHECK
        const roleBadge = document.getElementById('roleBadge');
        if (roleBadge) {
            roleBadge.innerText = cleanRole;
            
            if (cleanRole === 'admin') {
                // Style the badge red for Admin status
                roleBadge.className = "px-2.5 py-1 text-xs font-bold uppercase rounded-md bg-red-950 text-red-400 border border-red-900/40";
                
                // REVEAL ALL CHANNELS: Admins see the structural student tiles AND the systems panel
                document.getElementById('adminSection')?.classList.remove('hidden');
                document.getElementById('sidebarAdminLinks')?.classList.remove('hidden');
                document.getElementById('userContentSection')?.classList.remove('hidden'); 
            } else {
                // Style the badge blue for Student status
                roleBadge.className = "px-2.5 py-1 text-xs font-bold uppercase rounded-md bg-blue-950 text-blue-400 border border-blue-900/40";
                
                // LOCK CONTROLS: Completely hide administrative panels from standard students
                document.getElementById('adminSection')?.classList.add('hidden');
                document.getElementById('sidebarAdminLinks')?.classList.add('hidden');
                document.getElementById('userContentSection')?.classList.remove('hidden');
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
        // Fail-safe default text so screen never locks up on slow network environments
        const welcomeHeading = document.getElementById('welcomeHeading');
        if (welcomeHeading) welcomeHeading.innerHTML = "Welcome to Nexus Workspace!";
    } finally {
        // Smoothly drop the fast skeleton animation preloader layer mask
        clearPreloaderOverlay();
    }
}

// High-speed preloader collapse transition handler
function clearPreloaderOverlay() {
    const loaderMask = document.getElementById('nexusPreloader');
    if (!loaderMask) return;
    
    // Combine opacity fade with micro-scale compression for high performance snapping feel
    loaderMask.classList.add('opacity-0', 'scale-98', 'pointer-events-none');
    setTimeout(() => { 
        loaderMask.remove(); 
    }, 200); // 200ms snappy teardown delay
}

// Clear browser tracking storage cache and kick to gateway route
function executeHardLogout() {
    localStorage.clear();
    window.location.replace('login.html');
}

// HANDLE DYNAMIC DOM INTERACTIONS AND LISTENERS
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

    // Toggle navigation drawer controls
    menuToggleBtn?.addEventListener('click', openMobileMenu);
    menuCloseBtn?.addEventListener('click', closeMobileMenu);
    mobileMenuOverlay?.addEventListener('click', closeMobileMenu);

    // Auto close menu when navigating links
    document.querySelectorAll('.mobile-link').forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });

    // Sign out event listener tracking loops
    document.getElementById('logoutBtn')?.addEventListener('click', () => { 
        if (confirm("Sign out of Nexus Pro?")) executeHardLogout(); 
    });
    document.getElementById('sidebarLogoutBtn')?.addEventListener('click', () => { 
        if (confirm("Sign out of Nexus Pro?")) executeHardLogout(); 
    });

    // Run verification initialization thread
    verifyAndInitializeDashboard();
});
