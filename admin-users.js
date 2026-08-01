document.addEventListener("DOMContentLoaded", () => {
  const API_ENDPOINT = "/api/user-auth.js";
  const userTableBody = document.getElementById("userTableBody");
  const searchInput = document.getElementById("searchInput");
  const roleFilter = document.getElementById("roleFilter");
  const categoryFilter = document.getElementById("categoryFilter");

  let allUsers = [];

  // ================= 1. GUARD: ENSURE ADMIN ACCESS =================
  function checkAdminAccess() {
    const role = (localStorage.getItem("userRole") || "").toLowerCase();
    const token = localStorage.getItem("nexusToken") || localStorage.getItem("token");

    if (!token || role !== "admin") {
      alert("Access Denied: Administrative privileges required.");
      window.location.href = "dashboard.html";
    }
  }

  checkAdminAccess();

  // ================= 2. FETCH USERS FROM API =================
  async function fetchUsers() {
    try {
      const token = localStorage.getItem("nexusToken") || localStorage.getItem("token");
      const res = await fetch(`${API_ENDPOINT}?action=list-users`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error("Failed to load user list");

      const data = await res.json();
      allUsers = data.users || [];
      renderUsers(allUsers);
    } catch (err) {
      console.error(err);
      userTableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: var(--danger); padding: 20px;">
            Unable to fetch user record list.
          </td>
        </tr>
      `;
    }
  }

  // ================= 3. RENDER USER TABLE =================
  function renderUsers(users) {
    if (users.length === 0) {
      userTableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 20px;">
            No registered users found matching the selected criteria.
          </td>
        </tr>
      `;
      return;
    }

    userTableBody.innerHTML = users.map(user => {
      const isSelf = user.email === getActiveUserEmail();
      const nextRole = user.role === "admin" ? "student" : "admin";
      const btnText = user.role === "admin" ? "Demote to Student" : "Promote to Admin";

      return `
        <tr>
          <td><strong>${escapeHtml(user.name || "N/A")}</strong></td>
          <td>${escapeHtml(user.email)}</td>
          <td>${escapeHtml(user.education_type || "Standard")} ${user.class ? `(${user.class})` : ""}</td>
          <td>
            <span class="role-badge ${user.role}">
              ${user.role}
            </span>
          </td>
          <td>
            ${isSelf ? `<span style="color: var(--text-muted); font-size: 0.8rem;">Current Account</span>` : `
              <button class="action-btn" onclick="toggleUserRole('${user.id}', '${nextRole}')">
                ${btnText}
              </button>
            `}
          </td>
        </tr>
      `;
    }).join("");
  }

  // ================= 4. FILTERING & SEARCH LOGIC =================
  function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const selectedRole = roleFilter.value;
    const selectedCategory = categoryFilter.value;

    const filtered = allUsers.filter(user => {
      const matchesSearch = (user.name && user.name.toLowerCase().includes(searchTerm)) || 
                            user.email.toLowerCase().includes(searchTerm);
      const matchesRole = selectedRole === "all" || user.role === selectedRole;
      const matchesCategory = selectedCategory === "all" || user.education_type === selectedCategory;

      return matchesSearch && matchesRole && matchesCategory;
    });

    renderUsers(filtered);
  }

  searchInput.addEventListener("input", applyFilters);
  roleFilter.addEventListener("change", applyFilters);
  categoryFilter.addEventListener("change", applyFilters);

  // ================= 5. TOGGLE ROLE ACTION =================
  window.toggleUserRole = async function(userId, newRole) {
    if (!confirm(`Are you sure you want to change this user's role to ${newRole.toUpperCase()}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("nexusToken") || localStorage.getItem("token");
      const res = await fetch(`${API_ENDPOINT}?action=update-role`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ userId, role: newRole })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update role");
      }

      // Refresh list
      fetchUsers();
    } catch (err) {
      alert("Error updating role: " + err.message);
    }
  };

  // Helper Utilities
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

  // Initial load
  fetchUsers();
});
