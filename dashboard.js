import { auth, rtdb } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// DOM Element References
const loaderState = document.getElementById("loader-state");
const dashboardContent = document.getElementById("dashboard-content");
const adminSection = document.getElementById("admin-section");
const studentSection = document.getElementById("student-section");
const roleTag = document.getElementById("user-role-tag");
const displayNameEl = document.getElementById("user-display-name");
const welcomeTextEl = document.getElementById("role-welcome-text");
const btnLogout = document.getElementById("btn-logout");

// Authentication & Role Checking Engine
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        // Unauthenticated session -> Redirect to login page
        window.location.href = "login.html";
        return;
    }

    try {
        // Fetch user profile node from Firebase Realtime Database
        const userRef = ref(rtdb, `users/${user.uid}`);
        const snapshot = await get(userRef);

        let userRole = "student"; // Default fallback role
        let userFullName = user.email ? user.email.split('@')[0] : "User";

        if (snapshot.exists()) {
            const data = snapshot.val();
            if (data.role) {
                userRole = data.role.toLowerCase();
            }
            if (data.name) {
                userFullName = data.name;
            } else if (data.fullName) {
                userFullName = data.fullName;
            }
        }

        // Set User Display Name
        if (displayNameEl) {
            displayNameEl.innerText = userFullName;
        }

        // Render sections based on database role
        if (userRole === "admin") {
            if (roleTag) {
                roleTag.innerText = "Administrator";
                roleTag.className = "role-badge admin";
            }
            if (welcomeTextEl) {
                welcomeTextEl.innerText = "System administrative access verified. Manage platform operations below.";
            }
            if (adminSection) adminSection.classList.add("active");
            if (studentSection) studentSection.classList.remove("active");
        } else {
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

        // Hide loading state & reveal dashboard content
        if (loaderState) loaderState.style.display = "none";
        if (dashboardContent) dashboardContent.style.display = "block";

    } catch (err) {
        console.error("Failed to fetch user role from Realtime Database:", err);
        
        // Fallback to student view in case of read error
        if (studentSection) studentSection.classList.add("active");
        if (loaderState) loaderState.style.display = "none";
        if (dashboardContent) dashboardContent.style.display = "block";
    }
});

// Logout Handler
if (btnLogout) {
    btnLogout.addEventListener("click", async () => {
        try {
            await signOut(auth);
            window.location.href = "login.html";
        } catch (err) {
            console.error("Logout failed:", err);
        }
    });
}
