document.addEventListener("DOMContentLoaded", () => {
  const API_ENDPOINT = "/api/user-auth.js";
  
  // DOM Elements
  const userTableBody = document.getElementById("userTableBody");
  const searchInput = document.getElementById("searchInput");
  const roleFilter = document.getElementById("roleFilter");
  const statusFilter = document.getElementById("statusFilter");

  // Stats Elements
  const statTotal = document.getElementById("statTotal");
  const statStudents = document.getElementById("statStudents");
  const statAdmins = document.getElementById("statAdmins");
  const statSuspended = document.getElementById("statSuspended");

  // Modal Elements
  const userModal = document.getElementById("userModal");
  let allUsers = [];

  // ================= 1. FETCH USERS FROM BACKEND =================
  window.fetchUsers = async function() {
    renderLoadingState();
    try {
      const token = localStorage.getItem("nexusToken") || localStorage.getItem("token") || "";
      
      const res = await fetch(`${API_ENDPOINT}?action=list-users`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Failed to fetch users");

      const data = await res.json();
      allUsers = data.users || (Array.isArray(data) ? data : []);

      updateStats(allUsers);
      applyFilters();
    } catch (err) {
      console.error("Error loading users:", err);
      userTableBody.innerHTML = `
        <tr>
          <td colspan="5" class="empty-msg" style="color: var(--danger);">
            <i class="fas fa-exclamation-triangle"></i> Error loading users. Please try refreshing.
          </td>
        </tr>
      `;
    }
  };

  // ================= 2. STATS & RENDER =================
  function updateStats(users) {
    if (statTotal) statTotal.textContent = users.length;
    if (statStudents) statStudents.textContent = users.filter(u => (u.role || "student").toLowerCase() === "student").length;
    if (statAdmins) statAdmins.textContent = users.filter(u => (u.role || "").toLowerCase() === "admin").length;
    if (statSuspended) statSuspended.textContent = users.filter(u => (u.status || "").toLowerCase() === "suspended").length;
  }

  function renderUsers(users) {
    if (!users || users.length === 0) {
      userTableBody.innerHTML = `
        <tr>
          <td colspan="5" class="empty-msg">
            No users found.
          </td>
        </tr>
      `;
      return;
    }

    userTableBody.innerHTML = users.map(user => {
      const role = (user.role || "student").toLowerCase();
      const status = (user.status || "active").toLowerCase();
      const isSuspended = status === "suspended";
      const nextRole = role === "admin" ? "student" : "admin";
      const dateStr = user.created_at ? new Date(Number(user.created_at) || user.created_at).toLocaleDateString() : "N/A";

      return `
        <tr>
          <td>
            <div class="user-info">
              <div class="name">${escapeHtml(user.name || "Unnamed User")}</div>
              <div class="email">${escapeHtml(user.email || "No Email")}</div>
            </div>
          </td>
          <td>
            <span class="badge ${role}">${role}</span>
          </td>
          <td>
            <span class="badge ${isSuspended ? "suspended" : "active"}">${isSuspended ? "Suspended" : "Active"}</span>
          </td>
          <td>${dateStr}</td>
          <td>
            <div style="display:flex; gap:6px;">
              <button class="btn-action" onclick="viewUserDetails('${user.id}')">Info</button>
              <button class="btn-action" onclick="toggleRole('${user.id}', '${nextRole}')">${role === "admin" ? "Demote" : "Promote"}</button>
              <button class="btn-action warn" onclick="toggleStatus('${user.id}', '${isSuspended ? "active" : "suspended"}')">${isSuspended ? "Activate" : "Suspend"}</button>
              <button class="btn-action danger" onclick="deleteUser('${user.id}')">Delete</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  // ================= 3. FILTERING =================
  function applyFilters() {
    const search = searchInput.value.toLowerCase().trim();
    const role = roleFilter.value.toLowerCase();
    const status = statusFilter.value.toLowerCase();

    const filtered = allUsers.filter(u => {
      const matchName = u.name && u.name.toLowerCase().includes(search);
      const matchEmail = u.email && u.email.toLowerCase().includes(search);
      const matchSearch = search === "" || matchName || matchEmail;

      const matchRole = role === "all" || (u.role || "student").toLowerCase() === role;
      const matchStatus = status === "all" || (u.status || "active").toLowerCase() === status;

      return matchSearch && matchRole && matchStatus;
    });

    renderUsers(filtered);
  }

  searchInput.addEventListener("input", applyFilters);
  roleFilter.addEventListener("change", applyFilters);
  statusFilter.addEventListener("change", applyFilters);

  // ================= 4. MODAL & ACTIONS =================
  window.viewUserDetails = function(userId) {
    const user = allUsers.find(u => String(u.id) === String(userId));
    if (!user) return;

    document.getElementById("modalUserName").textContent = user.name || "Unnamed User";
    document.getElementById("modalUserEmail").textContent = user.email || "N/A";
    document.getElementById("modalUserId").textContent = user.id || "N/A";
    document.getElementById("modalUserRole").textContent = (user.role || "student").toUpperCase();
    document.getElementById("modalUserStatus").textContent = (user.status || "active").toUpperCase();
    
    if (document.getElementById("modalUserEdu")) document.getElementById("modalUserEdu").textContent = user.education_type || "N/A";
    if (document.getElementById("modalUserClass")) document.getElementById("modalUserClass").textContent = user.class || "N/A";

    userModal.style.display = "flex";
  };

  window.closeModal = function() {
    userModal.style.display = "none";
  };

  window.toggleRole = async function(userId, newRole) {
    if (!confirm(`Change role to ${newRole.toUpperCase()}?`)) return;
    await executeAction("update-role", { userId, role: newRole });
  };

  window.toggleStatus = async function(userId, newStatus) {
    if (!confirm(`Set status to ${newStatus.toUpperCase()}?`)) return;
    await executeAction("update-status", { userId, status: newStatus });
  };

  window.deleteUser = async function(userId) {
    if (!confirm("Permanently delete this user?")) return;
    await executeAction("delete-user", { userId });
  };

  async function executeAction(action, payload) {
    try {
      const token = localStorage.getItem("nexusToken") || localStorage.getItem("token") || "";
      const res = await fetch(`${API_ENDPOINT}?action=${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Action failed");
      fetchUsers();
    } catch (err) {
      alert("Error: " + err.message);
    }
  }

  function renderLoadingState() {
    userTableBody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-msg">
          <i class="fas fa-spinner fa-spin"></i> Loading users...
        </td>
      </tr>
    `;
  }

  function escapeHtml(str) {
    return String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  fetchUsers();
});
