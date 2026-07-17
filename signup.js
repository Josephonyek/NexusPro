/**
 * Nexus Pro 2.0 - Frontend Signup Controller (With Failsafe Server Guards)
 */

// Cryptographic engine to match backend security requirements
async function hashPasswordSHA256(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    // UPDATED: Targets 'signupForm' to match the redesigned HTML form ID
    document.getElementById('signupForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        
        // UPDATED: Match newly aligned HTML element IDs
        const fullName = document.getElementById('signupName').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const plainPassword = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('signupConfirmPassword').value;

        // NEW: Client-side validation to ensure passwords match before hashing or fetching
        if (plainPassword !== confirmPassword) {
            alert("Sign Up Error: Passwords do not match. Please verify and try again.");
            return;
        }

        try {
            btn.disabled = true;
            btn.textContent = "Encrypting parameters...";

            const hashedPassword = await hashPasswordSHA256(plainPassword);

            // FIX: Targeted absolute Vercel serverless root route path
            const response = await fetch('/api/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullName, email, hashedPassword })
            });

            // FIX: Content-Type Guard to catch Vercel HTML error pages before JSON parser crashes
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const rawErrorText = await response.text();
                console.error("Vercel Server Environment Crash Payload:", rawErrorText);
                throw new Error("Server Environment Error. Check your Vercel Dashboard Environment Variables.");
            }

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || "Registration rejected.");

            // Cache token keys instantly before execution jumps forward
            localStorage.clear();
            localStorage.setItem('nexusAuthToken', result.token);
            localStorage.setItem('nexusUserId', result.userId);
            localStorage.setItem('nexusUserRole', result.role);

            btn.textContent = "Redirecting to workspace...";
            window.location.replace('dashboard.html');

        } catch (err) {
            alert(`Sign Up Error: ${err.message}`);
            if (btn) {
                btn.disabled = false;
                btn.textContent = "Register Profile";
            }
        }
    });
});
