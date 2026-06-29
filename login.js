
// login.js - Frontend Form Controller
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

            // Execute post transaction against server mapping
            const response = await fetch('./api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, hashedPassword })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || "Login authentication rejected.");

            localStorage.clear();
            localStorage.setItem('nexusAuthToken', result.token);
            localStorage.setItem('nexusUserId', result.userId);
            localStorage.setItem('nexusUserRole', result.role);

            btn.textContent = "Redirecting...";
            window.location.replace('dashboard.html');

        } catch (err) {
            alert(`Login Failed: ${err.message}`);
            btn.disabled = false;
            btn.textContent = "Sign In to Dashboard";
        }
    });
});
