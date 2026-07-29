// ========== FIXED IMPORTS (uses import map) ==========
import { auth } from "./firebase-config.js";
import { 
    signInWithEmailAndPassword, 
    setPersistence, 
    browserLocalPersistence 
} from "firebase/auth";
import { ref, get } from "firebase/database";
import { rtdb } from "./firebase-config.js";

// ── Helpers ──────────────────────────────────────────────────────────────────

function showError(msg) {
    const el = document.getElementById("login-error");
    if (el) {
        el.textContent = msg;
        el.style.display = "block";
        // Security: do not expose raw Firebase error messages in production
        // We already handle specific codes below, but this is a fallback.
    }
}

function hideError() {
    const el = document.getElementById("login-error");
    if (el) {
        el.textContent = "";
        el.style.display = "none";
    }
}

function setLoading(btn, loading, defaultText) {
    btn.disabled = loading;
    btn.textContent = loading ? "Please wait…" : defaultText;
}

// ── LOGIN HANDLER ──────────────────────────────────────────────────────────

const loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        hideError();

        const btn = loginForm.querySelector("button[type='submit']");
        const emailInput = document.getElementById("loginEmail");
        const passwordInput = document.getElementById("loginPassword");

        // Trim and sanitize email (basic)
        const email = emailInput.value.trim().toLowerCase();
        const password = passwordInput.value; // Do not trim passwords

        // Validate inputs (additional security)
        if (!email || !password) {
            showError("Please enter your email and password.");
            return;
        }

        // Basic email format check (optional)
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showError("Please enter a valid email address.");
            return;
        }

        setLoading(btn, true, "Sign In");

        try {
            // 1. Set persistence to LOCAL (keeps user logged in across sessions)
            await setPersistence(auth, browserLocalPersistence);

            // 2. Sign in
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 3. Fetch user profile from Realtime Database
            const snapshot = await get(ref(rtdb, `users/${user.uid}`));
            if (snapshot.exists()) {
                const data = snapshot.val();
                // Store role and name in localStorage for quick dashboard load
                localStorage.setItem("nx_role", (data.role || "student").toLowerCase().trim());
                localStorage.setItem("nx_name", data.name || user.email.split("@")[0]);
            } else {
                // Fallback: use email prefix as name, default role student
                localStorage.setItem("nx_role", "student");
                localStorage.setItem("nx_name", user.email.split("@")[0]);
            }

            // 4. Redirect to dashboard
            window.location.replace("dashboard.html");

        } catch (err) {
            // Reset button state
            setLoading(btn, false, "Sign In");

            // ====== SECURE ERROR HANDLING ======
            // Show generic messages for common errors, never expose internal details.
            switch (err.code) {
                case "auth/user-not-found":
                case "auth/wrong-password":
                case "auth/invalid-credential":
                    showError("Incorrect email or password.");
                    break;
                case "auth/too-many-requests":
                    showError("Too many failed attempts. Please try again later.");
                    break;
                case "auth/invalid-email":
                    showError("Please enter a valid email address.");
                    break;
                case "auth/network-request-failed":
                    showError("Network error. Check your connection and try again.");
                    break;
                default:
                    // Generic fallback – do not leak raw error messages in production
                    showError("Sign-in failed. Please check your credentials and try again.");
                    // Optionally log to console for debugging (remove in production)
                    console.error("Login error:", err);
            }
        }
    });
        }
