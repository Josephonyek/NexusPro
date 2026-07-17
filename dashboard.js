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

        // Update Welcome Banner Greeting & Profile Elements
        const welcomeHeading = document.getElementById('welcomeHeading');
        if (welcomeHeading) welcomeHeading.innerHTML = `Welcome Back, ${cleanName}!`;

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
                // Adjust context metadata for Admin view
                if (dashboardMainTitle) dashboardMainTitle.innerText = "HQ Administrative Control Console";
                if (dashboardSubTitle) dashboardSubTitle.innerText = "Global systems tracking suites & access overrides";
                if (systemStatusLabel) {
                    systemStatusLabel.innerText = "Root Access Online";
                    systemStatusLabel.className = "text-[10px] font-extrabold uppercase tracking-widest text-amber-400";
                }

                // Show Admin-specific sections/links, hide standard student grouping
                document.getElementById('sidebarStudentLinks')?.classList.add('hidden');
                document.getElementById('sidebarAdminLinks')?.classList.remove('hidden');
                
                if (typeof switchTab === 'function') {
                    switchTab('admin-suite');
                }
            } else {
                // Adjust context metadata back to Student context
                if (dashboardMainTitle) dashboardMainTitle.innerText = "Command Console";
                if (dashboardSubTitle) dashboardSubTitle.innerText = "Manage your academic pipeline and integration tools";
                if (systemStatusLabel) {
                    systemStatusLabel.innerText = "Database Active";
                    systemStatusLabel.className = "text-[10px] font-extrabold uppercase tracking-widest text-neutral-400";
                }

                document.getElementById('sidebarStudentLinks')?.classList.remove('hidden');
                document.getElementById('sidebarAdminLinks')?.classList.add('hidden');
                
                if (typeof switchTab === 'function') {
                    switchTab('curriculum');
                }
            }
        }

    } catch (criticalError) {
        console.error("Critical Dashboard Initialization Failure:", criticalError.message);
        // Security fallback: clear local variables if token permissions fail on remote database check
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
    // Failsafe drop fallback loop
    setTimeout(clearPreloaderOverlay, 2500);

    // HAMBURGER MENU FUNCTIONAL CODE LOGIC
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sidebarMenu = document.getElementById('sidebarMenu');

    if (hamburgerBtn && sidebarMenu) {
        hamburgerBtn.addEventListener('click', (event) => {
            event.stopPropagation(); // Avoid triggering document hide event instantly
            sidebarMenu.classList.toggle('hidden');
        });

        // Click outside event handler to close navigation sidebar cleanly
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
