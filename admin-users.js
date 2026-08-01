document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const userTableBody = document.getElementById("userTableBody");
  const searchInput = document.getElementById("searchInput");
  const roleFilter = document.getElementById("roleFilter");
  const statusFilter = document.getElementById("statusFilter");
  
  const debugBanner = document.getElementById("debugBanner");
  const debugText = document.getElementById("debugText");

  let allUsers = [];

  // Display visible banner on screen for instant troubleshooting
  function showBanner(message, type = "warning") {
    if (!debugBanner) return;
    debugText.innerHTML = message;
    debugBanner.className = `debug-banner ${type}`;
  }

  function getAuthToken() {
    return localStorage.getItem("nexusToken") || localStorage.getItem("token") || "";
  }

  // Fetch users via REST API
  window.fetchUsers = async function() {
    renderLoadingState();
    let fetchedData = null;
    let errors = [];

    const token = getAuthToken();

    // Primary route
    try {
      const res = await fetch("/api/user-auth?action=list-users", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        fetchedData = await res.json();
      } else {
        errors.push(`/api/user-auth returned status ${res.status}`);
      }
    } catch (e) {
      errors.push(`/api/user-auth error: ${e.message}`);
    }

    // Fallback route (.js extension)
    if (!fetchedData) {
      try {
        const res = await fetch("/api/user-auth.js?action=list-users", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          fetchedData = await res.json();
        } else {
          errors.push(`/api/user-auth.js returned status ${res.status}`);
        }
      } catch (e) {
        errors.push(`/api/user-auth.js error: ${e.message}`);
      }
    }

    // Parse Response Payload
    if (fetchedData) {
      if (Array.isArray(fetchedData)) {
        allUsers = fetchedData;
      } else if (fetchedData.users && Array.isArray(fetchedData.users)) {
        allUsers = fetchedData.users;
      } else if (typeof fetchedData === "object") {
        allUsers = Object.keys(fetchedData).map(k => ({ id: k, ...fetchedData[k] }));
      }

      showBanner(`<i class="fas fa-check-circle"></i> Successfully loaded ${allUsers.length} user record(s).`, "success");
      updateStats(allUsers);
      applyFilters();
    } else {
      console.warn("Failed to retrieve user data:", errors);
      showBanner(`<i class="fas fa-exclamation-triangle"></i> Could not connect to API. <br><small>${errors.join(" | ")}</small>`, "error");
      renderErrorState("No data returned from server backend.");
    }
  };

  // Safe Date Formatting
  function formatDate(rawDate) {
    if (!rawDate) return "N/A";
    const num = Number(rawDate);
    if (!isNaN(num) && num > 0) return new Date(num).toLocaleDateString();
    const parsed = new Date(rawDate);
    return isNaN(parsed.getTime()) ? "N/A" : parsed.toLocaleDateString();
  }

  // Update Top Stats Counter
  function updateStats(users) {
    document.getElementById("statTotal").textContent = users.length;
    document.getElementById("statStudents").textContent = users.filter(u => (u.role || "student").toLowerCase() === "student").length;
    document.getElementById("statAdmins").textContent = users.filter(u => (u.role || "").toLowerCase() === "admin").length;
    document.getElementById("statSuspended").textContent = users.filter(u => (u.status || "").toLowerCase() === "suspended").length;
  }

  // Render Table Rows
  function renderUsers(users) {
    if (!users || users.length === 0) {
      userTableBody.innerHTML = `
        <tr>
          <td colspan="5" class="empty-msg">
            <i class="fas fa-user-slash" style="font-size: 1.5rem; margin-bottom: 8px; display: block;"></i>
            No matching users found in directory.
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

      return `
        <tr>
          <td>
            <div class="user-info">
              <div class="name">${escapeHtml(user.name || "Unnamed User")}</div>
              <div class="email">${escapeHtml(user.email || "No Email Provided")}</div>
            </div>
          </td>
          <td>
            <span class="badge ${role}">
              <i class="fas ${role === "admin" ? "fa-user-shield" : "fa-user-graduate"}"></i>
              ${role}
            </span>
          </td>
          <td>
            <span class="badge ${isSuspended ? "suspended" : "active"}">
              <i class="fas ${isSuspended ? "fa-ban" : "fa-check-circle"}"></i>
              ${isSuspended ? "Suspended" : "Active"}
            </span>
          </td>
          <td>${formatDate(user.created_at || user.createdAt)}</td>
          <td>
            <div style="display:flex; gap:6px; flex-wrap:wrap;">
              <button class="btn-action" onclick="viewUserDetails('${user.id}')"><i class="fas fa-eye"></i> Info</button>
              <button class="btn-action" onclick="updateRole('${user.id}', '${nextRole}')">${role === "admin" ? "Demote" : "Promote"}</button>
              <button class="btn-action warn" onclick="updateStatus('${user.id}', '${isSuspended ? "active" : "suspended"}')">${isSuspended ? "Activate" : "Suspend"}</button>
              <button class="btn-action danger" onclick="deleteUser('${user.id}')"><i class="fas fa-trash"></i></button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  // Filter Search Controls
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

  // Modal View
  window.viewUserDetails = function(userId) {
    const user = allUsers.find(u => String(u.id) === String(userId));
    if (!user) return;

    document.getElementById("modalUserName").textContent = user.name || "Unnamed User";
    document.getElementById("modalUserEmail").textContent = user.email || "N/A";
    document.getElementById("modalUserId").textContent = user.id || "N/A";
    document.getElementById("modalUserRole").textContent = (user.role || "student").toUpperCase();
    document.getElementById("modalUserStatus").textContent = (user.status || "active").toUpperCase();
    document.getElementById("modalUserEdu").textContent = user.education_type || "N/A";
    document.getElementById("modalUserClass").textContent = user.class || "N/A";
    document.getElementById("modalUserJoined").textContent = formatDate(user.created_at || user.createdAt);

    document.getElementById("userModal").style.display = "flex";
  };

  window.closeModal = function() {
    document.getElementById("userModal").style.display = "none";
  };

  // User Management Actions
  window.updateRole = async function(userId, newRole) {
    if (!confirm(`Change role to ${newRole.toUpperCase()}?`)) return;
    await sendAction("update-role", { userId, role: newRole });
  };

  window.updateStatus = async function(userId, newStatus) {
    if (!confirm(`Change status to ${newStatus.toUpperCase()}?`)) return;
    await sendAction("update-status", { userId, status: newStatus });
  };

  window.deleteUser = async function(userId) {
    if (!confirm("Are you sure you want to permanently delete this user?")) return;
    await sendAction("delete-user", { userId });
  };

  async function sendAction(action, payload) {
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/user-auth?action=${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Action failed");
      fetchUsers();
    } catch (e) {
      alert("Error performing action: " + e.message);
    }
  }

  function renderLoadingState() {
    userTableBody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-msg">
          <i class="fas fa-spinner fa-spin" style="font-size: 1.5rem; color: var(--accent-blue); margin-bottom: 8px; display: block;"></i>
          Fetching database records...
        </td>
      </tr>
    `;
  }

  function renderErrorState(msg) {
    userTableBody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-msg" style="color: var(--danger);">
          <i class="fas fa-exclamation-triangle" style="font-size: 1.5rem; margin-bottom: 8px; display: block;"></i>
          ${escapeHtml(msg)}
        </td>
      </tr>
    `;
  }

  function escapeHtml(str) {
    return String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // Initial Fetch
  fetchUsers();
});
