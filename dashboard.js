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

    // SPEED OPTIMIZATION: Instant visual placeholder setup while network request runs
    const cachedRole = (localStorage.getItem('nexusUserRole') || 'student').toLowerCase().trim();
    applyFastLayoutPresets(cachedRole, userId);

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

        const cleanName = sanitizeString(userData.name || userId.split('@')[0] || "Scholar");
        const cleanRole = sanitizeString(userData.role || "student").toLowerCase().trim();

        // Sync local storage state to cache for next ultra-fast login
        localStorage.setItem('nexusUserRole', userData.role || "Student");

        // UI Injection of finalized data assets
        const welcomeHeading = document.getElementById('welcomeHeading');
        if (welcomeHeading) welcomeHeading.innerHTML = `Welcome Back, ${cleanName}!`;

        const userNameLabel = document.getElementById('userNameLabel');
        if (userNameLabel) userNameLabel.innerText = cleanName;

        const userAvatar = document.getElementById('userAvatar');
        if (userAvatar) userAvatar.innerText = cleanRole.substring(0, 2).toUpperCase();

        const userRoleLabel = document.getElementById('userRoleLabel');
        if (userRoleLabel) userRoleLabel.innerText = userData.role || "Student";

        // Accurate Role Checking Adjustments post-fetch
        evaluateStrictRoleRouting(cleanRole);

    } catch (criticalError) {
        console.error("Critical Dashboard Initialization Failure:", criticalError.message);
        if (criticalError.message.includes("auth") || criticalError.message.includes("permission")) {
            executeHardLogout();
        }
    }
}

// FAST CACHE RENDERING ENGINE: Sets basic look before fetch finishes
function applyFastLayoutPresets(role, userId) {
    const fallbackName = userId.split('@')[0] || "Scholar";
    
    const welcomeHeading = document.getElementById('welcomeHeading');
    if (welcomeHeading) welcomeHeading.innerHTML = `Welcome Back, ${fallbackName}...`;
    
    const userNameLabel = document.getElementById('userNameLabel');
    if (userNameLabel) userNameLabel.innerText = fallbackName;

    evaluateStrictRoleRouting(role);
}

// Separate UI adjustments logic for performance execution loops
function evaluateStrictRoleRouting(role) {
    const dashboardMainTitle = document.getElementById('dashboardMainTitle');
    const dashboardSubTitle = document.getElementById('dashboardSubTitle');
    const systemStatusLabel = document.getElementById('systemStatusLabel');

    if (role === 'admin') {
        if (dashboardMainTitle) dashboardMainTitle.innerText = "HQ Administrative Control Console";
        if (dashboardSubTitle) dashboardSubTitle.innerText = "Global systems tracking suites & access overrides";
        if (systemStatusLabel) {
            systemStatusLabel.innerText = "Root Access Online";
            systemStatusLabel.className = "text-[10px] font-extrabold uppercase tracking-widest text-amber-400";
        }
        document.getElementById('sidebarStudentLinks')?.classList.add('hidden');
        document.getElementById('sidebarAdminLinks')?.classList.remove('hidden');
        if (typeof switchTab === 'function') switchTab('admin-suite');
    } else {
        if (dashboardMainTitle) dashboardMainTitle.innerText = "Command Console";
        if (dashboardSubTitle) dashboardSubTitle.innerText = "Manage your academic pipeline and integration tools";
        if (systemStatusLabel) {
            systemStatusLabel.innerText = "Database Active";
            systemStatusLabel.className = "text-[10px] font-extrabold uppercase tracking-widest text-neutral-400";
        }
        document.getElementById('sidebarStudentLinks')?.classList.remove('hidden');
        document.getElementById('sidebarAdminLinks')?.classList.add('hidden');
        if (typeof switchTab === 'function') switchTab('curriculum');
    }
}

function clearPreloaderOverlay() {
    const loaderMask = document.getElementById('nexusPreloader');
    if (!loaderMask) return;
    
    loaderMask.classList.add('opacity-0', 'scale-98', 'pointer-events-none');
    setTimeout(() => { loaderMask.remove(); }, 150); // Cut timing delay down
}

function executeHardLogout() {
    localStorage.clear();
    window.location.replace('login.html');
}

document.addEventListener("DOMContentLoaded", () => {
    // HIGH-SPEED INTERACTIVE PRELOADER DROP: Kill mask instantly as DOM prints
    clearPreloaderOverlay();

    // HAMBURGER MENU FUNCTIONAL CODE LOGIC
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sidebarMenu = document.getElementById('sidebarMenu');

    if (hamburgerBtn && sidebarMenu) {
        hamburgerBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            sidebarMenu.classList.toggle('hidden');
        });

        document.addEventListener('click', (event) => {
            if (window.innerWidth < 768 && !sidebarMenu.classList.contains('hidden')) {
                if (!sidebarMenu.contains(event.target) && event.target !== hamburgerBtn) {
                    sidebarMenu.classList.add('hidden');
                }
            }
        });
    }

    // Global Logout Trigger Execution 
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => { 
            if (confirm("Sign out of Nexus Pro?")) {
                executeHardLogout(); 
            }
        });
    }

    verifyAndInitializeDashboard();
});
