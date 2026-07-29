import { auth, rtdb } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// DOM References
const authGuard = document.getElementById("auth-guard");
const adminSection = document.getElementById("admin-section");
const studentSection = document.getElementById("student-section");
const headerRolePill = document.getElementById("header-role-pill");
const displayNameEl = document.getElementById("user-display-name");
const roleDescEl = document.getElementById("user-role-description");

// Menu Controls
const btnToggleMenu = document.getElementById("btn-toggle-menu");
const appSidebar = document.getElementById("app-sidebar");
const sidebarOverlay = document.getElementById("sidebar-overlay");
const btnLogout = document.getElementById("btn-logout");

// Drawer Handler
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

// Single Source-of-Truth UI Renderer
function applyState(role, name) {
    const cleanRole = (role || "student").toLowerCase();
    const cleanName = name || "User";

    if (displayNameEl) displayNameEl.innerText = cleanName;

    if (cleanRole === "admin") {
        if (headerRolePill) {
            headerRolePill.innerText = "Administrator";
            headerRolePill.className = "role-pill admin";
        }
        if (roleDescEl) roleDescEl.innerText = "System administrative permissions active.";
        adminSection?.classList.add("active");
        studentSection?.classList.remove("active");
    } else {
        if (headerRolePill) {
            headerRolePill.innerText = "Student";
            headerRolePill.className = "role-pill student";
        }
        if (roleDescEl) roleDescEl.innerText = "Student hub active. Access learning materials below.";
        studentSection?.classList.add("active");
        adminSection?.classList.remove("active");
    }

    // Hide guard overlay immediately once state is set
    if (authGuard) authGuard.style.display = "none";
}

// 1. FAST-PATH (Instant render if cache exists)
const cachedRole = localStorage.getItem("nx_role");
const cachedName = localStorage.getItem("nx_name");
if (cachedRole && cachedName) {
    applyState(cachedRole, cachedName);
}

// 2. AUTHENTICATION & RTDB SYNC
onAuthStateChanged(auth, (user) => {
    if (!user) {
        localStorage.clear();
        sessionStorage.clear();
        window.location.replace("login.html");
        return;
    }

    // Immediate fallback for brand new users without cache
    const quickName = user.displayName || (user.email ? user.email.split("@")[0] : "New User");
    if (!localStorage.getItem("nx_role")) {
        applyState("student", quickName);
    }

    // Silent Database Verification
    const userRef = ref(rtdb, `users/${user.uid}`);
    get(userRef).then((snapshot) => {
        if (!snapshot.exists()) {
            localStorage.clear();
            signOut(auth);
            window.location.replace("login.html");
            return;
        }

        const data = snapshot.val();
        const verifiedRole = data.role || "student";
        const verifiedName = data.name || data.fullName || user.displayName || user.email.split("@")[0];

        // Seed cache
        localStorage.setItem("nx_role", verifiedRole.toLowerCase());
        localStorage.setItem("nx_name", verifiedName);

        // Render verified state
        applyState(verifiedRole, verifiedName);

    }).catch((err) => {
        console.warn("Background RTDB sync delayed:", err);
    });
});

// Clean Sign Out
btnLogout?.addEventListener("click", async () => {
    try {
        localStorage.clear();
        sessionStorage.clear();
        await signOut(auth);
        window.location.replace("login.html");
    } catch (err) {
        console.error("Sign out error:", err);
    }
});
