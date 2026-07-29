import { auth, rtdb } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// DOM Handles
const adminSection = document.getElementById("admin-section");
const studentSection = document.getElementById("student-section");
const headerRolePill = document.getElementById("header-role-pill");
const displayNameEl = document.getElementById("user-display-name");
const roleDescEl = document.getElementById("user-role-description");

// Sidebar Elements
const btnToggleMenu = document.getElementById("btn-toggle-menu");
const appSidebar = document.getElementById("app-sidebar");
const sidebarOverlay = document.getElementById("sidebar-overlay");
const btnLogout = document.getElementById("btn-logout");

// Drawer Toggle Handler
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

// Fast UI Renderer
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
}

// 1. INSTANT LOCAL SEED (<2ms)
const initialRole = localStorage.getItem("nx_role") || "student";
const initialName = localStorage.getItem("nx_name") || "User";
applyState(initialRole, initialName);

// 2. BACKGROUND AUTH & RTDB SYNC
onAuthStateChanged(auth, (user) => {
    if (!user) {
        localStorage.clear();
        sessionStorage.clear();
        window.location.replace("login.html");
        return;
    }

    // Set immediate name if cache was empty
    const quickName = user.displayName || (user.email ? user.email.split("@")[0] : "User");
    if (!localStorage.getItem("nx_name")) {
        applyState(initialRole, quickName);
    }

    // Background Database Fetch
    const userRef = ref(rtdb, `users/${user.uid}`);
    get(userRef).then((snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            const verifiedRole = data.role || "student";
            const verifiedName = data.name || data.fullName || user.displayName || user.email.split("@")[0];

            localStorage.setItem("nx_role", verifiedRole.toLowerCase());
            localStorage.setItem("nx_name", verifiedName);

            applyState(verifiedRole, verifiedName);
        }
    }).catch((err) => {
        console.warn("Background fetch delayed:", err);
    });
});

// Logout Listener
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
