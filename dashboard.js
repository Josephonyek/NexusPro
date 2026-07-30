import { auth, rtdb } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// DOM elements
const loadingScreen   = document.getElementById("loading-screen");
const adminSection    = document.getElementById("admin-section");
const studentSection  = document.getElementById("student-section");
const headerRolePill  = document.getElementById("header-role-pill");
const displayNameEl   = document.getElementById("user-display-name");
const welcomeNameEl   = document.getElementById("welcome-name");
const roleDescEl      = document.getElementById("user-role-description");
const btnLogout       = document.getElementById("btn-logout");

// Apply role to the UI
function applyState(role, name) {
  const cleanRole = (role || "student").toLowerCase().trim();
  const cleanName = name || "User";

  // Update name displays
  if (displayNameEl) displayNameEl.textContent = cleanName;
  if (welcomeNameEl) welcomeNameEl.textContent = cleanName;

  if (!adminSection || !studentSection || !headerRolePill || !roleDescEl) return;

  if (cleanRole === "admin") {
    headerRolePill.textContent = "Admin";
    headerRolePill.className = "role-pill admin";
    roleDescEl.textContent = "You have administrator access.";
    adminSection.classList.add("active");
    studentSection.classList.remove("active");
  } else {
    headerRolePill.textContent = "Student";
    headerRolePill.className = "role-pill student";
    roleDescEl.textContent = "Student dashboard – access your learning tools below.";
    studentSection.classList.add("active");
    adminSection.classList.remove("active");
  }
}

// Show cached data instantly (better UX)
const cachedRole = localStorage.getItem("nx_role") || "student";
const cachedName = localStorage.getItem("nx_name") || "User";
applyState(cachedRole, cachedName);

// ========== AUTH GUARD ==========
onAuthStateChanged(auth, async (user) => {
  // Not logged in → force back to auth page
  if (!user) {
    localStorage.clear();
    sessionStorage.clear();
    window.location.replace("auth.html");
    return;
  }

  // User is logged in – load their profile
  try {
    const userRef = ref(rtdb, `users/${user.uid}`);
    const snapshot = await get(userRef);

    let role = "student";
    let name = user.displayName || (user.email ? user.email.split("@")[0] : "User");

    if (snapshot.exists()) {
      const data = snapshot.val();
      role = (data.role || "student").toLowerCase().trim();
      name = data.name || name;
    }

    // Save to localStorage for fast future loads
    localStorage.setItem("nx_role", role);
    localStorage.setItem("nx_name", name);
    localStorage.setItem("nx_uid", user.uid);

    applyState(role, name);

  } catch (error) {
    console.error("Error loading user profile:", error);
    // Still show the page with cached / basic info
    applyState(cachedRole, cachedName);
  }

  // Hide loading screen
  if (loadingScreen) loadingScreen.classList.add("hidden");
});

// ========== LOGOUT ==========
btnLogout?.addEventListener("click", async () => {
  try {
    localStorage.clear();
    sessionStorage.clear();
    await signOut(auth);
    window.location.replace("auth.html");
  } catch (err) {
    console.error("Logout error:", err);
    // Force redirect even if signOut fails
    window.location.replace("auth.html");
  }
});
