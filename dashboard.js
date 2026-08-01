document.addEventListener("DOMContentLoaded", () => {
  // ================= 1. LIGHT / DARK MODE CONTROLLER =================
  const themeToggleBtn = document.getElementById("themeToggleBtn");
  const themeIcon = document.getElementById("themeIcon");
  const themeText = document.getElementById("themeText");

  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("nexusTheme", theme);

    if (theme === "dark") {
      if (themeIcon) themeIcon.textContent = "☀️";
      if (themeText) themeText.textContent = "Light Mode";
    } else {
      if (themeIcon) themeIcon.textContent = "🌙";
      if (themeText) themeText.textContent = "Dark Mode";
    }
  }

  // Detect saved theme or operating system preference
  const savedTheme = localStorage.getItem("nexusTheme");
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  if (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) {
    setTheme("dark");
  } else {
    setTheme("light");
  }

  // Toggle button click event
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      const currentTheme = document.documentElement.getAttribute("data-theme");
      const nextTheme = currentTheme === "dark" ? "light" : "dark";
      setTheme(nextTheme);
    });
  }

  // ================= 2. AUTOMATIC ROLE DETECTION =================
  const roleBadge = document.getElementById("roleBadge");
  const studentView = document.getElementById("studentView");
  const adminView = document.getElementById("adminView");

  function getActiveUserRole() {
    // A. Check for JWT token in local storage
    const token = localStorage.getItem("nexusToken") || localStorage.getItem("token");

    if (token) {
      try {
        // Decode payload from JWT (base64)
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        );

        const parsedToken = JSON.parse(jsonPayload);
        if (parsedToken && parsedToken.role) {
          return parsedToken.role.toLowerCase();
        }
      } catch (err) {
        console.warn("Error parsing JWT payload:", err);
      }
    }

    // B. Check for stored user object
    const userJson = localStorage.getItem("nexusUser") || localStorage.getItem("user");
    if (userJson) {
      try {
        const userObj = JSON.parse(userJson);
        if (userObj && userObj.role) {
          return userObj.role.toLowerCase();
        }
      } catch (err) {
        console.warn("Error parsing user object:", err);
      }
    }

    // C. Fallback to raw role string or default to student
    return (localStorage.getItem("userRole") || "student").toLowerCase();
  }

  function renderRoleDashboard() {
    const role = getActiveUserRole();

    if (role === "admin") {
      if (roleBadge) roleBadge.textContent = "Admin View";
      if (studentView) studentView.classList.remove("active");
      if (adminView) adminView.classList.add("active");
    } else {
      if (roleBadge) roleBadge.textContent = "Student View";
      if (adminView) adminView.classList.remove("active");
      if (studentView) studentView.classList.add("active");
    }
  }

  // Run automatic role check on startup
  renderRoleDashboard();

  // ================= 3. MOBILE HAMBURGER SIDEBAR =================
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const sidebar = document.getElementById("sidebar");

  if (hamburgerBtn && sidebar) {
    hamburgerBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      sidebar.classList.toggle("open");
    });

    // Close mobile menu when clicking outside sidebar
    document.addEventListener("click", (e) => {
      if (
        sidebar.classList.contains("open") &&
        !sidebar.contains(e.target) &&
        !hamburgerBtn.contains(e.target)
      ) {
        sidebar.classList.remove("open");
      }
    });
  }
});
