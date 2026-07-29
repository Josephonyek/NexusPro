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

// Drawer Toggle
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

// UI Renderer
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

    // Hide loading screen instantly
    if (authGuard) authGuard.style.display = "none";
    if (mainWrapper) mainWrapper.classList.add("visible");
}

// 1. INSTANT LOCAL CHECK (<5ms)
const cachedRole = localStorage.getItem("nx_role");
const cachedName = localStorage.getItem("nx_name");

if (cachedRole && cachedName) {
    renderDashboardUI(cachedRole, cachedName);
}

// 2. FIREBASE SESSION CHECK
onAuthStateChanged(auth, (user) => {
    if (!user) {
        localStorage.clear();
        sessionStorage.clear();
        window.location.replace("login.html");
        return;
    }

    // OPTIMIZATION FOR NEW USERS:
    // If no cache exists, immediately render using default "student" role & email prefix
    // so the new user doesn't wait on the RTDB network request screen!
    if (!localStorage.getItem("nx_role")) {
        const fallbackName = user.displayName || (user.email ? user.email.split("@")[0] : "New User");
        renderDashboardUI("student", fallbackName);
    }

    // 3. SILENT BACKGROUND RTDB RE-VALIDATION
    const userRef = ref(rtdb, `users/${user.uid}`);
    get(userRef).then((snapshot) => {
        if (!snapshot.exists()) {
            // Unregistered user attempt -> kick out
            localStorage.clear();
            signOut(auth);
            window.location.replace("login.html");
            return;
        }

        const userData = snapshot.val();
        const verifiedRole = (userData.role || "student").toLowerCase();
        const userName = userData.name || userData.fullName || user.displayName || user.email.split("@")[0];

        // Store into localStorage for future instant loads
        localStorage.setItem("nx_role", verifiedRole);
        localStorage.setItem("nx_name", userName);

        // Update UI seamlessly if role/name differs from fallback
        renderDashboardUI(verifiedRole, userName);
    }).catch((err) => {
        console.warn("Background RTDB check delayed:", err);
    });
});

// Logout Handler
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
