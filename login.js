document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
        alert("Please enter email and password.");
        return;
    }

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Login failed");
        }

        // Save login session
        localStorage.setItem('nexusAuthToken', data.idToken);
        localStorage.setItem('nexusUserId', data.userId);

        // Redirect to dashboard
        window.location.href = 'dashboard.html';

    } catch (error) {
        console.error(error);
        alert("Login failed: " + error.message);
    }
});
