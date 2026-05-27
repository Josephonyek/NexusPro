document.addEventListener("DOMContentLoaded", async () => {
    const userToken = localStorage.getItem('nexusAuthToken');
    const userId = localStorage.getItem('nexusUserId');

    const welcomeSub = document.getElementById('welcomeSubtext');

    if (!userToken || !userId) {
        welcomeSub.textContent = "No login data. Redirecting...";
        setTimeout(() => window.location.href = 'login.html', 1500);
        return;
    }

    welcomeSub.textContent = "Connecting to database...";

    try {
        // ✅ FIXED: Correct Europe region URL
        const rtdbUrl = `https://nexuspro-cf948-default-rtdb.europe-west1.firebasedatabase.app/users/${userId}.json?auth=${userToken}`;
        
        const response = await fetch(rtdbUrl, { method: 'GET' });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Error ${response.status}: ${errorBody}`);
        }

        const userData = await response.json();

        if (userData === null || userData === undefined) {
            welcomeSub.textContent = "Connected, but no profile data found for your account.";
            return;
        }

        // Success
        const userName = userData.name || "Student User";
        const userRole = userData.role || "student";

        document.getElementById('welcomeHeading').textContent = `Welcome Back, ${userName}!`;
        welcomeSub.textContent = "Profile loaded successfully ✅";

        const roleBadge = document.getElementById('roleBadge');
        roleBadge.textContent = userRole.toUpperCase();

        if (userRole === 'admin') {
            roleBadge.className = "px-2.5 py-1 text-xs font-bold uppercase rounded-md bg-red-950 text-red-400 border border-red-900/40 tracking-wider";
            document.getElementById('adminSection').classList.remove('hidden');
        } else {
            roleBadge.className = "px-2.5 py-1 text-xs font-bold uppercase rounded-md bg-blue-950 text-blue-400 border border-blue-900/40 tracking-wider";
        }

    } catch (error) {
        console.error(error);
        welcomeSub.textContent = "Connection failed: " + error.message;
    }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'login.html';
});
