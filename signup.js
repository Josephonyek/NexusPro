// signup.js - Frontend Form Controller
async function hashPasswordSHA256(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        
        const fullName = document.getElementById('regName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const plainPassword = document.getElementById('regPassword').value;

        try {
            btn.disabled = true;
            btn.textContent = "Encrypting parameters...";

            const hashedPassword = await hashPasswordSHA256(plainPassword);

            // Ship compiled parameters directly to API folder pipeline route
            const response = await fetch('./api/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullName, email, hashedPassword })
            });

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
            btn.disabled = false;
            btn.textContent = "Create Account";
        }
    });
});
