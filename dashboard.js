import { auth, rtdb } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// DOM Handles
const authGuard = document.getElementById("auth-guard-screen");
const mainWrapper = document.getElementById("main-wrapper");
const adminModule = document.getElementById("admin-module");
const studentModule = document.getElementById("student-module");
const headerRolePill = document.getElementById("header-role-pill");
const displayNameEl = document.getElementById("user-display-name");
const roleDescEl = document.getElementById("user-role-description");

// Sidebar & Hamburger Handles
const btnToggleMenu = document.getElementById("btn-toggle-menu");
const appSidebar = document.getElementById("app-sidebar");
const sidebarOverlay = document.getElementById("sidebar-overlay");
const btnLogout = document.getElementById("btn-logout");

// Hamburger Mobile Drawer Controller
function toggleSidebar() {
    const isOpen = appSidebar.classList.contains("open");
    if (isOpen) {
        appSidebar.classList.remove("open");
        sidebarOverlay.classList.remove("active");
    } else {
        appSidebar.classList.add("open");
        sidebarOverlay.classList.add("active");
    }
}

btnToggleMenu?.addEventListener("click", toggleSidebar);
sidebarOverlay?.addEventListener("click", toggleSidebar);

// STRICT ZERO-TRUST AUTH RE-VERIFICATION
onAuthStateChanged(auth, async (user) => {
    // 1. If no authenticated session exists in Firebase Auth -> Immediate Redirect
    if (!user) {
        sessionStorage.clear();
        window.location.replace("login.html");
        return;
    }

    try {
        // 2. Query Realtime Database directly to fetch server-validated role
        const userRef = ref(rtdb, `users/${user.uid}`);
        const snapshot = await get(userRef);

        if (!snapshot.exists()) {
            // Unregistered user attempt -> Purge session and kick out
            sessionStorage.clear();
            await signOut(auth);
            window.location.replace("login.html");
            return;
        }

        const userData = snapshot.val();
        const verifiedRole = (userData.role || "student").toLowerCase();
        const userName = userData.name || userData.fullName || user.email.split("@")[0];

        // 3. Render verified profile to DOM
        if (displayNameEl) displayNameEl.innerText = userName;

        if (verifiedRole === "admin") {
            if (headerRolePill) {
                headerRolePill.innerText = "Administrator";
                headerRolePill.className = "role-pill admin";
            }
            if (roleDescEl) roleDescEl.innerText = "Administrative privilege level verified. System controls active.";
            adminModule?.classList.add("active");
            studentModule?.classList.remove("active");
        } else {
            if (headerRolePill) {
                headerRolePill.innerText = "Student";
                headerRolePill.className = "role-pill student";
            }
            if (roleDescEl) roleDescEl.innerText = "Student workspace active. Access your practice material and library below.";
            studentModule?.classList.add("active");
            adminModule?.classList.remove("active");
        }

        // 4. Reveal content ONLY after successful auth check
        if (authGuard) authGuard.style.display = "none";
        if (mainWrapper) mainWrapper.classList.add("visible");

    } catch (error) {
        console.error("Security Authentication Failure:", error);
        sessionStorage.clear();
        window.location.replace("login.html");
    }
});

// Secure Sign Out Execution
btnLogout?.addEventListener("click", async () => {
    try {
        sessionStorage.clear();
        await signOut(auth);
        window.location.replace("login.html");
    } catch (err) {
        console.error("Logout execution failed:", err);
    }
});
