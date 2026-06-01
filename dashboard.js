document.addEventListener("DOMContentLoaded", async () => {
    const userToken = localStorage.getItem('nexusAuthToken');
    const userId = localStorage.getItem('nexusUserId');

    const welcomeSub = document.getElementById('welcomeSubtext');

    if (!userToken || !userId) {
        welcomeSub.textContent = "No login data found. Redirecting...";
        setTimeout(() => window.location.href = 'login.html', 1500);
        return;
    }

    welcomeSub.textContent = "Connecting to your profile...";

    try {
        const rtdbUrl = `https://nexuspro-cf948-default-rtdb.europe-west1.firebasedatabase.app/users/${userId}.json?auth=${userToken}`;
        
        let response = await fetch(rtdbUrl);
        let userData = await response.json();

        if (!userData) {
            // Create default profile
            const defaultProfile = {
                name: "New Student",
                role: "student",
                createdAt: Date.now()
            };
            await fetch(rtdbUrl, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(defaultProfile)
            });
            userData = defaultProfile;
        }

        // Check if user has been flagged as banned
        if (userData.status === 'banned') {
            welcomeSub.textContent = "This account is restricted from using Nexus Pro nodes.";
            alert("This account is restricted from using Nexus Pro nodes.");
            localStorage.clear();
            window.location.href = 'login.html';
            return;
        }

        // Update UI with user data
        const userName = userData.name || "Student User";
        const userRole = userData.role || "student";

        document.getElementById('welcomeHeading').textContent = `Welcome Back, ${userName}!`;
        welcomeSub.textContent = "Profile loaded successfully ✅";

        const roleBadge = document.getElementById('roleBadge');
        roleBadge.textContent = userRole.toUpperCase();

        if (userRole === 'admin') {
            roleBadge.className = "px-2.5 py-1 text-xs font-bold uppercase rounded-md bg-red-950 text-red-400 border border-red-900/40 tracking-wider";
            document.getElementById('adminSection').classList.remove('hidden');
            
            // Fetch global active system model configuration
            fetchCurrentAIModel(userToken);
            
            // Load user directory framework
            loadUserDirectory(userToken);
        } else {
            roleBadge.className = "px-2.5 py-1 text-xs font-bold uppercase rounded-md bg-blue-950 text-blue-400 border border-blue-900/40 tracking-wider";
        }

    } catch (error) {
        console.error(error);
        welcomeSub.textContent = "Connection failed. Please check your internet.";
    }
});

// ====================== ADMIN FUNCTIONS ======================

// Fetch global system-wide configuration setting
async function fetchCurrentAIModel(token) {
    const systemUrl = `https://nexuspro-cf948-default-rtdb.europe-west1.firebasedatabase.app/system/settings/activeModel.json?auth=${token}`;
    try {
        let response = await fetch(systemUrl);
        let activeModel = await response.json();
        if (activeModel) {
            document.getElementById('aiModelSelect').value = activeModel;
        }
    } catch (error) {
        console.error("Error fetching system AI configuration:", error);
    }
}

// Save selected AI Model globally to Firebase
window.saveAIModel = async function() {
    const userToken = localStorage.getItem('nexusAuthToken');
    const selectedModel = document.getElementById('aiModelSelect').value;

    if (!userToken) return;

    const systemUrl = `https://nexuspro-cf948-default-rtdb.europe-west1.firebasedatabase.app/system/settings.json?auth=${userToken}`;

    try {
        await fetch(systemUrl, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ activeModel: selectedModel })
        });

        alert(`🎯 Core AI architecture changed to: ${selectedModel.toUpperCase()}`);
    } catch (error) {
        alert("Failed to save global AI model preference.");
    }
};

