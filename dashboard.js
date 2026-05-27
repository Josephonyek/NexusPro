document.addEventListener("DOMContentLoaded", async () => {
    const userToken = localStorage.getItem('nexusAuthToken');
    const userId = localStorage.getItem('nexusUserId');

    const welcomeSub = document.getElementById('welcomeSubtext');

    if (!userToken || !userId) {
        welcomeSub.textContent = "No login data. Redirecting...";
        setTimeout(() => window.location.href = 'login.html', 1500);
        return;
    }

    welcomeSub.textContent = "Connecting to your profile...";

    try {
        const rtdbUrl = `https://nexuspro-cf948-default-rtdb.europe-west1.firebasedatabase.app/users/${userId}.json?auth=${userToken}`;
        
        let response = await fetch(rtdbUrl, { method: 'GET' });
        let userData = await response.json();

        if (userData === null || userData === undefined) {
            // Auto-create basic profile
            welcomeSub.textContent = "Creating your profile...";
            
            const defaultProfile = {
                name: "New Student",
                role: "student",
                createdAt: Date.now()
            };

            response = await fetch(rtdbUrl, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(defaultProfile)
            });

            if (response.ok) {
                userData = defaultProfile;
                welcomeSub.textContent = "New profile created successfully!";
            } else {
                throw new Error("Failed to create profile");
            }
        }

        // Load the data
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
        welcomeSub.textContent = "Error: " + error.message;
    }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'login.html';
});
