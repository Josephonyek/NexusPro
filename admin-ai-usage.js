// Defensive Cross-Site Scripting (XSS) Sanitizer to handle raw user logs safely
function sanitize(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

async function verifyAdminAccess() {
    const userToken = localStorage.getItem('nexusAuthToken');
    const userId = localStorage.getItem('nexusUserId');

    // 1. FAST ROUTING DEFENSE: Instantly redirect if local credentials do not exist
    if (!userToken || !userId) {
        localStorage.clear();
        window.location.replace('login.html');
        return false;
    }

    try {
        // Fetch your Firebase Configuration dynamically via your backend API
        const configResponse = await fetch('./api/firebaseConfig');
        if (!configResponse.ok) throw new Error("Could not load database settings.");
        const firebaseConfig = await configResponse.json();

        // Target the individual user node to check account authority safely
        const databaseUrl = firebaseConfig.databaseURL || 'https://nexuspro-cf948-default-rtdb.europe-west1.firebasedatabase.app';
        const cleanDbUrl = databaseUrl.replace(/\/$/, "");
        
        const roleCheckResponse = await fetch(`${cleanDbUrl}/users/${userId}.json`);
        const profile = await roleCheckResponse.json();

        // 2. PRIVILEGE AUDIT: Enforce strict authorization block
        if (!profile || profile.role !== 'admin' || profile.status === 'banned') {
            alert("Access Denied: Administrative Clearance Node missing.");
            window.location.replace('dashboard.html');
            return false;
        }

        // Access Granted: Return the clean database URL to pull down logs
        return cleanDbUrl;

    } catch (err) {
        console.error("Security handshake exception:", err);
        const container = document.getElementById('usageContainer');
        if (container) {
            container.innerHTML = `<div class="text-center py-10 text-red-400 font-bold">⚠️ Security Handshake Verification Failed.</div>`;
        }
        return false;
    }
}

async function loadUsageData() {
    const container = document.getElementById('usageContainer');
    if (!container) return;
    
    container.innerHTML = `<div class="text-center py-10 text-gray-400 animate-pulse">Verifying administrative credentials...</div>`;

    // Run privilege checks first
    const cleanDbUrl = await verifyAdminAccess();
    if (!cleanDbUrl) return; // Halt execution if check fails

    container.innerHTML = `<div class="text-center py-10 text-gray-400 animate-pulse">Streaming data nodes...</div>`;

    try {
        // Fetch AI usage statistics securely
        const response = await fetch(`${cleanDbUrl}/ai-usage.json`);
        const data = await response.json();

        if (!data) {
            container.innerHTML = `<div class="text-center py-10 text-gray-400">No AI usage data found yet.</div>`;
            return;
        }

        container.innerHTML = '';

        // Process logs safely
        Object.keys(data).forEach(userId => {
            const userLogs = data[userId];
            if (!userLogs) return;

            const queries = Object.values(userLogs);
            const totalQueries = queries.length;
            if (totalQueries === 0) return;

            // Grab name from first record and sanitize defensively
            const rawUserName = queries[0]?.userName || 'Unknown User';
            const cleanUserName = sanitize(rawUserName);
            const cleanUserId = sanitize(userId);

            const userCard = document.createElement('div');
            userCard.className = `bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl transition hover:border-blue-900/40`;

            let html = `
                <div class="flex justify-between items-center mb-4">
                    <div>
                        <h3 class="font-extrabold text-lg text-gray-100">${cleanUserName}</h3>
                        <p class="text-xs font-mono text-gray-500 mt-0.5">UID: ${cleanUserId}</p>
                    </div>
                    <div class="text-right">
                        <div class="text-3xl font-black text-blue-500">${totalQueries}</div>
                        <div class="text-[10px] font-bold tracking-wider text-gray-500 uppercase">Queries Asked</div>
                    </div>
                </div>
                <div class="space-y-3">
            `;

            // Display the latest 5 prompts securely
            queries.slice(-5).reverse().forEach(log => {
                if (!log || !log.question) return;
                
                const date = log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Unknown Date';
                const cleanQuestion = sanitize(log.question);
                const cleanDate = sanitize(date);

                html += `
                    <div class="bg-gray-950 border border-gray-800/60 p-4 rounded-xl">
                        <div class="text-xs font-semibold text-blue-400 mb-1.5">${cleanDate}</div>
                        <div class="font-medium text-sm text-gray-300 leading-relaxed">${cleanQuestion}</div>
                    </div>
                `;
            });

            html += `</div>`;
            userCard.innerHTML = html;
            container.appendChild(userCard);
        });

    } catch (error) {
        console.error("Data pipeline exception:", error);
        container.innerHTML = `<div class="text-center py-10 text-red-400 font-bold">❌ Failed to stream usage data matrix.</div>`;
    }
}

// Fire application module cleanly on load
document.addEventListener('DOMContentLoaded', loadUsageData);
