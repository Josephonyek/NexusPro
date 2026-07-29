import { auth, rtdb } from "./firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// DOM Handles
const loginForm = document.getElementById("login-form");
const emailInput = document.getElementById("login-email");
const passwordInput = document.getElementById("login-password");
const submitBtn = document.getElementById("btn-login-submit");
const errorMessageEl = document.getElementById("login-error-message");

// Helper function to show UI error alerts
function showError(msg) {
    if (errorMessageEl) {
        errorMessageEl.innerText = msg;
        errorMessageEl.style.display = "block";
    } else {
        alert(msg);
    }
}

// Helper function to hide errors
function hideError() {
    if (errorMessageEl) {
        errorMessageEl.innerText = "";
        errorMessageEl.style.display = "none";
    }
}

// Password Visibility Toggle (Optional helper if you have a toggle button)
const togglePasswordBtn = document.getElementById("toggle-password");
togglePasswordBtn?.addEventListener("click", () => {
    if (passwordInput) {
        const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
        passwordInput.setAttribute("type", type);
        togglePasswordBtn.classList.toggle("fa-eye");
        togglePasswordBtn.classList.toggle("fa-eye-slash");
    }
});

// Main Login Submit Event Handler
loginForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideError();

    const email = emailInput?.value.trim();
    const password = passwordInput?.value.trim();

    if (!email || !password) {
        showError("Please fill in both email and password fields.");
        return;
    }

    // Indicate loading state
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = "Signing in...";
    }

    try {
        // 1. Authenticate with Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Default fallbacks in case RTDB is slow or missing entry
        let userRole = "student";
        let userName = user.displayName || email.split("@")[0];

        // 2. Fetch User Profile & Role from Firebase Realtime Database
        try {
            const userRef = ref(rtdb, `users/${user.uid}`);
            const snapshot = await get(userRef);

            if (snapshot.exists()) {
                const data = snapshot.val();
                if (data.role) userRole = data.role.toLowerCase();
                if (data.name || data.fullName) userName = data.name || data.fullName;
            }
        } catch (dbError) {
            console.warn("RTDB pre-fetch warning (falling back to defaults):", dbError);
        }

        // 3. PRE-CACHE CREDENTIALS FOR INSTANT DASHBOARD RENDER
        localStorage.setItem("nx_role", userRole);
        localStorage.setItem("nx_name", userName);

        // 4. Smooth Redirect
        window.location.href = "dashboard.html";

    } catch (authError) {
        console.error("Login failure:", authError);

        // Friendly error messages based on Firebase Auth error codes
        let friendlyMsg = "Login failed. Please check your credentials.";
        switch (authError.code) {
            case "auth/invalid-email":
                friendlyMsg = "Invalid email address format.";
                break;
            case "auth/user-disabled":
                friendlyMsg = "This user account has been disabled.";
                break;
            case "auth/user-not-found":
            case "auth/wrong-password":
            case "auth/invalid-credential":
                friendlyMsg = "Incorrect email or password.";
                break;
            case "auth/too-many-requests":
                friendlyMsg = "Too many failed attempts. Please try again later.";
                break;
            case "auth/network-request-failed":
                friendlyMsg = "Network error. Please check your internet connection.";
                break;
        }

        showError(friendlyMsg);

        // Reset submit button state
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = "Sign In";
        }
    }
});
