/**
 * Nexus Pro Console Lifecycle Driver
 */

document.addEventListener("DOMContentLoaded", () => {
    // Drop execution block preloader
    const loader = document.getElementById("preloader");
    if (loader) {
        loader.classList.add("fade-out");
        setTimeout(() => loader.remove(), 300);
    }

    // Interactive Hamburger Menu Mechanics
    setupMasterHamburgerDropdown();

    // Authenticate and mount content configurations
    evaluateConsoleIdentitySession();
});

/**
 * Toggles visibility states for the global drawer overlay
 */
function setupMasterHamburgerDropdown() {
    const trigger = document.getElementById("menu-hamburger-trigger");
    const panel = document.getElementById("global-dropdown-panel");

    if (!trigger || !panel) return;

    trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        panel.classList.toggle("active");
    });

    document.addEventListener("click", (e) => {
        if (!panel.contains(e.target) && e.target !== trigger) {
            panel.classList.remove("active");
        }
    });
}

/**
 * Validates tracking variables to apply role view structures
 */
function evaluateConsoleIdentitySession() {
    let sessionData = localStorage.getItem("nexus_user_session");

    // Developer Box Safeguard: Sets up local token if testing directly via file systems
    if (!sessionData) {
        console.info("Identity token unassigned. Issuing default mock student object.");
        const sandboxProfile = {
            uid: "sandbox_dev_token",
            email: "user@trivexacademy.com",
            role: "student" // Flip string value to "admin" to view administrative box components
        };
        localStorage.setItem("nexus_user_session", JSON.stringify(sandboxProfile));
        sessionData = localStorage.getItem("nexus_user_session");
    }

    try {
        const userSession = JSON.parse(sessionData);
        renderAccountRoleLayout(userSession.role || "student");
    } catch (err) {
        console.error("Session serialization error. Cleaning environment variables.", err);
        localStorage.removeItem("nexus_user_session");
        window.location.replace("login.html");
    }
}

/**
 * Displays appropriate dashboard blocks based on current privileges
 */
function renderAccountRoleLayout(role) {
    const studentWrapper = document.getElementById("student-view-wrapper");
    const adminWrapper = document.getElementById("admin-view-wrapper");
    const studentNavElements = document.querySelectorAll(".student-elements");
    const adminNavElements = document.querySelectorAll(".admin-elements");

    if (role === "admin") {
        if (adminWrapper) adminWrapper.style.display = "block";
        if (studentWrapper) studentWrapper.style.display = "none";
        
        adminNavElements.forEach(el => el.style.display = "flex");
        studentNavElements.forEach(el => el.style.display = "none");
    } else {
        if (studentWrapper) studentWrapper.style.display = "block";
        if (adminWrapper) adminWrapper.style.display = "none";
        
        adminNavElements.forEach(el => el.style.display = "none");
        studentNavElements.forEach(el => el.style.display = "flex");
    }
}

/**
 * Triggers session clears and navigates back out to security gateways
 */
function handleSignOutAction() {
    localStorage.removeItem("nexus_user_session");
    window.location.replace("login.html");
            }
