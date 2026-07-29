import { auth, rtdb } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

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

// Apply role
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

// Temporary debug box (will show on screen)
function showDebug(message) {
  let box = document.getElementById("debug-box");
  if (!box) {
    box = document.createElement("div");
    box.id = "debug-box";
    box.style.cssText = `
      background: #1e293b;
      color: #f8fafc;
      padding: 16px;
      margin: 20px;
      border-radius: 12px;
      font-size: 14px;
      line-height: 1.5;
      white-space: pre-wrap;
      border: 1px solid #334155;
    `;
    document.querySelector("main").prepend(box);
  }
  box.textContent = message;
}

// Main logic
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.replace("login.html");
    return;
  }

  showDebug("Logged in as: " + user.uid + "\nFetching role...");

  try {
    const userRef = ref(rtdb, `users/${user.uid}`);
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
      const data = snapshot.val();
      
      // Show exactly what is in the database
      showDebug(
        "SUCCESS - Data found in database:\n\n" +
        JSON.stringify(data, null, 2) +
        "\n\nDetected role: " + (data.role || "NOT FOUND")
      );

      const role = (data.role || "student").toLowerCase().trim();
      const name = data.name || user.displayName || "User";

      localStorage.setItem("nx_role", role);
      localStorage.setItem("nx_name", name);

      applyState(role, name);
    } else {
      showDebug("NO DATA FOUND\nPath users/" + user.uid + " does not exist in the database.");
      applyState("student", "User");
    }
  } catch (error) {
    showDebug("ERROR loading role:\n" + error.message);
    applyState("student", "User");
  }
});

// Logout
btnLogout?.addEventListener("click", async () => {
  localStorage.clear();
  await signOut(auth);
  window.location.replace("login.html");
});
