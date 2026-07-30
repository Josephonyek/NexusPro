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

    // Indicate loading state
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = "Signing in...";
    }

    try {
        // 1. Dispatch request to your backend API route (/api/login)
        const response = await fetch("/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ 
                email: email, 
                hashedPassword: rawPassword // Matches const { email, hashedPassword } = req.body in api/login.js
            })
        });

        const data = await response.json();

        // 2. Handle failures returned by api/login.js (status codes 400, 403, 405, 500)
        if (!response.ok || !data.success) {
            let errorMsg = data.message || "Login failed. Please check your credentials.";
            
            // Map Firebase Identity Toolkit backend error strings to friendly UI text
            if (errorMsg.includes("INVALID_PASSWORD") || errorMsg.includes("EMAIL_NOT_FOUND")) {
                errorMsg = "Incorrect email or password.";
            } else if (errorMsg.includes("USER_DISABLED")) {
                errorMsg = "This account has been disabled.";
            } else if (errorMsg.includes("TOO_MANY_ATTEMPTS_TRY_LATER")) {
                errorMsg = "Too many failed attempts. Please try again later.";
            }

            throw new Error(errorMsg);
        }

        // 3. Cache session data from API response
        if (data.role) localStorage.setItem("nx_role", data.role.toLowerCase());
        if (data.userId) localStorage.setItem("nx_uid", data.userId);
        if (data.token) localStorage.setItem("nx_token", data.token);

        // 4. Redirect to Dashboard
        window.location.href = "dashboard.html";

    } catch (error) {
        console.error("Login failure:", error);
        showError(error.message || "An unexpected error occurred.");

        // Reset submit button state
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = "Sign In";
        }
    }
});
