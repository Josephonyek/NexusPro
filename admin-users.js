document.addEventListener("DOMContentLoaded", () => {
  const API_ENDPOINT = "/api/user-auth.js";
  const userTableBody = document.getElementById("userTableBody");
  const searchInput = document.getElementById("searchInput");
  const roleFilter = document.getElementById("roleFilter");
  const statusFilter = document.getElementById("statusFilter");

  // Stats elements
  const statTotal = document.getElementById("statTotal");
  const statStudents = document.getElementById("statStudents");
  const statAdmins = document.getElementById("statAdmins");
  const statSuspended = document.getElementById("statSuspended");

  // Modal elements
  const userModal = document.getElementById("userModal");
  const closeModalBtn = document.getElementById("closeModalBtn");

  let allUsers = [];

  // 1. Guard check
  function checkAdminAccess() {
    const role = (localStorage.getItem("userRole") || "").toLowerCase();
    const token = localStorage.getItem("nexusToken") || localStorage.getItem("token");

    if (!token || role !== "admin") {
      alert("Access Denied: Admin authorization required.");
      window.location.href = "dashboard.html";
    }
  }
  checkAdminAccess();

  // 2. Fetch user list
  async function fetchUsers() {
    try {
      const token = localStorage.getItem("nexusToken") || localStorage.getItem("token");
      const res = await fetch(`${API_ENDPOINT}?action=list-users`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Failed to retrieve user data.");

      const data = await res.json();
      allUsers = data.users || [];
      
      updateStats(allUsers);
      renderUsers(allUsers);
    } catch (err) {
      console.error(err);
      userTableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: var(--danger); padding: 20px;">
            Error loading user database.
          </td>
        </tr>
      `;
    }
  }

  // 3. Stats update
  function updateStats(users) {
    if (statTotal) statTotal.textContent = users.length;
    if (statStudents) statStudents.textContent = users.filter(u => u.role === "student").length;
    if (statAdmins) statAdmins.textContent = users.filter(u => u.role === "admin").length;
    if (statSuspended) statSuspended.textContent = users.filter(u => u.status === "suspended").length;
  }

  // 4. Render Table
  function renderUsers(users) {
    if (users.length === 0) {
      userTableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 20px;">
            No users match the active filters.
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
            <strong>${escapeHtml(user.name || "Unnamed User")}</strong>
            <br><small style="color: var(--text-muted);">${escapeHtml(user.email)}</small>
          </td>
          <td><span class="badge ${user.role}">${user.role}</span></td>
          <td><span class="badge ${isSuspended ? "suspended" : "active"}">${isSuspended ? "Suspended" : "Active"}</span></td>
          <td>${formattedDate}</td>
          <td>
            <div class="action-group">
              <button class="btn-action" onclick="viewUserDetails('${user.id}')">Info</button>
              
              ${isSelf ? `<span style="color: var(--text-muted); font-size: 0.75rem; align-self: center;">(You)</span>` : `
                <button class="btn-action" onclick="toggleRole('${user.id}', '${nextRole}')">
                  ${user.role === "admin" ? "Demote" : "Promote"}
                </button>

                <button class="btn-action warn" onclick="toggleStatus('${user.id}', '${isSuspended ? "active" : "suspended"}')">
                  ${isSuspended ? "Activate" : "Suspend"}
                </button>

                <button class="btn-action danger" onclick="deleteUser('${user.id}', '${escapeHtml(user.name)}')">Delete</button>
              `}
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  // 5. Filtering logic
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

  // 6. Modal View Details
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

  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", () => {
      userModal.style.display = "none";
    });
  }

  // 7. Actions API Requests
  window.toggleRole = async function(userId, newRole) {
    if (!confirm(`Change role of this account to ${newRole.toUpperCase()}?`)) return;
    await executeAdminAction("update-role", { userId, role: newRole });
  };

  window.toggleStatus = async function(userId, newStatus) {
    if (!confirm(`Are you sure you want to set this user status to ${newStatus.toUpperCase()}?`)) return;
    await executeAdminAction("update-status", { userId, status: newStatus });
  };

  window.deleteUser = async function(userId, userName) {
    if (!confirm(`PERMANENT ACTION: Delete user "${userName}"? This cannot be undone.`)) return;
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
      if (!res.ok || !data.success) throw new Error(data.error || "Operation failed.");

      fetchUsers();
    } catch (err) {
      alert("Error: " + err.message);
    }
  }

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

  fetchUsers();
});
