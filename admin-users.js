document.addEventListener("DOMContentLoaded", () => {
  // Support both endpoint variations
  const API_ENDPOINT = "/api/user-auth"; 
  
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
  const closeModalBtn = document.getElementById("closeModalBtn");
  const closeModalBtn2 = document.getElementById("closeModalBtn2");

  let allUsers = [];

  // Get Auth Token from local storage safely
  function getAuthToken() {
    return localStorage.getItem("nexusToken") || localStorage.getItem("token") || "";
  }

  // ================= 1. GUARD & ACCESS CHECK =================
  function checkAdminAccess() {
    const role = (localStorage.getItem("userRole") || "").toLowerCase();
    const token = getAuthToken();

    if (!token && role !== "admin") {
      console.warn("No token or admin role detected.");
    }
  }
  checkAdminAccess();

  // ================= 2. FETCH USERS FROM BACKEND =================
  window.fetchUsers = async function() {
    renderLoadingState();
    try {
      const token = getAuthToken();
      
      // Try fetching from endpoint
      let res = await fetch(`${API_ENDPOINT}?action=list-users`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      // Fallback if routing requires .js extension
      if (res.status === 404) {
        res = await fetch(`${API_ENDPOINT}.js?action=list-users`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
      }

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      const data = await res.json();
      console.log("Fetched User Data Payload:", data);

      // Handle array or wrapped object
      allUsers = Array.isArray(data) ? data : (data.users || []);

      updateStats(allUsers);
      applyFilters();
    } catch (err) {
      console.error("Error fetching users:", err);
      userTableBody.innerHTML = `
        <tr>
          <td colspan="5" class="table-message" style="color: var(--danger);">
            <i class="fas fa-exclamation-triangle" style="font-size: 1.5rem; margin-bottom: 8px; display: block;"></i>
            Error loading user database: ${escapeHtml(err.message)}
          </td>
        </tr>
      `;
    }
  };

  // ================= 3. STATS UPDATER =================
  function updateStats(users) {
    if (statTotal) statTotal.textContent = users.length;
    if (statStudents) statStudents.textContent = users.filter(u => (u.role || "student").toLowerCase() === "student").length;
    if (statAdmins) statAdmins.textContent = users.filter(u => (u.role || "").toLowerCase() === "admin").length;
    if (statSuspended) statSuspended.textContent = users.filter(u => (u.status || "").toLowerCase() === "suspended").length;
  }

  // Safe Date Formatter
  function formatDate(rawDate) {
    if (!rawDate) return "N/A";
    const num = Number(rawDate);
    if (!isNaN(num) && num > 0) {
      return new Date(num).toLocaleDateString();
    }
    const parsed = new Date(rawDate);
    return isNaN(parsed.getTime()) ? "N/A" : parsed.toLocaleDateString();
  }

  // ================= 4. TABLE RENDERER =================
  function renderUsers(users) {
    if (!users || users.length === 0) {
      userTableBody.innerHTML = `
        <tr>
          <td colspan="5" class="table-message">
            <i class="fas fa-user-slash" style="font-size: 1.5rem; margin-bottom: 8px; display: block; color: var(--text-dim);"></i>
            No matching users found in database.
          </td>
        </tr>
      `;
      return;
    }

    const currentEmail = getActiveUserEmail();

    userTableBody.innerHTML = users.map(user => {
      const email = user.email || "No Email";
      const isSelf = currentEmail && email.toLowerCase() === currentEmail.toLowerCase();
      const role = (user.role || "student").toLowerCase();
      const nextRole = role === "admin" ? "student" : "admin";
      const isSuspended = (user.status || "active").toLowerCase() === "suspended";
      const formattedDate = formatDate(user.created_at);

      return `
        <tr>
          <td>
            <div class="user-name">${escapeHtml(user.name || "Unnamed User")}</div>
            <div class="user-email">${escapeHtml(email)}</div>
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
          <td>${formattedDate}</td>
          <td>
            <div class="action-group">
              <button class="btn" onclick="viewUserDetails('${user.id}')" title="View Profile Info">
                <i class="fas fa-eye"></i> Info
              </button>

              ${isSelf ? `<span class="self-label">(You)</span>` : `
                <button class="btn" onclick="toggleRole('${user.id}', '${nextRole}')">
                  <i class="fas ${role === "admin" ? "fa-user-minus" : "fa-user-plus"}"></i>
                  ${role === "admin" ? "Demote" : "Promote"}
                </button>

                <button class="btn warn" onclick="toggleStatus('${user.id}', '${isSuspended ? "active" : "suspended"}')">
                  <i class="fas ${isSuspended ? "fa-user-check" : "fa-user-lock"}"></i>
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

  // ================= 5. FILTERING =================
  function applyFilters() {
    const search = searchInput.value.toLowerCase().trim();
    const role = roleFilter.value.toLowerCase();
    const status = statusFilter.value.toLowerCase();

    const filtered = allUsers.filter(u => {
      const nameMatch = u.name && u.name.toLowerCase().includes(search);
      const emailMatch = u.email && u.email.toLowerCase().includes(search);
      const matchesSearch = search === "" || nameMatch || emailMatch;

      const matchesRole = role === "all" || (u.role || "student").toLowerCase() === role;
      const matchesStatus = status === "all" || (u.status || "active").toLowerCase() === status;

      return matchesSearch && matchesRole && matchesStatus;
    });

    renderUsers(filtered);
  }

  searchInput.addEventListener("input", applyFilters);
  roleFilter.addEventListener("change", applyFilters);
  statusFilter.addEventListener("change", applyFilters);

  // ================= 6. MODAL VIEW DETAILS =================
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
    document.getElementById("modalUserCourse").textContent = user.course || "N/A";
    document.getElementById("modalUserLevel").textContent = user.level || "N/A";
    document.getElementById("modalUserJoined").textContent = formatDate(user.created_at);

    userModal.style.display = "flex";
  };

  function hideModal() {
    userModal.style.display = "none";
  }

  if (closeModalBtn) closeModalBtn.addEventListener("click", hideModal);
  if (closeModalBtn2) closeModalBtn2.addEventListener("click", hideModal);

  userModal.addEventListener("click", (e) => {
    if (e.target === userModal) hideModal();
  });

  // ================= 7. ACTIONS (ROLE, SUSPEND, DELETE) =================
  window.toggleRole = async function(userId, newRole) {
    if (!confirm(`Change role to ${newRole.toUpperCase()}?`)) return;
    await executeAdminAction("update-role", { userId, role: newRole });
  };

  window.toggleStatus = async function(userId, newStatus) {
    if (!confirm(`Set account status to ${newStatus.toUpperCase()}?`)) return;
    await executeAdminAction("update-status", { userId, status: newStatus });
  };

  window.deleteUser = async function(userId, userName) {
    if (!confirm(`Permanently delete user "${userName}"?`)) return;
    await executeAdminAction("delete-user", { userId });
  };

  async function executeAdminAction(action, payload) {
    try {
      const token = getAuthToken();
      let res = await fetch(`${API_ENDPOINT}?action=${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.status === 404) {
        res = await fetch(`${API_ENDPOINT}.js?action=${action}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Action failed.");

      fetchUsers();
    } catch (err) {
      alert("Error: " + err.message);
    }
  }

  // ================= 8. UTILITIES =================
  function renderLoadingState() {
    userTableBody.innerHTML = `
      <tr>
        <td colspan="5" class="table-message">
          <i class="fas fa-spinner fa-spin" style="font-size: 1.5rem; margin-bottom: 8px; display: block; color: var(--accent);"></i>
          Fetching database records...
        </td>
      </tr>
    `;
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
    return String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  fetchUsers();
});
