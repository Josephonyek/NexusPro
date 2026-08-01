// admin_users.js

document.addEventListener("DOMContentLoaded", () => {
  const API_ENDPOINT = "/api/user-auth.js";
  const userTableBody = document.getElementById("userTableBody");
  const searchInput = document.getElementById("searchInput");
  const roleFilter = document.getElementById("roleFilter");
  const statusFilter = document.getElementById("statusFilter");

  const statTotal = document.getElementById("statTotal");
  const statStudents = document.getElementById("statStudents");
  const statAdmins = document.getElementById("statAdmins");
  const statSuspended = document.getElementById("statSuspended");

  const userModal = document.getElementById("userModal");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const closeModalBtn2 = document.getElementById("closeModalBtn2");

  let allUsers = [];
  let isLoading = false;

  // ========== ACCESS CHECK ==========
  function checkAdminAccess() {
    const role = (localStorage.getItem("userRole") || "").toLowerCase();
    const token = localStorage.getItem("nexusToken") || localStorage.getItem("token");

    if (!token || role !== "admin") {
      alert("Access Denied: Admin authorization required.");
      window.location.href = "dashboard.html";
    }
  }
  checkAdminAccess();

  // ========== SHOW LOADING STATE ==========
  function showLoading() {
    userTableBody.innerHTML = `
      <tr>
        <td colspan="5" class="table-message">
          <div style="display:flex; flex-direction:column; align-items:center; gap:12px;">
            <div style="width:36px; height:36px; border:3px solid #334155; border-top-color:#38bdf8; border-radius:50%; animation:spin 0.8s linear infinite;"></div>
            <div>Loading user records...</div>
          </div>
        </td>
      </tr>
    `;
  }

  // ========== FETCH USERS (with timeout) ==========
  async function fetchUsers() {
    if (isLoading) return;
    isLoading = true;
    showLoading();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

    try {
      const token = localStorage.getItem("nexusToken") || localStorage.getItem("token");

      const res = await fetch(`${API_ENDPOINT}?action=list-users`, {
        headers: { "Authorization": `Bearer ${token}` },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) throw new Error("Failed to fetch registry.");

      const data = await res.json();
      allUsers = data.users || [];

      updateStats(allUsers);
      renderUsers(allUsers);
    } catch (err) {
      clearTimeout(timeoutId);
      console.error(err);

      const isTimeout = err.name === "AbortError";
      userTableBody.innerHTML = `
        <tr>
          <td colspan="5" class="table-message" style="color: var(--danger);">
            <div style="display:flex; flex-direction:column; align-items:center; gap:14px;">
              <div>
                <i class="fas fa-exclamation-circle" style="font-size:1.4rem; margin-bottom:6px;"></i><br>
                ${isTimeout ? "Request timed out. The server is taking too long." : "Error loading user directory."}
              </div>
              <button class="btn" onclick="fetchUsers()" style="padding:9px 18px;">
                <i class="fas fa-redo"></i> Try Again
              </button>
            </div>
          </td>
        </tr>
      `;
    } finally {
      isLoading = false;
    }
  }

  // Make fetchUsers available globally (for Refresh & Retry buttons)
  window.fetchUsers = fetchUsers;

  // ========== STATS ==========
  function updateStats(users) {
    if (statTotal) statTotal.textContent = users.length;
    if (statStudents) statStudents.textContent = users.filter(u => u.role === "student").length;
    if (statAdmins) statAdmins.textContent = users.filter(u => u.role === "admin").length;
    if (statSuspended) statSuspended.textContent = users.filter(u => u.status === "suspended").length;
  }

  // ========== RENDER TABLE ==========
  function renderUsers(users) {
    if (users.length === 0) {
      userTableBody.innerHTML = `
        <tr>
          <td colspan="5" class="table-message">
            <i class="fas fa-search" style="margin-right: 8px;"></i>
            No matching accounts found.
          </td>
        </tr>
      `;
      return;
    }

    const currentEmail = getActiveUserEmail();

    userTableBody.innerHTML = users.map(user => {
      const isSelf = user.email.toLowerCase() === currentEmail.toLowerCase();
      const nextRole = user.role === "admin" ? "student" : "admin";
      const isSuspended = user.status === "suspended";
      const formattedDate = user.created_at ? new Date(Number(user.created_at)).toLocaleDateString() : "N/A";

      return `
        <tr>
          <td>
            <div class="user-name">${escapeHtml(user.name || "Unnamed Account")}</div>
            <div class="user-email">${escapeHtml(user.email)}</div>
          </td>
          <td><span class="badge ${user.role}">${user.role}</span></td>
          <td><span class="badge ${isSuspended ? "suspended" : "active"}">${isSuspended ? "Suspended" : "Active"}</span></td>
          <td style="color: var(--text-muted); font-size: 0.85rem;">${formattedDate}</td>
          <td>
            <div class="action-group">
              <button class="btn" onclick="viewUserDetails('${user.id}')">
                <i class="fas fa-info-circle"></i> Info
              </button>
              
              ${isSelf ? `<span class="self-label">(You)</span>` : `
                <button class="btn" onclick="toggleRole('${user.id}', '${nextRole}')">
                  <i class="fas fa-user-tag"></i>
                  ${user.role === "admin" ? "Demote" : "Promote"}
                </button>

                <button class="btn warn" onclick="toggleStatus('${user.id}', '${isSuspended ? "active" : "suspended"}')">
                  <i class="fas fa-${isSuspended ? "check-circle" : "ban"}"></i>
                  ${isSuspended ? "Activate" : "Suspend"}
                </button>

                <button class="btn danger" onclick="deleteUser('${user.id}', '${escapeHtml(user.name)}')">
                  <i class="fas fa-trash-alt"></i> Delete
                </button>
              `}
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  // ========== FILTERING ==========
  function applyFilters() {
    const search = searchInput.value.toLowerCase().trim();
    const role = roleFilter.value;
    const status = statusFilter.value;

    const filtered = allUsers.filter(u => {
      const matchesSearch = (u.name && u.name.toLowerCase().includes(search)) || u.email.toLowerCase().includes(search);
      const matchesRole = role === "all" || u.role === role;
      const matchesStatus = status === "all" || (u.status || "active") === status;
      return matchesSearch && matchesRole && matchesStatus;
    });

    renderUsers(filtered);
  }

  searchInput.addEventListener("input", applyFilters);
  roleFilter.addEventListener("change", applyFilters);
  statusFilter.addEventListener("change", applyFilters);

  // ========== MODAL ==========
  window.viewUserDetails = function(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;

    document.getElementById("modalUserName").textContent = user.name || "N/A";
    document.getElementById("modalUserEmail").textContent = user.email;
    document.getElementById("modalUserId").textContent = user.id;
    document.getElementById("modalUserRole").textContent = user.role.toUpperCase();
    document.getElementById("modalUserStatus").textContent = (user.status || "active").toUpperCase();
    document.getElementById("modalUserEdu").textContent = user.education_type || "N/A";
    document.getElementById("modalUserClass").textContent = user.class || "N/A";
    document.getElementById("modalUserCourse").textContent = user.course || "N/A";
    document.getElementById("modalUserLevel").textContent = user.level || "N/A";
    document.getElementById("modalUserJoined").textContent = user.created_at ? new Date(Number(user.created_at)).toLocaleString() : "N/A";

    userModal.style.display = "flex";
  };

  function closeModal() {
    userModal.style.display = "none";
  }

  if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
  if (closeModalBtn2) closeModalBtn2.addEventListener("click", closeModal);

  userModal.addEventListener("click", (e) => {
    if (e.target === userModal) closeModal();
  });

  // ========== ACTIONS ==========
  window.toggleRole = async function(userId, newRole) {
    if (!confirm(`Switch this user's role to ${newRole.toUpperCase()}?`)) return;
    await executeAdminAction("update-role", { userId, role: newRole });
  };

  window.toggleStatus = async function(userId, newStatus) {
    if (!confirm(`Set this account status to ${newStatus.toUpperCase()}?`)) return;
    await executeAdminAction("update-status", { userId, status: newStatus });
  };

  window.deleteUser = async function(userId, userName) {
    if (!confirm(`PERMANENT DELETION: Are you sure you want to delete "${userName}"?`)) return;
    await executeAdminAction("delete-user", { userId });
  };

  async function executeAdminAction(action, payload) {
    try {
      const token = localStorage.getItem("nexusToken") || localStorage.getItem("token");
      const res = await fetch(`${API_ENDPOINT}?action=${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Execution failed.");

      fetchUsers();
    } catch (err) {
      alert("Error: " + err.message);
    }
  }

  // ========== HELPERS ==========
  function getActiveUserEmail() {
    try {
      const u = JSON.parse(localStorage.getItem("nexusUser"));
      return u?.email || "";
    } catch (e) {
      return "";
    }
  }

  function escapeHtml(str) {
    return String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // Start loading
  fetchUsers();
});
