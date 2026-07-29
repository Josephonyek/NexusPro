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

// Drawer Control
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

// UI Renderer Helper
function renderDashboardUI(role, name) {
    if (displayNameEl) displayNameEl.innerText = name;

    if (role === "admin") {
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

    // Reveal main shell instantly
    if (authGuard) authGuard.style.display = "none";
    if (mainWrapper) mainWrapper.classList.add("visible");
}

// 1. FAST OPTIMISTIC LAUNCH (< 10ms)
const cachedRole = localStorage.getItem("nx_role");
const cachedName = localStorage.getItem("nx_name");

if (cachedRole && cachedName) {
    renderDashboardUI(cachedRole, cachedName);
}

// 2. SILENT BACKGROUND SERVER RE-VALIDATION
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        localStorage.clear();
        sessionStorage.clear();
        window.location.replace("login.html");
        return;
    }

    try {
        const userRef = ref(rtdb, `users/${user.uid}`);
        const snapshot = await get(userRef);

        if (!snapshot.exists()) {
            localStorage.clear();
            await signOut(auth);
            window.location.replace("login.html");
            return;
        }

        const userData = snapshot.val();
        const verifiedRole = (userData.role || "student").toLowerCase();
        const userName = userData.name || userData.fullName || user.email.split("@")[0];

        // Cache updated credentials locally
        localStorage.setItem("nx_role", verifiedRole);
        localStorage.setItem("nx_name", userName);

        // Update UI seamlessly if data changed or initial cache wasn't present
        renderDashboardUI(verifiedRole, userName);

    } catch (error) {
        console.error("Silent security check error:", error);
        // On network fail, allow access if cache exists, otherwise purge
        if (!localStorage.getItem("nx_role")) {
            localStorage.clear();
            window.location.replace("login.html");
        }
    }
});

// Secure Logout
btnLogout?.addEventListener("click", async () => {
    try {
        localStorage.clear();
        sessionStorage.clear();
        await signOut(auth);
        window.location.replace("login.html");
    } catch (err) {
        console.error("Logout error:", err);
    }
});
