// ========== DOM ==========
const loginForm     = document.getElementById("login-form");
const signupForm    = document.getElementById("signup-form");
const forgotForm    = document.getElementById("forgot-form");
const errorBox      = document.getElementById("error-message");
const successBox    = document.getElementById("success-message");
const tabsContainer = document.getElementById("tabs");
const pageTitle     = document.getElementById("page-title");
const pageSubtitle  = document.getElementById("page-subtitle");

const educationType   = document.getElementById("education-type");
const secondaryFields = document.getElementById("secondary-fields");
const tertiaryFields  = document.getElementById("tertiary-fields");

// ========== Helpers ==========
function showError(msg) {
  if (successBox) successBox.style.display = "none";
  if (errorBox) {
    errorBox.textContent = msg;
    errorBox.style.display = "block";
  }
}

function showSuccess(msg) {
  if (errorBox) errorBox.style.display = "none";
  if (successBox) {
    successBox.textContent = msg;
    successBox.style.display = "block";
  }
}

function hideMessages() {
  if (errorBox) errorBox.style.display = "none";
  if (successBox) successBox.style.display = "none";
}

function showSection(sectionId) {
  document.querySelectorAll(".form-section").forEach(section => {
    section.classList.remove("active");
  });
  const target = document.getElementById(sectionId);
  if (target) {
    target.classList.add("active");
  } else {
    console.error("Section not found:", sectionId);
  }
}

function resetToLoginView() {
  hideMessages();
  if (tabsContainer) tabsContainer.style.display = "flex";
  if (pageTitle) pageTitle.textContent = "Welcome";
  if (pageSubtitle) pageSubtitle.textContent = "Sign in to your account or create a new one";

  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  const loginTab = document.querySelector('.tab[data-tab="login"]');
  if (loginTab) loginTab.classList.add("active");

  showSection("login-form");
}

// ========== TAB SWITCHING ==========
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    console.log("Tab clicked:", tab.getAttribute("data-tab"));

    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");

    hideMessages();
    if (tabsContainer) tabsContainer.style.display = "flex";
    if (pageTitle) pageTitle.textContent = "Welcome";
    if (pageSubtitle) pageSubtitle.textContent = "Sign in to your account or create a new one";

    const target = tab.getAttribute("data-tab");
    showSection(target + "-form");
  });
});

// ========== SHOW / HIDE PASSWORD ==========
document.querySelectorAll(".toggle-password").forEach(btn => {
  btn.addEventListener("click", () => {
    const targetId = btn.getAttribute("data-target");
    const input = document.getElementById(targetId);
    if (!input) return;

    if (input.type === "password") {
      input.type = "text";
      btn.textContent = "Hide";
    } else {
      input.type = "password";
      btn.textContent = "Show";
    }
  });
});

// ========== EDUCATION TYPE ==========
if (educationType) {
  educationType.addEventListener("change", () => {
    const value = educationType.value;
    if (secondaryFields) secondaryFields.classList.add("hidden");
    if (tertiaryFields) tertiaryFields.classList.add("hidden");

    if (value === "secondary" && secondaryFields) {
      secondaryFields.classList.remove("hidden");
    } else if (value === "tertiary" && tertiaryFields) {
      tertiaryFields.classList.remove("hidden");
    }
  });
}

// ========== FORGOT PASSWORD ==========
const forgotLink = document.getElementById("forgot-password-link");
if (forgotLink) {
  forgotLink.addEventListener("click", (e) => {
    e.preventDefault();
    console.log("Forgot password clicked");
    hideMessages();

    if (tabsContainer) tabsContainer.style.display = "none";
    if (pageTitle) pageTitle.textContent = "Reset Password";
    if (pageSubtitle) pageSubtitle.textContent = "Enter your email to receive a reset link";

    showSection("forgot-form");
  });
}

// ========== BACK TO LOGIN ==========
const backToLogin = document.getElementById("back-to-login");
if (backToLogin) {
  backToLogin.addEventListener("click", (e) => {
    e.preventDefault();
    resetToLoginView();
  });
}

// ========== TEMPORARY FORM HANDLERS (just for testing) ==========
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    showError("Firebase is temporarily disabled for testing. Toggle should work now.");
  });
}

if (signupForm) {
  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    showError("Firebase is temporarily disabled for testing.");
  });
}

if (forgotForm) {
  forgotForm.addEventListener("submit", (e) => {
    e.preventDefault();
    showSuccess("Firebase is temporarily disabled. UI is working.");
  });
}

console.log("Auth UI script loaded successfully");
