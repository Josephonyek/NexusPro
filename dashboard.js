import { auth, rtdb } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// DOM Elements
const adminSection   = document.getElementById("admin-section");
const studentSection = document.getElementById("student-section");
const headerRolePill = document.getElementById("header-role-pill");
const displayNameEl  = document.getElementById("user-display-name");
const roleDescEl     = document.getElementById("user-role-description");
const loadingBadge   = document.getElementById("role-loading");

const btnToggleMenu  = document.getElementById("btn-toggle-menu");
const appSidebar     = document.getElementById("app-sidebar");
const sidebarOverlay = document.getElementById("sidebar-overlay");
const btnLogout      = document.getElementById("btn-logout");

// ---------- Sidebar ----------
function toggleSidebar() {
  if (!appSidebar || !sidebarOverlay) return;
  const open = appSidebar.classList.toggle("open");
  sidebarOverlay.classList.toggle("active", open);
}
btnToggleMenu?.addEventListener("click", toggleSidebar);
sidebarOverlay?.addEventListener("click", toggleSidebar);

window.addEventListener("resize", () => {
  if (window.innerWidth >= 1024) {
    appSidebar?.classList.remove("open");
    sidebarOverlay?.classList.remove("active");
  }
});

// ---------- Apply Role to UI ----------
function applyState(role, name) {
  const cleanRole = (role || "student").toString().toLowerCase().trim();
  const cleanName = name || "User";

  console.log("Applying UI → role:", cleanRole, "| name:", cleanName);

  if (displayNameEl) displayNameEl.textContent = cleanName;

  if (cleanRole === "admin") {
    if (headerRolePill) {
      headerRolePill.textContent = "Administrator";
      headerRolePill.className = "role-pill admin";
    }
    if (roleDescEl) roleDescEl.textContent = "System administrative permissions active.";
    adminSection?.classList.add("active");
    studentSection?.classList.remove("active");
  } else {
    if (headerRolePill) {
      headerRolePill.textContent = "Student";
      headerRolePill.className = "role-pill student";
    }
    if (roleDescEl) roleDescEl.textContent = "Student hub active. Access learning materials below.";
    studentSection?.classList.add("active");
    adminSection?.classList.remove("active");
  }

  if (loadingBadge) loadingBadge.style.display = "none";
}

// ---------- Instant cache (temporary) ----------
const cachedRole = localStorage.getItem("nx_role") || "student";
const cachedName = localStorage.getItem("nx_name") || "User";
applyState(cachedRole, cachedName);

// ---------- MAIN: Detect role from Database ----------
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    console.log("No user → redirecting to login");
    localStorage.clear();
    sessionStorage.clear();
    window.location.replace("login.html");
    return;
  }

  console.log("User authenticated:", user.uid);

  const quickName = user.displayName || (user.email ? user.email.split("@")[0] : "User");

  try {
    const userRef = ref(rtdb, `users/${user.uid}`);
    console.log("Fetching from path: users/" + user.uid);

    const snapshot = await get(userRef);

    if (snapshot.exists()) {
      const data = snapshot.val();
      console.log("Database data found:", data);

      // Try common field names for role
      let role = data.role || data.userRole || data.type || data.accountType || "student";
      role = role.toString().toLowerCase().trim();

      // Only allow valid roles
      if (role !== "admin" && role !== "student") {
        role = "student";
      }

      const name = data.name || data.fullName || data.displayName || quickName;

      // Save to cache
      localStorage.setItem("nx_role", role);
      localStorage.setItem("nx_name", name);

      // Show correct content
      applyState(role, name);
    } else {
      console.warn("No profile found in database for this user. Using student.");
      localStorage.setItem("nx_role", "student");
      localStorage.setItem("nx_name", quickName);
      applyState("student", quickName);
    }
  } catch (error) {
    console.error("Failed to load role from database:", error);
    // Keep the cached version if network fails
    applyState(cachedRole, cachedName || quickName);
  }
});

// ---------- Logout ----------
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
