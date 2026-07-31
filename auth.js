// ========== UI CONTROL FUNCTIONS ==========

// 1. Tab Switcher
function switchTab(tab) {
  const loginForm = document.getElementById("login-form");
  const signupForm = document.getElementById("signup-form");
  const loginTabBtn = document.getElementById("tab-login");
  const signupTabBtn = document.getElementById("tab-signup");

  if (tab === "login") {
    loginForm.classList.add("active");
    signupForm.classList.remove("active");
    loginTabBtn.classList.add("active");
    signupTabBtn.classList.remove("active");
  } else {
    signupForm.classList.add("active");
    loginForm.classList.remove("active");
    signupTabBtn.classList.add("active");
    loginTabBtn.classList.remove("active");
  }
}

// 2. Hide/Show Password Toggle
function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  if (input.type === "password") {
    input.type = "text";
    btn.textContent = "Hide";
  } else {
    input.type = "password";
    btn.textContent = "Show";
  }
}

// 3. Modal Handlers
function openForgotModal() {
  document.getElementById("forgot-modal").classList.add("active");
}

function closeForgotModal() {
  document.getElementById("forgot-modal").classList.remove("active");
}

function handleForgotSubmit(e) {
  e.preventDefault();
  const email = document.getElementById("forgot-email").value;
  alert(`If an account with ${email} exists, password reset instructions have been sent.`);
  closeForgotModal();
}

// ========== API REQUEST HANDLERS ==========

// 1. Submit Login Form
document.getElementById("login-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  try {
    const response = await fetch("/api/user-auth?action=login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error);

    // Save JWT token and profile details locally
    localStorage.setItem("nx_token", data.token);
    localStorage.setItem("nx_role", data.user.role);
    localStorage.setItem("nx_name", data.user.name);
    localStorage.setItem("nx_uid", data.user.uid);

    window.location.replace("dashboard.html");
  } catch (err) {
    alert(err.message || "Login failed.");
  }
});

// 2. Submit Sign Up Form
document.getElementById("signup-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    firstName: document.getElementById("first-name").value.trim(),
    lastName: document.getElementById("last-name").value.trim(),
    email: document.getElementById("signup-email").value.trim(),
    password: document.getElementById("signup-password").value,
    educationType: document.getElementById("education-type").value
  };

  try {
    const response = await fetch("/api/user-auth?action=signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error);

    // Save JWT token and profile details locally
    localStorage.setItem("nx_token", data.token);
    localStorage.setItem("nx_role", data.user.role);
    localStorage.setItem("nx_name", data.user.name);
    localStorage.setItem("nx_uid", data.user.uid);

    window.location.replace("dashboard.html");
  } catch (err) {
    alert(err.message || "Sign up failed.");
  }
});
