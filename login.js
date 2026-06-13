document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById('loginForm');
    const errorBanner = document.getElementById('errorMessage');
    const submitBtn = document.getElementById('submitBtn');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // Visual feedback state
        submitBtn.disabled = true;
        submitBtn.textContent = "Verifying Credentials...";
        errorBanner.classList.add('hidden');

        try {
            // Route data securely straight into your backend API folder endpoint
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                errorBanner.className = "p-4 mb-5 text-sm font-semibold rounded-2xl bg-emerald-950/50 border border-emerald-900/60 text-emerald-400 text-center";
                errorBanner.textContent = "Clearance verified! Redirecting...";
                errorBanner.classList.remove('hidden');

                // Save session pointers to pass your dashboard authorization script checks
                localStorage.setItem('nexusAuthToken', data.token);
                localStorage.setItem('nexusUserId', data.userId);

                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1200);

            } else {
                // Display the custom server response message (e.g., user is locked out/banned/wrong password)
                errorBanner.textContent = data.error || "An error occurred during authentication.";
                errorBanner.classList.remove('hidden');
                submitBtn.disabled = false;
                submitBtn.textContent = "Log In";
            }

        } catch (error) {
            console.error("Frontend HTTP Pipeline Exception:", error);
            errorBanner.textContent = "⚠️ Cloud server timeout. Check network status connection.";
            errorBanner.classList.remove('hidden');
            submitBtn.disabled = false;
            submitBtn.textContent = "Log In";
        }
    });
});
