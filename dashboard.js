/**
 * Nexus Pro Platform Dashboard Engine
 * Handles high-speed DOM lifecycles and role-filtered visibility rules.
 */

document.addEventListener("DOMContentLoaded", () => {
    // 1. Performance UI Layers
    dismissPreloaderFast();
    setupMobileNavigationPanel();
    setupTabWorkspaceController();

    // 2. Security Identity Guard
    verifyUserAuthenticationSession();
});

/**
 * Drops the initial overlay instantly when page structure builds
 */
function dismissPreloaderFast() {
    const preloader = document.getElementById("preloader");
    if (preloader) {
        preloader.classList.add("fade-out");
        setTimeout(() => {
            preloader.remove();
        }, 300); // Destruction matches 0.3s fading transition
    }
}

/**
 * Standard slider navigation toggle mechanics for small/mobile layouts
 */
function setupMobileNavigationPanel() {
    const menuToggle = document.getElementById("menu-toggle");
    const sidebar = document.getElementById("sidebar");

    if (!menuToggle || !sidebar) return;

    menuToggle.addEventListener("click", (event) => {
        event.stopPropagation();
        sidebar.classList.toggle("active");
    });

    document.addEventListener("click", (event) => {
        if (sidebar.classList.contains("active") && !sidebar.contains(event.target) && event.target !== menuToggle) {
            sidebar.classList.remove("active");
        }
    });
}

/**
 * Handles container workspace swapping if any tabs are used locally
 */
function setupTabWorkspaceController() {
    const menuLinks = document.querySelectorAll(".menu-link");
    const tabContents = document.querySelectorAll(".tab-content");
    const sidebar = document.getElementById("sidebar");

    if (menuLinks.length === 0) return;

    menuLinks.forEach(link => {
        link.addEventListener("click", (event) => {
            event.preventDefault();
            
            const targetTabId = link.getAttribute("data-tab");
            if (!targetTabId) return;

            menuLinks.forEach(item => item.classList.remove("active"));
            link.classList.add("active");

            tabContents.forEach(section => {
                if (section.id === targetTabId) {
                    section.classList.add("active");
                } else {
                    section.classList.remove("active");
                }
            });

            if (window.innerWidth <= 768 && sidebar) {
                sidebar.classList.remove("active");
            }
        });
    });
}

/**
 * Validates browser authentication blocks to determine the role panel view
 */
function verifyUserAuthenticationSession() {
    let sessionData = localStorage.getItem("nexus_user_session");
    
    // Developer Sandbox Safety: Bypasses login.html redirection loop during local code testing
    if (!sessionData) {
        console.info("No session token identified. Provisioning placeholder dev admin token.");
        const localSessionTemplate = {
            uid: "dev_session_token",
            email: "admin@trivexacademy.com",
            role: "student" // Change this token property value to "admin" or "student" to preview roles instantly!
        };
        localStorage.setItem("nexus_user_session", JSON.stringify(localSessionTemplate));
        sessionData = localStorage.getItem("nexus_user_session");
    }

    try {
        const profile = JSON.parse(sessionData);
        enforceRoleContentPermissions(profile.role || "student");
    } catch (e) {
        console.error("Damaged session token tracking array. Cleaning environment.", e);
        localStorage.removeItem("nexus_user_session");
        window.location.replace("login.html");
    }
}

/**
 * Toggles structural layout components in the menu bar matching the current authorization permissions
 */
function enforceRoleContentPermissions(role) {
    const adminElements = document.querySelectorAll(".admin-controls");
    const studentElements = document.querySelectorAll(".student-controls");
    const mainContentArea = document.querySelector(".main-workspace");

    console.log(`Nexus Engine: Filtering workspaces for role profile: [${role.toUpperCase()}]`);

    // Clean out previous informational cards before running a rebuild configuration
    const existingNotice = document.getElementById("role-welcome-notice");
    if (existingNotice) existingNotice.remove();

    if (role === "admin") {
        // Hide student links, present administration shortcuts
        adminElements.forEach(el => el.style.display = "flex");
        studentElements.forEach(el => el.style.display = "none");
        
        // Isolate dynamic tab container elements
        document.querySelectorAll(".tab-content").forEach(view => view.style.display = "none");

        if (mainContentArea) {
            const adminCard = document.createElement("div");
            adminCard.id = "role-welcome-notice";
            adminCard.className = "content-card glass";
            adminCard.innerHTML = `
                <h2>Administrative Management Control Hub</h2>
                <p style="color:var(--text-muted); margin-top:10px;">Select a control module option from the left sidebar to open systems configurations.</p>
            `;
            mainContentArea.appendChild(adminCard);
        }
    } else {
        // Show student specific link bars, block admin operations
        adminElements.forEach(el => el.style.display = "none");
        studentElements.forEach(el => el.style.display = "flex");

        // Set the active workspace focus back onto local support container blocks
        const defaultSupportTab = document.getElementById("support-desk-tab");
        if (defaultSupportTab) defaultSupportTab.classList.add("active");

        if (mainContentArea) {
            const studentWelcomeCard = document.createElement("div");
            studentWelcomeCard.id = "role-welcome-notice";
            studentWelcomeCard.className = "content-card glass";
            studentWelcomeCard.innerHTML = `
                <h2>Welcome back to the Command Console</h2>
                <p style="color:var(--text-muted); margin-top:10px;">Use the menu links on your sidebar to access AI Study assets, your Academy E-Library books, and the Health Hub resources.</p>
            `;
            mainContentArea.insertBefore(studentWelcomeCard, mainContentArea.firstChild);
        }
    }
}

/**
 * Safely signs out the user session
 */
function handleSignOutAction() {
    localStorage.removeItem("nexus_user_session");
    window.location.replace("login.html");
        }
