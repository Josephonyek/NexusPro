// ========== STRONG DEBUG VERSION ==========
alert("dashboard.js is loading...");   // ← You must see this alert

import { auth, rtdb } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

alert("Firebase imported successfully");  // ← You should also see this

// DOM
const adminSection   = document.getElementById("admin-section");
const studentSection = document.getElementById("student-section");
const headerRolePill = document.getElementById("header-role-pill");
const displayNameEl  = document.getElementById("user-display-name");
const roleDescEl     = document.getElementById("user-role-description");

const btnToggleMenu  = document.getElementById("btn-toggle-menu");
const appSidebar     = document.getElementById("app-sidebar");
const sidebarOverlay = document.getElementById("sidebar-overlay");
const btnLogout      = document.getElementById("btn-logout");

// Sidebar
function toggleSidebar() {
  if (!appSidebar || !sidebarOverlay) return;
  const open = appSidebar.classList.toggle("open");
  sidebarOverlay.classList.toggle("active", open);
}
btnToggleMenu?.addEventListener("click", toggleSidebar);
sidebarOverlay?.addEventListener("click", toggleSidebar);

function applyState(role, name) {
  const cleanRole = (role || "student").toLowerCase().trim();
  const cleanName = name || "User";

  if (displayNameEl) displayNameEl.textContent = cleanName;

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
}

function showDebug(msg) {
  let box = document.getElementById("debug-box");
  if (!box) {
    box = document.createElement("div");
    box.id = "debug-box";
    box.style.cssText = "background:#1e293b;color:white;padding:16px;margin:16px;border-radius:12px;font-size:14px;white-space:pre-wrap;";
    document.querySelector("main")?.prepend(box);
  }
  box.textContent = msg;
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.replace("login.html");
    return;
  }

  showDebug("User UID: " + user.uid + "\nFetching from database...");

  try {
    const snapshot = await get(ref(rtdb, `users/${user.uid}`));

    if (snapshot.exists()) {
      const data = snapshot.val();
      showDebug("DATA FROM DATABASE:\n\n" + JSON.stringify(data, null, 2));
      
      const role = (data.role || "student").toLowerCase().trim();
      const name = data.name || "User";
      
      localStorage.setItem("nx_role", role);
      localStorage.setItem("nx_name", name);
      applyState(role, name);
    } else {
      showDebug("NO DATA FOUND at path: users/" + user.uid);
      applyState("student", "User");
    }
  } catch (err) {
    showDebug("ERROR:\n" + err.message);
  }
});

btnLogout?.addEventListener("click", async () => {
  localStorage.clear();
  await signOut(auth);
  window.location.replace("login.html");
});
