// ==========================================
// 1. PURE UI SWITCHING LOGIC (Guaranteed)
// ==========================================
(function initUI() {
  const tabsContainer   = document.getElementById("tabs");
  const pageTitle       = document.getElementById("page-title");
  const pageSubtitle    = document.getElementById("page-subtitle");
  const educationType   = document.getElementById("education-type");
  const secondaryFields = document.getElementById("secondary-fields");
  const tertiaryFields  = document.getElementById("tertiary-fields");
  const forgotLink      = document.getElementById("forgot-password-link");
  const backToLogin     = document.getElementById("back-to-login");

  function hideMessages() {
    const err = document.getElementById("error-message");
    const succ = document.getElementById("success-message");
    if (err) err.style.display = "none";
    if (succ) succ.style.display = "none";
  }

  function showSection(sectionId) {
    document.querySelectorAll(".form-section").forEach(s => s.classList.remove("active"));
    const target = document.getElementById(sectionId);
    if (target) target.classList.add("active");
  }

  // Tab click handler using event delegation
  if (tabsContainer) {
    tabsContainer.addEventListener("click", (e) => {
      const tab = e.target.closest(".tab");
      if (!tab) return;

      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      hideMessages();
      tabsContainer.style.display = "flex";
      if (pageTitle) pageTitle.textContent = "Welcome";
      if (pageSubtitle) pageSubtitle.textContent = "Sign in to your account or create a new one";

      const targetTab = tab.getAttribute("data-tab");
      showSection(targetTab + "-form");
    });
  }

  // Education type dropdown toggle
  if (educationType) {
    educationType.addEventListener("change", () => {
      const value = educationType.value;
      if (secondaryFields) secondaryFields.classList.add("hidden");
      if (tertiaryFields) tertiaryFields.classList.add("hidden");

      if (value === "secondary" && secondaryFields) secondaryFields.classList.remove("hidden");
      if (value === "tertiary" && tertiaryFields) tertiaryFields.classList.remove("hidden");
    });
  }

  // Password Visibility Toggle
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

  // Navigation Links
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

  if (backToLogin) {
    backToLogin.addEventListener("click", (e) => {
      e.preventDefault();
      hideMessages();
      if (tabsContainer) tabsContainer.style.display = "flex";
      if (pageTitle) pageTitle.textContent = "Welcome";
      if (pageSubtitle) pageSubtitle.textContent = "Sign in to your account or create a new one";
      
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      const loginTab = document.querySelector('.tab[data-tab="login"]');
      if (loginTab) loginTab.classList.add("active");

      showSection("login-form");
    });
  }
})();

// ==========================================
// 2. FIREBASE INTEGRATION (Env Vars)
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

function showError(msg) {
  const errorBox = document.getElementById("error-message");
  const successBox = document.getElementById("success-message");
  if (successBox) successBox.style.display = "none";
  if (errorBox) {
    errorBox.textContent = msg;
    errorBox.style.display = "block";
  }
}

function showSuccess(msg) {
  const errorBox = document.getElementById("error-message");
  const successBox = document.getElementById("success-message");
  if (errorBox) errorBox.style.display = "none";
  if (successBox) {
    successBox.textContent = msg;
    successBox.style.display = "block";
  }
}

function setLoading(button, isLoading, loadingText) {
  if (!button) return;
  button.disabled = isLoading;
  button.textContent = isLoading ? loadingText : (button.dataset.originalText || button.textContent);
}

// Read Vercel Environment variables safely
const firebaseConfig = {
  apiKey: window.ENV?.FIREBASE_API_KEY,
  authDomain: window.ENV?.FIREBASE_AUTH_DOMAIN,
  databaseURL: window.ENV?.FIREBASE_DATABASE_URL,
  projectId: window.ENV?.FIREBASE_PROJECT_ID,
  storageBucket: window.ENV?.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: window.ENV?.FIREBASE_MESSAGING_SENDER_ID,
  appId: window.ENV?.FIREBASE_APP_ID
};

try {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const rtdb = getDatabase(app);

  const btnLogin  = document.getElementById("btn-login");
  const btnSignup = document.getElementById("btn-signup");
  const btnForgot = document.getElementById("btn-forgot");

  if (btnLogin)  btnLogin.dataset.originalText  = "Sign In";
  if (btnSignup) btnSignup.dataset.originalText = "Create Account";
  if (btnForgot) btnForgot.dataset.originalText = "Send Reset Link";

  // Login handler
  document.getElementById("login-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email")?.value.trim();
    const password = document.getElementById("login-password")?.value;

    setLoading(btnLogin, true, "Signing in...");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "dashboard.html";
    } catch (err) {
      console.error(err);
      showError("Incorrect email or password.");
      setLoading(btnLogin, false);
    }
  });

  // Signup handler
  document.getElementById("signup-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const firstName = document.getElementById("first-name")?.value.trim();
    const lastName  = document.getElementById("last-name")?.value.trim();
    const eduType   = document.getElementById("education-type")?.value;
    const email     = document.getElementById("signup-email")?.value.trim();
    const password  = document.getElementById("signup-password")?.value;
    const confirm   = document.getElementById("confirm-password")?.value;

    if (password !== confirm) {
      showError("Passwords do not match.");
      return;
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
        profile.class = document.getElementById("secondary-class")?.value;
      } else {
        profile.course = document.getElementById("course")?.value.trim();
        profile.level = document.getElementById("level")?.value;
      }

      await set(ref(rtdb, `users/${user.uid}`), profile);
      window.location.href = "dashboard.html";
    } catch (err) {
      console.error(err);
      showError(err.message || "Sign up failed.");
      setLoading(btnSignup, false);
    }
  });

  // Forgot Password handler
  document.getElementById("forgot-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("forgot-email")?.value.trim();

    setLoading(btnForgot, true, "Sending...");
    try {
      await sendPasswordResetEmail(auth, email);
      showSuccess("Password reset link sent!");
      setLoading(btnForgot, false);
    } catch (err) {
      console.error(err);
      showError("Failed to send reset email.");
      setLoading(btnForgot, false);
    }
  });

  // Auth observer
  onAuthStateChanged(auth, (user) => {
    if (user) {
      window.location.href = "dashboard.html";
    }
  });

} catch (err) {
  console.warn("Firebase failed to initialize from window.ENV:", err);
                                                }
