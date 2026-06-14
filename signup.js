document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');

    if (!name || !email || !password) {
        alert("Please fill in all fields.");
        return;
    }

    try {
        // Disable button to prevent quick double-tap submissions
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "Creating Account...";
        }

        const response = await fetch('/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Signup failed");
        }

        // Save backend approved session tokens safely
        localStorage.setItem('nexusAuthToken', data.token);
        localStorage.setItem('nexusUserId', data.userId);

        alert("Account created successfully! Redirecting to dashboard...");
        window.location.replace('dashboard.html');

    } catch (error) {
        console.error("Signup Loop Exception:", error);
        alert(error.message);
        
        // Re-enable button on failure so they can try again
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Sign Up";
        }
    }
});
