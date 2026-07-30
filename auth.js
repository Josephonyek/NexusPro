import { auth, rtdb } from "./firebase-config.js";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { ref, set } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Force session persistence for mobile devices
setPersistence(auth, browserLocalPersistence).catch(err => {
  console.warn("Auth persistence error:", err);
});

// ========== DOM ELEMENTS ==========
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

const btnLogin  = document.getElementById("btn-login");
const btnSignup = document.getElementById("btn-signup");
const btnForgot = document.getElementById("btn-forgot");

if (btnLogin)  btnLogin.dataset.originalText  = "Sign In";
if (btnSignup) btnSignup.dataset.originalText = "Create Account";
if (btnForgot) btnForgot.dataset.originalText = "Send Reset Link";

// ========== HELPERS ==========
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

function setLoading(button, isLoading, loadingText) {
  if (!button) return;
  button.disabled = isLoading;
  button.textContent = isLoading ? loadingText : (button.dataset.originalText || button.textContent);
}

function showSection(sectionId) {
  document.querySelectorAll(".form-section").forEach(section => {
    section.classList.remove("active");
  });
  const target = document.getElementById(sectionId);
  if (target) target.classList.add("active");
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

// ========== TAB SWITCHING (Event Delegation) ==========
if (tabsContainer) {
  tabsContainer.addEventListener("click", (e) => {
    const tab = e.target.closest(".tab");
    if (!tab) return;

    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");

    hideMessages();
    if (tabsContainer) tabsContainer.style.display = "flex";
    if (pageTitle) pageTitle.textContent = "Welcome";
    if (pageSubtitle) pageSubtitle.textContent = "Sign in to your account or create a new one";

    const target = tab.getAttribute("data-tab");
    showSection(target + "-form");
  });
}

// ========== SHOW / HIDE PASSWORD ==========
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("toggle-password")) {
    const targetId = e.target.getAttribute("data-target");
    const input = document.getElementById(targetId);
    if (!input) return;

    if (input.type === "password") {
      input.type = "text";
      e.target.textContent = "Hide";
    } else {
      input.type = "password";
      e.target.textContent = "Show";
    }
  }
});

// ========== EDUCATION TYPE TOGGLE ==========
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

// ========== FORGOT PASSWORD LINK ==========
const forgotLink = document.getElementById("forgot-password-link");
if (forgotLink) {
  forgotLink.addEventListener("click", (e) => {
    e.preventDefault();
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

// ========== LOGIN ==========
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideMessages();

    const email = document.getElementById("login-email")?.value.trim();
    const password = document.getElementById("login-password")?.value;

    if (!email || !password) {
      showError("Please fill in both email and password.");
      return;
    }

    setLoading(btnLogin, true, "Signing in...");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle navigation
    } catch (err) {
      console.error(err);
      let msg = "Login failed. Please try again.";

      if (err.code === "auth/invalid-credential" || 
          err.code === "auth/wrong-password" || 
          err.code === "auth/user-not-found") {
        msg = "Incorrect email or password.";
      } else if (err.code === "auth/too-many-requests") {
        msg = "Too many attempts. Please try again later.";
      } else if (err.code === "auth/user-disabled") {
        msg = "This account has been disabled.";
      }

      showError(msg);
      setLoading(btnLogin, false);
    }
  });
}

// ========== FORGOT PASSWORD ==========
if (forgotForm) {
  forgotForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideMessages();

    const email = document.getElementById("forgot-email")?.value.trim();

    if (!email) {
      showError("Please enter your email address.");
      return;
    }

    setLoading(btnForgot, true, "Sending...");

    try {
      await sendPasswordResetEmail(auth, email);
      showSuccess("Password reset link sent! Check your email.");
      setLoading(btnForgot, false);
    } catch (err) {
      console.error(err);
      let msg = "Failed to send reset email.";

      if (err.code === "auth/user-not-found") {
        msg = "No account found with this email.";
      } else if (err.code === "auth/invalid-email") {
        msg = "Please enter a valid email address.";
      }

      showError(msg);
      setLoading(btnForgot, false);
    }
  });
}

// ========== SIGN UP ==========
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideMessages();

    const firstName = document.getElementById("first-name")?.value.trim();
    const lastName  = document.getElementById("last-name")?.value.trim();
    const eduType   = document.getElementById("education-type")?.value;
    const email     = document.getElementById("signup-email")?.value.trim();
    const password  = document.getElementById("signup-password")?.value;
    const confirm   = document.getElementById("confirm-password")?.value;

    if (!firstName || !lastName || !eduType || !email || !password || !confirm) {
      showError("Please fill in all required fields.");
      return;
    }

    if (password !== confirm) {
      showError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      showError("Password must be at least 6 characters.");
      return;
    }

    let classOrCourse = "";
    let level = "";

    if (eduType === "secondary") {
      classOrCourse = document.getElementById("secondary-class")?.value;
      if (!classOrCourse) {
        showError("Please select your class.");
        return;
      }
    } else if (eduType === "tertiary") {
      classOrCourse = document.getElementById("course")?.value.trim();
      level = document.getElementById("level")?.value;
      if (!classOrCourse || !level) {
        showError("Please enter your course and select your level.");
        return;
      }
    }

    setLoading(btnSignup, true, "Creating account...");

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const profile = {
        name: `${firstName} ${lastName}`,
        firstName,
        lastName,
        email,
        role: "student",
        educationType: eduType,
        createdAt: Date.now()
      };

      if (eduType === "secondary") {
        profile.class = classOrCourse;
      } else {
        profile.course = classOrCourse;
        profile.level = level;
      }

      await set(ref(rtdb, `users/${user.uid}`), profile);
      // onAuthStateChanged will handle navigation

    } catch (err) {
      console.error(err);
      let msg = "Sign up failed. Please try again.";

      if (err.code === "auth/email-already-in-use") {
        msg = "This email is already registered. Please login instead.";
      } else if (err.code === "auth/invalid-email") {
        msg = "Please enter a valid email address.";
      } else if (err.code === "auth/weak-password") {
        msg = "Password is too weak.";
      } else if (err.code === "PERMISSION_DENIED") {
        msg = "Database write permission denied. Check RTDB rules.";
      }

      showError(msg);
      setLoading(btnSignup, false);
    }
  });
}

// ========== SINGLE AUTH STATE OBSERVER (Redirect Gateway) ==========
onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.replace("dashboard.html");
  }
});
