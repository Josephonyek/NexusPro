document.getElementById('loginForm').addEventListener('submit', async (event) => {
    // Prevent page reload on form submission
    event.preventDefault();

    // Grab elements
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const submitBtn = document.getElementById('submitBtn');
    const statusBanner = document.getElementById('statusBanner');

    // Clean field inputs
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // UI Loading State Trigger
    setLoadingState(true);

    try {
        // Send inputs strictly to your backend serverless endpoint
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Display success notification
            showBanner("Authentication verified! Loading dashboard...", "success");

            // Store token and user tracking keys securely in browser local storage
            localStorage.setItem('nexusAuthToken', data.token);
            localStorage.setItem('nexusUserId', data.userId);

            // Redirect user to the main student platform after a small delay
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1200);

        } else {
            // Show error returned directly from backend processing
            showBanner(data.error || "Login failed. Check details.", "error");
            setLoadingState(false);
        }

    } catch (error) {
        // Handle unexpected offline network issues
        showBanner("Connection failed. Check your internet connection.", "error");
        setLoadingState(false);
    }
});

/**
 * Helper function to cleanly display status messaging to users
 */
function showBanner(message, type) {
    const banner = document.getElementById('statusBanner');
    banner.classList.remove('hidden', 'bg-red-950', 'text-red-400', 'border-red-800', 'bg-blue-950', 'text-blue-400', 'border-blue-800', 'bg-green-950', 'text-green-400', 'border-green-800');
    
    banner.textContent = message;
    
    if (type === 'success') {
        banner.classList.add('bg-green-950', 'text-green-400', 'border', 'border-green-800');
    } else if (type === 'error') {
        banner.classList.add('bg-red-950', 'text-red-400', 'border', 'border-red-800');
    } else {
        banner.classList.add('bg-blue-950', 'text-blue-400', 'border', 'border-blue-800');
    }
}

/**
 * Disables interactions on button click to avoid multiple parallel API requests
 */
function setLoadingState(isLoading) {
    const btn = document.getElementById('submitBtn');
    if (isLoading) {
        btn.disabled = true;
        btn.classList.add('opacity-60', 'cursor-not-allowed');
        btn.innerHTML = `
            <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Verifying...</span>
        `;
    } else {
        btn.disabled = false;
        btn.classList.remove('opacity-60', 'cursor-not-allowed');
        btn.innerHTML = `<span>Sign In to Portal</span>`;
    }
}