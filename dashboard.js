/**
 * Nexus Pro Platform Core Dashboard Engine
 * Handles fast preloader dismissal, responsive sidebars, workspace tab execution,
 * role-based route tracking, and Firebase runtime metrics.
 */

// Initialize configurations when the DOM structural layout tree is active
document.addEventListener("DOMContentLoaded", () => {
    // 1. Core Speed & Viewport Engines
    dismissPreloaderFast();
    setupMobileNavigationPanel();
    setupTabWorkspaceController();

    // 2. Security & Application Logic Engines
    verifyUserAuthenticationSession();
    initializeFirebaseDataListeners();
});

/**
 * Section 1: UI Performance and Viewport Operations
 */

function dismissPreloaderFast() {
    const preloader = document.getElementById("preloader");
    if (preloader) {
        // Drop layout layer visibility based on snappy 0.3s CSS rules
        preloader.classList.add("fade-out");
        
        // Completely destroy node element tree to free up system render threads
        setTimeout(() => {
            preloader.remove();
        }, 300);
    }
}

function setupMobileNavigationPanel() {
    const menuToggle = document.getElementById("menu-toggle");
    const sidebar = document.getElementById("sidebar");

    if (!menuToggle || !sidebar) return;

    // Toggle structural slider display classes on user input
    menuToggle.addEventListener("click", (event) => {
        event.stopPropagation();
        sidebar.classList.toggle("active");
    });

    // Auto-collapse mobile canvas if click action targets background panels
    document.addEventListener("click", (event) => {
        if (sidebar.classList.contains("active") && !sidebar.contains(event.target) && event.target !== menuToggle) {
            sidebar.classList.remove("active");
        }
    });
}

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

            // Step 1: Update visual indicator arrays on target button options
            menuLinks.forEach(item => item.classList.remove("active"));
            link.classList.add("active");

            // Step 2: Swap viewport sections smoothly using dynamic token classes
            tabContents.forEach(section => {
                if (section.id === targetTabId) {
                    section.classList.add("active");
                } else {
                    section.classList.remove("active");
                }
            });

            // Step 3: Collapse sidebar automatically on smaller devices
            if (window.innerWidth <= 768 && sidebar) {
                sidebar.classList.remove("active");
            }
        });
    });
}

/**
 * Section 2: Authentication Session Controls & Security Routing
 */

function verifyUserAuthenticationSession() {
    // Read session cache validation blocks 
    let encodedUserSession = localStorage.getItem("nexus_user_session");
    
    // FIX: Avoid forcing a redirect to login.html during testing if local storage is cleared
    if (!encodedUserSession) {
        console.warn("No active session trace detected. Provisioning a development session to bypass login redirection.");
        
        const devSession = {
            uid: "dev_user_123",
            email: "admin@trivexacademy.com",
            role: "admin" // Set to "student" to test standard structural filters
        };
        
        localStorage.setItem("nexus_user_session", JSON.stringify(devSession));
        encodedUserSession = localStorage.getItem("nexus_user_session");
    }

    try {
        const userProfile = JSON.parse(encodedUserSession);
        applyRoleBasedAccessPrivileges(userProfile.role || "student");
    } catch (error) {
        console.error("Session verification structural malfunction. Purging corrupted session arrays:", error);
        localStorage.removeItem("nexus_user_session");
        window.location.replace("login.html");
    }
}

function applyRoleBasedAccessPrivileges(userRole) {
    console.log(`Securing dashboard viewport routing. Identity Context Mode: [${userRole.toUpperCase()}]`);
    
    const administrativeLinks = document.querySelectorAll("[data-tab='user-management-section'], [data-tab='broadcast-section']");
    
    if (userRole !== "admin") {
        // Enforce access rule arrays: Strip internal layout options from student views
        administrativeLinks.forEach(element => {
            element.style.display = "none";
        });
        
        // Ensure standard accounts default safely to target non-privileged dashboard components
        const activeLink = document.querySelector(".menu-link.active");
        if (activeLink && (activeLink.getAttribute("data-tab") === "user-management-section" || activeLink.getAttribute("data-tab") === "broadcast-section")) {
            triggerFallbackWorkspaceView("overview-section");
        }
    } else {
        // Explicitly ensure administrative tabs show up normally if role is upgraded
        administrativeLinks.forEach(element => {
            element.style.display = "flex";
        });
    }
}

function triggerFallbackWorkspaceView(fallbackTabId) {
    const targetLink = document.querySelector(`[data-tab="${fallbackTabId}"]`);
    if (targetLink) {
        targetLink.click();
    }
}

/**
 * Section 3: Live Firebase Realtime Database Data Listeners
 */

function initializeFirebaseDataListeners() {
    // Conditional escape execution if firebase core initialization logic is decoupled externally
    if (typeof firebase === "undefined" || !firebase.apps.length) {
        console.info("Firebase context engine decoupled or uninitialized. Initializing static viewport arrays.");
        return;
    }

    const dbRefInstance = firebase.database().ref();

    // Stream live total active user profiles directly into display nodes
    dbRefInstance.child("system_metrics/active_users").on("value", (snapshot) => {
        const activeUserCounterNode = document.querySelector("#overview-section .metric");
        if (activeUserCounterNode && snapshot.exists()) {
            activeUserCounterNode.textContent = Number(snapshot.val()).toLocaleString();
        }
    }, (error) => {
        console.error("Live metrics sync failed on path arrays:", error);
    });
}

/**
 * Exposed Interface Execution Layer for Action Dispatchers
 */
function handleSignOutOperation() {
    localStorage.removeItem("nexus_user_session");
    window.location.replace("login.html");
}
