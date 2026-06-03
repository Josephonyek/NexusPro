document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!name || !email || !password) {
        alert("Please fill in all fields.");
        return;
    }

    try {
        const response = await fetch('/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Signup failed");
        }

        // Save session
        localStorage.setItem('nexusAuthToken', data.idToken);
        localStorage.setItem('nexusUserId', data.userId);

        alert("Account created successfully! Redirecting to dashboard...");
        window.location.href = 'dashboard.html';

    } catch (error) {
        console.error(error);
        alert("Signup failed: " + error.message);
    }
});
