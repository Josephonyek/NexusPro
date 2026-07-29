import { auth, rtdb } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

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

// ---------- Sidebar ----------
function toggleSidebar() {
  if (!appSidebar || !sidebarOverlay) return;
  const open = appSidebar.classList.toggle("open");
  sidebarOverlay.classList.toggle("active", open);
}
btnToggleMenu?.addEventListener("click", toggleSidebar);
sidebarOverlay?.addEventListener("click", toggleSidebar);

// Close sidebar on resize to desktop
window.addEventListener("resize", () => {
  if (window.innerWidth >= 1024) {
    appSidebar?.classList.remove("open");
    sidebarOverlay?.classList.remove("active");
  }
});

// ---------- UI Renderer (secure) ----------
function applyState(role, name, verified = false) {
  const cleanRole = (role || "student").toLowerCase().trim();
  const cleanName = name || "User";

  if (displayNameEl) displayNameEl.textContent = cleanName;

  // Only show admin UI after real verification
  const isAdmin = cleanRole === "admin" && verified;

  if (isAdmin) {
    headerRolePill.textContent = "Administrator";
    headerRolePill.className = "role-pill admin";
    if (roleDescEl) roleDescEl.textContent = "System administrative permissions active.";
    adminSection?.classList.add("active");
    studentSection?.classList.remove("active");
  } else {
    headerRolePill.textContent = "Student";
    headerRolePill.className = "role-pill student";
    if (roleDescEl) roleDescEl.textContent = "Student hub active. Access learning materials below.";
    studentSection?.classList.add("active");
    adminSection?.classList.remove("active");
  }

  if (loadingBadge) {
    loadingBadge.style.display = verified ? "none" : "inline-flex";
  }
}

// ---------- 1. Instant optimistic name (role stays student until verified) ----------
const cachedName = localStorage.getItem("nx_name") || "User";
applyState("student", cachedName, false);   // ← always start safe

// ---------- 2. Auth + verified role ----------
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    localStorage.clear();
    sessionStorage.clear();
    window.location.replace("login.html");
    return;
  }

  // Quick name from Auth while we wait for DB
  const quickName = user.displayName ||
                    (user.email ? user.email.split("@")[0] : "User");
  if (!localStorage.getItem("nx_name")) {
    applyState("student", quickName, false);
  }

  // Background verified fetch
  try {
    const snap = await get(ref(rtdb, `users/${user.uid}`));
    if (snap.exists()) {
      const data = snap.val();
      const verifiedRole = (data.role || "student").toLowerCase().trim();
      const verifiedName = data.name || data.fullName ||
                           user.displayName ||
                           (user.email ? user.email.split("@")[0] : "User");

      // Only accept known roles
      const safeRole = (verifiedRole === "admin") ? "admin" : "student";

      localStorage.setItem("nx_role", safeRole);
      localStorage.setItem("nx_name", verifiedName);

      applyState(safeRole, verifiedName, true);   // ← now verified
    } else {
      // No profile yet → treat as student
      localStorage.setItem("nx_role", "student");
      localStorage.setItem("nx_name", quickName);
      applyState("student", quickName, true);
    }
  } catch (err) {
    console.warn("Role fetch failed – staying on safe student view:", err);
    applyState("student", quickName, true);   // fail closed
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
