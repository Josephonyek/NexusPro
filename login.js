/**
 * Nexus Pro 2.0 - Frontend Login Controller (With Failsafe Server Guards)
 */

// Cryptographic engine to match backend security requirements
async function hashPasswordSHA256(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        
        const email = document.getElementById('loginEmail').value.trim();
        const plainPassword = document.getElementById('loginPassword').value;

        try {
            btn.disabled = true;
            btn.textContent = "Hashing security tokens...";

            const hashedPassword = await hashPasswordSHA256(plainPassword);

            // FIX: Targeted absolute Vercel serverless root route path
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, hashedPassword })
            });

            // FIX: Content-Type Guard to catch Vercel HTML error pages before JSON parser crashes
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const rawErrorText = await response.text();
                console.error("Vercel Server Environment Crash Payload:", rawErrorText);
                throw new Error("Server Environment Error. Check your Vercel Dashboard Environment Variables.");
            }

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || "Login authentication rejected.");

            // Cache authorization tokens
            localStorage.clear();
            localStorage.setItem('nexusAuthToken', result.token);
            localStorage.setItem('nexusUserId', result.userId);
            localStorage.setItem('nexusUserRole', result.role);

            btn.textContent = "Redirecting...";
            window.location.replace('dashboard.html');

        } catch (err) {
            alert(`Login Failed: ${err.message}`);
            if (btn) {
                btn.disabled = false;
                btn.textContent = "Sign In to Dashboard";
            }
        }
    });
});
