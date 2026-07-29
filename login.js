import { auth } from "./firebase-config.js";
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence } from "firebase/auth";
import { ref, get } from "firebase/database";
import { rtdb } from "./firebase-config.js";

function showError(msg) {
    const el = document.getElementById("login-error");
    if (el) { el.textContent = msg; el.style.display = "block"; }
}

function hideError() {
    const el = document.getElementById("login-error");
    if (el) { el.textContent = ""; el.style.display = "none"; }
}

function setLoading(btn, loading, defaultText) {
    btn.disabled = loading;
    btn.textContent = loading ? "Please wait…" : defaultText;
}

const loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        hideError();

        const btn = loginForm.querySelector("button[type='submit']");
        const emailInput = document.getElementById("loginEmail");
        const passwordInput = document.getElementById("loginPassword");

        const email = emailInput.value.trim().toLowerCase();
        const password = passwordInput.value;

        if (!email || !password) {
            showError("Please enter your email and password.");
            return;
        }

        setLoading(btn, true, "Sign In");

        try {
            await setPersistence(auth, browserLocalPersistence);
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            let role = "student";
            let name = user.email.split("@")[0];
            try {
                const snapshot = await get(ref(rtdb, `users/${user.uid}`));
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    role = (data.role || "student").toLowerCase().trim();
                    name = data.name || name;
                }
            } catch (_) { /* ignore DB errors */ }

            localStorage.setItem("nx_role", role);
            localStorage.setItem("nx_name", name);
            window.location.replace("dashboard.html");

        } catch (err) {
            setLoading(btn, false, "Sign In");
            console.error("Login error:", err.code);

            switch (err.code) {
                case "auth/wrong-password":
                case "auth/invalid-credential":
                    showError("Incorrect password. Please try again.");
                    break;
                case "auth/user-not-found":
                    showError("No account found for this email. Please sign up.");
                    break;
                case "auth/too-many-requests":
                    showError("Too many attempts. Try again later.");
                    break;
                case "auth/network-request-failed":
                    showError("Network error. Check your connection.");
                    break;
                default:
                    showError("Sign‑in failed. Please try again.");
            }
        }
    });
                }
