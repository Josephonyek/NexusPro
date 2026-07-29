import { auth, rtdb } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// DOM References
const adminSection = document.getElementById("admin-section");
const studentSection = document.getElementById("student-section");
const roleTag = document.getElementById("user-role-tag");
const displayNameEl = document.getElementById("user-display-name");
const welcomeTextEl = document.getElementById("role-welcome-text");
const btnLogout = document.getElementById("btn-logout");

// 1. INSTANT CACHE CHECK (Runs before Firebase Auth responds)
function applyCachedLayout() {
    const cachedRole = sessionStorage.getItem("nexus_user_role");
    const cachedName = sessionStorage.getItem("nexus_user_name");

    if (cachedName && displayNameEl) {
        displayNameEl.innerText = cachedName;
    }

    if (cachedRole === "admin") {
        renderAdminUI();
    } else {
        renderStudentUI();
    }
}

// Render Admin View
function renderAdminUI() {
    if (roleTag) {
        roleTag.innerText = "Administrator";
        roleTag.className = "role-badge admin";
    }
    if (welcomeTextEl) {
        welcomeTextEl.innerText = "System administrative access verified. Manage platform operations below.";
    }
    if (adminSection) adminSection.classList.add("active");
    if (studentSection) studentSection.classList.remove("active");
}

// Render Student View
function renderStudentUI() {
    if (roleTag) {
        roleTag.innerText = "Student";
        roleTag.className = "role-badge student";
    }
    if (welcomeTextEl) {
        welcomeTextEl.innerText = "Student portal active. Access your study modules and learning tools below.";
    }
    if (studentSection) studentSection.classList.add("active");
    if (adminSection) adminSection.classList.remove("active");
}

// Execute cached render immediately
applyCachedLayout();

// 2. BACKGROUND FIREBASE AUTH & DATABASE RE-VALIDATION
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        sessionStorage.clear();
        window.location.href = "login.html";
        return;
    }

    try {
        // Quietly fetch fresh credentials from RTDB
        const userRef = ref(rtdb, `users/${user.uid}`);
        const snapshot = await get(userRef);

        let userRole = "student";
        let userFullName = user.email ? user.email.split('@')[0] : "User";

        if (snapshot.exists()) {
            const data = snapshot.val();
            if (data.role) userRole = data.role.toLowerCase();
            if (data.name) userFullName = data.name;
            else if (data.fullName) userFullName = data.fullName;
        }

        // Cache for subsequent instant visits
        sessionStorage.setItem("nexus_user_role", userRole);
        sessionStorage.setItem("nexus_user_name", userFullName);

        // Update UI dynamically if data changed
        if (displayNameEl) displayNameEl.innerText = userFullName;

        if (userRole === "admin") {
            renderAdminUI();
        } else {
            renderStudentUI();
        }

    } catch (err) {
        console.warn("Silent profile sync error:", err);
    }
});

// Logout Handler
if (btnLogout) {
    btnLogout.addEventListener("click", async () => {
        try {
            sessionStorage.clear();
            await signOut(auth);
            window.location.href = "login.html";
        } catch (err) {
            console.error("Logout failed:", err);
        }
    });
}
