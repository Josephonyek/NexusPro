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

window.addEventListener("resize", () => {
  if (window.innerWidth >= 1024) {
    appSidebar?.classList.remove("open");
    sidebarOverlay?.classList.remove("active");
  }
});

// ---------- Fast UI Renderer ----------
function applyState(role, name) {
  const cleanRole = (role || "student").toLowerCase().trim();
  const cleanName = name || "User";

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
}

// -------------------------------------------------
// 1. INSTANT RENDER FROM CACHE  (< 2 ms)
// -------------------------------------------------
const cachedRole = localStorage.getItem("nx_role") || "student";
const cachedName = localStorage.getItem("nx_name") || "User";
applyState(cachedRole, cachedName);

// Hide the verifying badge almost immediately
if (loadingBadge) {
  setTimeout(() => loadingBadge.style.display = "none", 80);
}

// -------------------------------------------------
// 2. BACKGROUND AUTH + RTDB VERIFICATION
// -------------------------------------------------
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    localStorage.clear();
    sessionStorage.clear();
    window.location.replace("login.html");
    return;
  }

  // Quick name while we wait for DB
  const quickName = user.displayName ||
                    (user.email ? user.email.split("@")[0] : "User");

  // Only update name if we didn't have one cached
  if (!localStorage.getItem("nx_name")) {
    applyState(cachedRole, quickName);
  }

  // Fast RTDB fetch
  try {
    const snap = await get(ref(rtdb, `users/${user.uid}`));

    if (snap.exists()) {
      const data = snap.val();
      const verifiedRole = (data.role || "student").toLowerCase().trim();
      const verifiedName = data.name || data.fullName || quickName;

      // Only accept known roles
      const safeRole = verifiedRole === "admin" ? "admin" : "student";

      // Update cache
      localStorage.setItem("nx_role", safeRole);
      localStorage.setItem("nx_name", verifiedName);

      // Only re-render if something actually changed
      if (safeRole !== cachedRole || verifiedName !== cachedName) {
        applyState(safeRole, verifiedName);
      }
    } else {
      // No profile yet → force student
      localStorage.setItem("nx_role", "student");
      localStorage.setItem("nx_name", quickName);
      if (cachedRole !== "student") {
        applyState("student", quickName);
      }
    }
  } catch (err) {
    console.warn("Role verification failed – keeping cached view:", err);
    // We keep the optimistic UI (fail open for speed)
  } finally {
    if (loadingBadge) loadingBadge.style.display = "none";
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
