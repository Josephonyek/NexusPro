document.getElementById('signupForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const submitBtn = document.getElementById('submitBtn');
    const statusBanner = document.getElementById('statusBanner');

    const fullName = fullNameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    setLoadingState(true);

    try {
        // Fetch request directly targets your secure backend folder handler
        const response = await fetch('/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullName, email, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showBanner("Account registered successfully! Redirecting to dashboard...", "success");
            
            // Save local session markers
            localStorage.setItem('nexusAuthToken', data.token);
            localStorage.setItem('nexusUserId', data.userId);

            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        } else {
            showBanner(data.error || "Registration failed.", "error");
            setLoadingState(false);
        }
    } catch (error) {
        showBanner("Network error. Could not connect to authentication gateway.", "error");
        setLoadingState(false);
    }
});

function showBanner(message, type) {
    const banner = document.getElementById('statusBanner');
    banner.classList.remove('hidden', 'bg-red-950', 'text-red-400', 'border-red-800', 'bg-green-950', 'text-green-400', 'border-green-800');
    banner.textContent = message;
    
    if (type === 'success') {
        banner.classList.add('bg-green-950', 'text-green-400', 'border', 'border-green-800');
    } else {
        banner.classList.add('bg-red-950', 'text-red-400', 'border', 'border-red-800');
    }
    banner.classList.remove('hidden');
}

function setLoadingState(isLoading) {
    const btn = document.getElementById('submitBtn');
    if (isLoading) {
        btn.disabled = true;
        btn.classList.add('opacity-60', 'cursor-not-allowed');
        btn.innerHTML = `<span>Creating Account...</span>`;
    } else {
        btn.disabled = false;
        btn.classList.remove('opacity-60', 'cursor-not-allowed');
        btn.innerHTML = `<span>Create Student Account</span>`;
    }
}