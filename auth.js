import { auth, rtdb } from "./firebase-config.js";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { ref, set } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// ========== DOM ==========
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const forgotForm = document.getElementById("forgot-form");
const errorBox = document.getElementById("error-message");
const successBox = document.getElementById("success-message");
const tabs = document.getElementById("tabs");
const pageTitle = document.getElementById("page-title");
const pageSubtitle = document.getElementById("page-subtitle");

const educationType = document.getElementById("education-type");
const secondaryFields = document.getElementById("secondary-fields");
const tertiaryFields = document.getElementById("tertiary-fields");

// ========== Helpers ==========
function showError(msg) {
  successBox.style.display = "none";
  errorBox.textContent = msg;
  errorBox.style.display = "block";
}

function showSuccess(msg) {
  errorBox.style.display = "none";
  successBox.textContent = msg;
  successBox.style.display = "block";
}

function hideMessages() {
  errorBox.style.display = "none";
  successBox.style.display = "none";
}

function setLoading(button, isLoading, loadingText) {
  if (!button) return;
  button.disabled = isLoading;
  button.textContent = isLoading ? loadingText : button.dataset.originalText;
}

function showSection(sectionId) {
  document.querySelectorAll(".form-section").forEach(f => f.classList.remove("active"));
  document.getElementById(sectionId).classList.add("active");
}

// Store original button text
document.getElementById("btn-login").dataset.originalText = "Sign In";
document.getElementById("btn-signup").dataset.originalText = "Create Account";
document.getElementById("btn-forgot").dataset.originalText = "Send Reset Link";

// ========== Tab switching ==========
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");

    hideMessages();
    tabs.style.display = "flex";
    pageTitle.textContent = "Welcome";
    pageSubtitle.textContent = "Sign in to your account or create a new one";

    showSection(tab.dataset.tab + "-form");
  });
});

// ========== Show/Hide password ==========
document.querySelectorAll(".toggle-password").forEach(btn => {
  btn.addEventListener("click", () => {
    const input = document.getElementById(btn.dataset.target);
    if (input.type === "password") {
      input.type = "text";
      btn.textContent = "Hide";
    } else {
      input.type = "password";
      btn.textContent = "Show";
    }
  });
});

// ========== Education type toggle ==========
educationType.addEventListener("change", () => {
  const value = educationType.value;
  secondaryFields.classList.add("hidden");
  tertiaryFields.classList.add("hidden");

  if (value === "secondary") {
    secondaryFields.classList.remove("hidden");
  } else if (value === "tertiary") {
    tertiaryFields.classList.remove("hidden");
  }
});

// ========== Forgot Password link ==========
document.getElementById("forgot-password-link").addEventListener("click", (e) => {
  e.preventDefault();
  hideMessages();
  tabs.style.display = "none";
  pageTitle.textContent = "Reset Password";
  pageSubtitle.textContent = "Enter your email to receive a reset link";
  showSection("forgot-form");
});

// ========== Back to Login ==========
document.getElementById("back-to-login").addEventListener("click", (e) => {
  e.preventDefault();
  hideMessages();
  tabs.style.display = "flex";
  pageTitle.textContent = "Welcome";
  pageSubtitle.textContent = "Sign in to your account or create a new one";
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelector('.tab[data-tab="login"]').classList.add("active");
  showSection("login-form");
});

// ========== LOGIN ==========
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideMessages();

  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  const btn = document.getElementById("btn-login");

  if (!email || !password) {
    showError("Please fill in both email and password.");
    return;
  }

  setLoading(btn, true, "Signing in...");

  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.replace("dashboard.html");
  } catch (err) {
    console.error(err);
    let msg = "Login failed. Please try again.";
    if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
      msg = "Incorrect email or password.";
    } else if (err.code === "auth/too-many-requests") {
      msg = "Too many attempts. Please try again later.";
    } else if (err.code === "auth/user-disabled") {
      msg = "This account has been disabled.";
    }
    showError(msg);
    setLoading(btn, false);
  }
});

// ========== FORGOT PASSWORD ==========
forgotForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideMessages();

  const email = document.getElementById("forgot-email").value.trim();
  const btn = document.getElementById("btn-forgot");

  if (!email) {
    showError("Please enter your email address.");
    return;
  }

  setLoading(btn, true, "Sending...");

  try {
    await sendPasswordResetEmail(auth, email);
    showSuccess("Password reset link has been sent to your email. Please check your inbox (and spam folder).");
    setLoading(btn, false);
  } catch (err) {
    console.error(err);
    let msg = "Failed to send reset email. Please try again.";
    if (err.code === "auth/user-not-found") {
      msg = "No account found with this email.";
    } else if (err.code === "auth/invalid-email") {
      msg = "Please enter a valid email address.";
    } else if (err.code === "auth/too-many-requests") {
      msg = "Too many attempts. Please try again later.";
    }
    showError(msg);
    setLoading(btn, false);
  }
});

// ========== SIGN UP ==========
signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideMessages();

  const firstName = document.getElementById("first-name").value.trim();
  const lastName = document.getElementById("last-name").value.trim();
  const eduType = document.getElementById("education-type").value;
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value;
  const confirmPassword = document.getElementById("confirm-password").value;
  const btn = document.getElementById("btn-signup");

  if (!firstName || !lastName || !eduType || !email || !password || !confirmPassword) {
    showError("Please fill in all required fields.");
    return;
  }

  if (password !== confirmPassword) {
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
    classOrCourse = document.getElementById("secondary-class").value;
    if (!classOrCourse) {
      showError("Please select your class.");
      return;
    }
  } else if (eduType === "tertiary") {
    classOrCourse = document.getElementById("course").value.trim();
    level = document.getElementById("level").value;
    if (!classOrCourse || !level) {
      showError("Please enter your course and select your level.");
      return;
    }
  }

  setLoading(btn, true, "Creating account...");

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const fullName = `${firstName} ${lastName}`;
    const profile = {
      name: fullName,
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
    window.location.replace("dashboard.html");

  } catch (err) {
    console.error(err);
    let msg = "Sign up failed. Please try again.";
    if (err.code === "auth/email-already-in-use") {
      msg = "This email is already registered. Please login instead.";
    } else if (err.code === "auth/invalid-email") {
      msg = "Please enter a valid email address.";
    } else if (err.code === "auth/weak-password") {
      msg = "Password is too weak. Use at least 6 characters.";
    }
    showError(msg);
    setLoading(btn, false);
  }
});
