// ================= UI SWITCHERS =================

// Tab Switching (Login / Signup)
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

// Password Visibility Toggle
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

// Dynamic Education Dropdown Toggle
function handleEducationChange(selectedType) {
  const secondaryFields = document.getElementById("secondary-fields");
  const tertiaryFields = document.getElementById("tertiary-fields");

  if (selectedType === "secondary") {
    secondaryFields.style.display = "block";
    tertiaryFields.style.display = "none";
  } else if (selectedType === "tertiary") {
    secondaryFields.style.display = "none";
    tertiaryFields.style.display = "flex";
  }
}

// Modal Toggle Handlers
function openForgotModal() {
  document.getElementById("forgot-modal").classList.add("active");
}

function closeForgotModal() {
  document.getElementById("forgot-modal").classList.remove("active");
}

function handleForgotSubmit(e) {
  e.preventDefault();
  const email = document.getElementById("forgot-email").value;
  alert(`If an account exists for ${email}, password reset details will be sent.`);
  closeForgotModal();
}

// ================= API SUBMISSIONS =================

// Login Submission
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

    // Save tokens locally
    localStorage.setItem("nx_token", data.token);
    localStorage.setItem("nx_role", data.user.role);
    localStorage.setItem("nx_name", data.user.name);
    localStorage.setItem("nx_uid", data.user.uid);

    window.location.replace("dashboard.html");
  } catch (err) {
    alert(err.message || "Login failed.");
  }
});

// Signup Submission
document.getElementById("signup-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const password = document.getElementById("signup-password").value;
  const confirmPassword = document.getElementById("confirm-password").value;

  if (password !== confirmPassword) {
    alert("Passwords do not match!");
    return;
  }

  const edType = document.getElementById("education-type").value;

  const payload = {
    firstName: document.getElementById("first-name").value.trim(),
    lastName: document.getElementById("last-name").value.trim(),
    email: document.getElementById("signup-email").value.trim(),
    password: password,
    educationType: edType,
    studentClass: edType === "secondary" ? document.getElementById("secondary-class").value : null,
    course: edType === "tertiary" ? document.getElementById("tertiary-course").value.trim() : null,
    level: edType === "tertiary" ? document.getElementById("tertiary-level").value : null
  };

  try {
    const response = await fetch("/api/user-auth?action=signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error);

    // Save tokens locally
    localStorage.setItem("nx_token", data.token);
    localStorage.setItem("nx_role", data.user.role);
    localStorage.setItem("nx_name", data.user.name);
    localStorage.setItem("nx_uid", data.user.uid);

    window.location.replace("dashboard.html");
  } catch (err) {
    alert(err.message || "Sign up failed.");
  }
});
