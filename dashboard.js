import { auth, rtdb } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { ref, get, set } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// DOM
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

// Sanity check: warn loudly in console if required elements are missing,
// instead of silently throwing and killing the rest of the script.
const requiredEls = {
  "admin-section": adminSection,
  "student-section": studentSection,
  "header-role-pill": headerRolePill,
  "user-role-description": roleDescEl
};
for (const [id, el] of Object.entries(requiredEls)) {
  if (!el) console.error(`[dashboard.js] Missing required element: #${id}`);
}

// Sidebar
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

// Apply role to the UI
function applyState(role, name) {
  const cleanRole = (role || "student").toLowerCase().trim();
  const cleanName = name || "User";

  if (displayNameEl) displayNameEl.textContent = cleanName;

  // Guard: if core elements aren't on the page, bail out safely
  // instead of throwing and halting the whole script.
  if (!adminSection || !studentSection || !headerRolePill || !roleDescEl) {
    console.error("[dashboard.js] Cannot apply role UI — required elements missing.");
    if (loadingBadge) loadingBadge.style.display = "none";
    return;
  }

  if (cleanRole === "admin") {
    headerRolePill.textContent = "Administrator";
    headerRolePill.className = "role-pill admin";
    roleDescEl.textContent = "System administrative permissions active.";
    adminSection.classList.add("active");
    studentSection.classList.remove("active");
  } else {
    headerRolePill.textContent = "Student";
    headerRolePill.className = "role-pill student";
    roleDescEl.textContent = "Student hub active. Access learning materials below.";
    studentSection.classList.add("active");
    adminSection.classList.remove("active");
  }

  if (loadingBadge) loadingBadge.style.display = "none";
}

// Instant cache (for speed)
const cachedRole = localStorage.getItem("nx_role") || "student";
const cachedName = localStorage.getItem("nx_name") || "User";
applyState(cachedRole, cachedName);

// Main role detection
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    localStorage.clear();
    sessionStorage.clear();
    window.location.replace("login.html");
    return;
  }

  const quickName = user.displayName || (user.email ? user.email.split("@")[0] : "User");
  const userRef = ref(rtdb, `users/${user.uid}`);

  try {
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
      // Profile already exists → read the role
      const data = snapshot.val();
      const role = (data.role || "student").toLowerCase().trim();
      const name = data.name || quickName;

      localStorage.setItem("nx_role", role);
      localStorage.setItem("nx_name", name);
      applyState(role, name);

    } else {
      // First time user → create profile as student
      const newProfile = {
        name: quickName,
        email: user.email || "",
        role: "student",
        createdAt: Date.now()
      };

      await set(userRef, newProfile);

      localStorage.setItem("nx_role", "student");
      localStorage.setItem("nx_name", quickName);
      applyState("student", quickName);
    }
  } catch (error) {
    console.error("Error loading role:", error);
    // Keep cached version if network fails
    applyState(cachedRole, cachedName);
  }
});

// Logout
btnLogout?.addEventListener("click", async () => {
  try {
    localStorage.clear();
    sessionStorage.clear();
    await signOut(auth);
    window.location.replace("login.html");
  } catch (err) {
    console.error(err);
  }
});