// Comprehensive User Accounts Registry Dashboard Directory Loader
async function loadUserDirectory(token) {
    const usersUrl = `https://nexuspro-cf948-default-rtdb.europe-west1.firebasedatabase.app/users.json?auth=${token}`;
    const userTableBody = document.getElementById('userTableBody');
    const userCount = document.getElementById('userCount');

    try {
        let response = await fetch(usersUrl);
        let usersData = await response.json();

        if (usersData) {
            userTableBody.innerHTML = ''; 
            let count = 0;

            Object.keys(usersData).forEach((uid) => {
                count++;
                const profile = usersData[uid];
                const name = profile.name || profile.username || 'N/A';
                const email = profile.email || 'No Email';
                const phone = profile.phone || 'No Phone';
                const currentRole = profile.role || 'user';
                const status = profile.status || 'active';

                const isBanned = status === 'banned';
                const rowClass = isBanned ? 'bg-red-950/10 text-gray-500 line-through' : 'hover:bg-gray-900/40';

                const tr = document.createElement('tr');
                tr.className = `${rowClass} transition duration-100`;
                tr.innerHTML = `
                    <td class="px-4 py-3.5 font-semibold text-white">${name}</td>
                    <td class="px-4 py-3.5 text-xs text-gray-400">
                        <div>${email}</div>
                        <div class="text-gray-500 text-[11px] mt-0.5">${phone}</div>
                    </td>
                    <td class="px-4 py-3.5">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${
                            currentRole === 'admin' ? 'bg-red-900/30 text-red-400 border border-red-800/40' : 'bg-gray-800 text-gray-400'
                        }">
                            ${currentRole}
                        </span>
                        ${isBanned ? `<span class="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-amber-950 text-amber-400 font-bold uppercase">Banned</span>` : ''}
                    </td>
                    <td class="px-4 py-3.5 text-right space-x-1 whitespace-nowrap">
                        <button onclick="editUser('${uid}', '${name}', '${currentRole}')" class="px-2.5 py-1 bg-gray-800 text-gray-200 border border-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-700 transition">
                            Edit
                        </button>
                        <button onclick="emailUser('${email}')" class="px-2.5 py-1 bg-blue-950/40 text-blue-400 border border-blue-900/30 text-xs font-semibold rounded-lg hover:bg-blue-900/30 transition">
                            Email
                        </button>
                        <button onclick="toggleBanUser('${uid}', '${status}')" class="px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                            isBanned ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 hover:bg-emerald-900/30' : 'bg-red-950/40 text-red-400 border border-red-900/30 hover:bg-red-900/30'
                        }">
                            ${isBanned ? 'Unban' : 'Ban'}
                        </button>
                    </td>
                `;
                userTableBody.appendChild(tr);
            });
            userCount.textContent = count;
        } else {
            userTableBody.innerHTML = `<tr><td colspan="4" class="px-4 py-6 text-center text-gray-500">No active user registry files.</td></tr>`;
        }
    } catch (error) {
        console.error(error);
        userTableBody.innerHTML = `<tr><td colspan="4" class="px-4 py-6 text-center text-red-400">Failed to pull real-time database directory.</td></tr>`;
    }
}

// Webmail Trigger Handler
window.emailUser = function(email) {
    if(!email || email === 'No Email') return alert("No email index registered to this account profile.");
    window.location.href = `mailto:${email}?subject=Nexus Pro System Administration Update`;
};

// Edit Form Parameter Committer
window.editUser = async function(uid, currentName, currentRole) {
    const token = localStorage.getItem('nexusAuthToken');
    const newName = prompt(`Change name for user:`, currentName);
    if (newName === null) return; 

    const newRole = prompt(`Set new clearance role level.\nEnter "student" or "admin":`, currentRole);
    if (newRole === null) return;

    if (newRole !== 'student' && newRole !== 'admin') {
        alert("Invalid option structure choice. Set only as 'student' or 'admin'.");
        return;
    }

    const itemUrl = `https://nexuspro-cf948-default-rtdb.europe-west1.firebasedatabase.app/users/${uid}.json?auth=${token}`;

    try {
        await fetch(itemUrl, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName || currentName, role: newRole })
        });
        alert("Account parameters safely committed.");
        loadUserDirectory(token); 
    } catch (e) {
        alert("Writing failure encountered.");
    }
};

// System Ban Management Committer
window.toggleBanUser = async function(uid, currentStatus) {
    const token = localStorage.getItem('nexusAuthToken');
    const nextStatus = currentStatus === 'banned' ? 'active' : 'banned';
    const safetyCheck = confirm(`Are you sure you want to set this user account status to ${nextStatus.toUpperCase()}?`);
    if (!safetyCheck) return;

    const itemUrl = `https://nexuspro-cf948-default-rtdb.europe-west1.firebasedatabase.app/users/${uid}.json?auth=${token}`;

    try {
        await fetch(itemUrl, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: nextStatus })
        });
        alert(`Account state has been safely set to: ${nextStatus}`);
        loadUserDirectory(token);
    } catch (e) {
        alert("Execution update failure.");
    }
};

// News Monitor
window.monitorNews = function() {
    alert("📢 News Monitor Activated\n\nThis feature is ready. You can create news-monitor.html later.");
};

// Community Monitor
window.monitorCommunity = function() {
    alert("👥 Community Monitor Activated\n\nThis feature is ready. You can create community-moderate.html later.");
};

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'login.html';
});
