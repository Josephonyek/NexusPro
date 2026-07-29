import { auth } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { ref, set, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { rtdb } from "./firebase-config.js";

// ── Helpers ──────────────────────────────────────────────────────────────────

function showError(elId, msg) {
  const el = document.getElementById(elId);
  if (el) { el.textContent = msg; el.style.display = "block"; }
}

function hideError(elId) {
  const el = document.getElementById(elId);
  if (el) { el.textContent = ""; el.style.display = "none"; }
}

function setLoading(btn, loading, defaultText) {
  btn.disabled = loading;
  btn.textContent = loading ? "Please wait…" : defaultText;
}

// ── LOGIN ─────────────────────────────────────────────────────────────────────

const loginForm = document.getElementById("loginForm");
loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideError("login-error");

  const btn      = loginForm.querySelector("button[type='submit']");
  const email    = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  if (!email || !password) {
    showError("login-error", "Please enter your email and password.");
    return;
  }

  setLoading(btn, true, "Sign In");

  try {
    // Persist session across page reloads and browser restarts
    await setPersistence(auth, browserLocalPersistence);

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Pre-cache name and role so dashboard loads instantly
    const snapshot = await get(ref(rtdb, `users/${user.uid}`));
    if (snapshot.exists()) {
      const data = snapshot.val();
      localStorage.setItem("nx_role", (data.role || "student").toLowerCase().trim());
      localStorage.setItem("nx_name", data.name || user.email.split("@")[0]);
    } else {
      localStorage.setItem("nx_role", "student");
      localStorage.setItem("nx_name", user.email.split("@")[0]);
    }

    window.location.replace("dashboard.html");

  } catch (err) {
    setLoading(btn, false, "Sign In");
    switch (err.code) {
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        showError("login-error", "Incorrect email or password.");
        break;
      case "auth/too-many-requests":
        showError("login-error", "Too many attempts. Try again later.");
        break;
      case "auth/invalid-email":
        showError("login-error", "Please enter a valid email address.");
        break;
      default:
        showError("login-error", "Login failed: " + err.message);
    }
  }
});

// ── SIGN UP ───────────────────────────────────────────────────────────────────

