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
    if (!appSidebar || !sidebarOverlay) return;
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

    // GUARANTEED HIDE: Remove loading guard overlay
    if (authGuard) {
        authGuard.style.opacity = "0";
        setTimeout(() => {
            authGuard.style.display = "none";
        }, 200);
    }
}

// 1. HARD TIMEOUT SHIELD (Prevents getting stuck forever under any condition)
setTimeout(() => {
    if (authGuard && authGuard.style.display !== "none") {
        console.warn("Nexus Pro: Safety timeout triggered. Displaying default UI.");
        const fallbackRole = localStorage.getItem("nx_role") || "student";
        const fallbackName = localStorage.getItem("nx_name") || "User";
        applyState(fallbackRole, fallbackName);
    }
}, 2500);

// 2. FAST-PATH (Instant render if cache exists)
const cachedRole = localStorage.getItem("nx_role");
const cachedName = localStorage.getItem("nx_name");
if (cachedRole && cachedName) {
    applyState(cachedRole, cachedName);
}

// 3. AUTHENTICATION & RTDB SYNC
onAuthStateChanged(auth, (user) => {
    if (!user) {
        console.log("No authenticated user found. Redirecting to login...");
        localStorage.clear();
        sessionStorage.clear();
        window.location.replace("login.html");
        return;
    }

    // Immediate display fallback for logged-in users
    const quickName = user.displayName || (user.email ? user.email.split("@")[0] : "User");
    const existingRole = localStorage.getItem("nx_role") || "student";
    applyState(existingRole, quickName);

    // Silent Realtime Database Verification
    const userRef = ref(rtdb, `users/${user.uid}`);
    get(userRef)
        .then((snapshot) => {
            if (!snapshot.exists()) {
                console.warn("User ID not found in database record.");
                return;
            }

            const data = snapshot.val();
            const verifiedRole = data.role || "student";
            const verifiedName = data.name || data.fullName || user.displayName || user.email.split("@")[0];

            // Update cache
            localStorage.setItem("nx_role", verifiedRole.toLowerCase());
            localStorage.setItem("nx_name", verifiedName);

            // Update UI with verified state
            applyState(verifiedRole, verifiedName);
        })
        .catch((err) => {
            console.error("RTDB Verification Error:", err);
            // Even if database fails, keep UI active with auth info
            applyState(existingRole, quickName);
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
