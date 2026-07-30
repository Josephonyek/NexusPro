import { auth } from "./firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// DOM Handles
const loginForm = document.getElementById("login-form");
const emailInput = document.getElementById("login-email");
const passwordInput = document.getElementById("login-password");
const submitBtn = document.getElementById("btn-login-submit");
const errorMessageEl = document.getElementById("login-error-message");

function showError(msg) {
    if (errorMessageEl) {
        errorMessageEl.innerText = msg;
        errorMessageEl.style.display = "block";
    } else {
        alert(msg);
    }
}

function hideError() {
    if (errorMessageEl) {
        errorMessageEl.innerText = "";
        errorMessageEl.style.display = "none";
    }
}

// Password Visibility Toggle
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
    const rawPassword = passwordInput?.value.trim();

    if (!email || !rawPassword) {
        showError("Please fill in both email and password fields.");
        return;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = "Signing in...";
    }

    try {
        console.log("1. Sending request to /api/login...");

        const response = await fetch("/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ 
                email: email, 
                hashedPassword: rawPassword
            })
        });

        const data = await response.json();
        console.log("2. API response:", data);

        if (!response.ok || !data.success) {
            let errorMsg = data.message || "Login failed. Please check your credentials.";
            
            if (errorMsg.includes("INVALID_PASSWORD") || errorMsg.includes("EMAIL_NOT_FOUND")) {
                errorMsg = "Incorrect email or password.";
            } else if (errorMsg.includes("USER_DISABLED")) {
                errorMsg = "This account has been disabled.";
            } else if (errorMsg.includes("TOO_MANY_ATTEMPTS_TRY_LATER")) {
                errorMsg = "Too many failed attempts. Please try again later.";
            }

            throw new Error(errorMsg);
        }

        // Success from API
        console.log("3. API success – saving to localStorage");
        if (data.role) localStorage.setItem("nx_role", data.role.toLowerCase());
        if (data.userId) localStorage.setItem("nx_uid", data.userId);
        if (data.token) localStorage.setItem("nx_token", data.token);

        // Try client-side Firebase sign-in
        console.log("4. Trying client-side signInWithEmailAndPassword...");
        try {
            await signInWithEmailAndPassword(auth, email, rawPassword);
            console.log("5. Client sign-in successful");
        } catch (firebaseErr) {
            console.error("Client sign-in failed:", firebaseErr);
            showError("API ok, but Firebase client sign-in failed: " + firebaseErr.message);
            // We still continue to redirect so you can see what happens
        }

        console.log("6. Redirecting to dashboard...");
        window.location.replace("dashboard.html");

    } catch (error) {
        console.error("Login failure:", error);
        showError(error.message || "An unexpected error occurred.");

        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = "Sign In";
        }
    }
});
