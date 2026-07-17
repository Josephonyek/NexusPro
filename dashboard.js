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

        const cleanName = sanitizeString(userData.name || userId.split('@')[0] || "Scholar");
        const cleanRole = sanitizeString(userData.role || "student").toLowerCase().trim();

        // Sync local storage state to remain authentic with the server
        localStorage.setItem('nexusUserRole', userData.role || "Student");

        // Update Interface Labels matching HTML elements
        const userNameLabel = document.getElementById('userNameLabel');
        if (userNameLabel) userNameLabel.innerText = cleanName;

        const dashboardMainTitle = document.getElementById('dashboardMainTitle');
        const dashboardSubTitle = document.getElementById('dashboardSubTitle');
        const systemStatusLabel = document.getElementById('systemStatusLabel');
        const userAvatar = document.getElementById('userAvatar');

        if (userAvatar) userAvatar.innerText = cleanRole.substring(0, 2).toUpperCase();

        // STRICT ROLE ENGINE AND CONTENT MATRIX INTERFACE ROUTING
        const userRoleLabel = document.getElementById('userRoleLabel');
        if (userRoleLabel) {
            userRoleLabel.innerText = userData.role || "Student";
            
            if (cleanRole === 'admin') {
                // Adjust text tokens to Admin Context
                if (dashboardMainTitle) dashboardMainTitle.innerText = "HQ Administrative Control Console";
                if (dashboardSubTitle) dashboardSubTitle.innerText = "Global systems tracking suites & access overrides";
                if (systemStatusLabel) {
                    systemStatusLabel.innerText = "Root Access Online";
                    systemStatusLabel.className = "text-[10px] font-extrabold uppercase tracking-widest text-amber-400";
                }

                // Show Admin Navigation Elements & Hide Student Sections
                document.getElementById('nav-header-student')?.classList.add('hidden');
                document.getElementById('nav-header-admin')?.classList.remove('hidden');
                document.getElementById('btn-admin-suite')?.classList.remove('hidden');
                
                // Route automatically to the Admin view panel
                if (typeof switchTab === 'function') {
                    switchTab('admin-suite');
                }
            } else {
                // Student Context Settings
                if (dashboardMainTitle) dashboardMainTitle.innerText = "Command Console";
                if (dashboardSubTitle) dashboardSubTitle.innerText = "Manage your academic pipeline and integration tools";
                if (systemStatusLabel) {
                    systemStatusLabel.innerText = "Database Active";
                    systemStatusLabel.className = "text-[10px] font-extrabold uppercase tracking-widest text-neutral-400";
                }

                document.getElementById('nav-header-student')?.classList.remove('hidden');
                document.getElementById('nav-header-admin')?.classList.add('hidden');
                document.getElementById('btn-admin-suite')?.classList.add('hidden');
                
                if (typeof switchTab === 'function') {
                    switchTab('curriculum');
                }
            }
        }

    } catch (criticalError) {
        console.error("Critical Dashboard Initialization Failure:", criticalError.message);
        // Direct redirect if database signals an explicit expired or altered auth token structure
        if (criticalError.message.includes("auth") || criticalError.message.includes("permission")) {
            executeHardLogout();
        }
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
    // Failsafe backup to drop the loader if network conditions stall out completely
    setTimeout(clearPreloaderOverlay, 2500);

    // HAMBURGER MENU ENGINE CONTROLS
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sidebarMenu = document.getElementById('sidebarMenu');

    if (hamburgerBtn && sidebarMenu) {
        hamburgerBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            sidebarMenu.classList.toggle('hidden');
        });

        // Close menu automatically when clicking anywhere else on the interface workspace
        document.addEventListener('click', (event) => {
            if (window.innerWidth < 768 && !sidebarMenu.classList.contains('hidden')) {
                if (!sidebarMenu.contains(event.target) && event.target !== hamburgerBtn) {
                    sidebarMenu.classList.add('hidden');
                }
            }
        });
    }

    // Global Logout Binding Trigger
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
