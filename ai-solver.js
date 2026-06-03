// ==================== ADMIN PROTECTION ====================
document.addEventListener("DOMContentLoaded", async () => {
    const userToken = localStorage.getItem('nexusAuthToken');
    const userId = localStorage.getItem('nexusUserId');

    if (!userToken || !userId) {
        alert("You must be logged in to access this page.");
        window.location.href = 'login.html';
        return;
    }

    try {
        // Check if the user is an admin
        const rtdbUrl = `https://nexuspro-cf948-default-rtdb.europe-west1.firebasedatabase.app/users/${userId}.json?auth=${userToken}`;
        const response = await fetch(rtdbUrl);
        const userData = await response.json();

        const userRole = (userData?.role || "").toString().toLowerCase().trim();

        if (userRole !== 'admin') {
            alert("Access Denied: Only administrators can view this page.");
            window.location.href = 'dashboard.html';
            return;
        }

        // If user is admin, load the usage data
        loadUsageData();

    } catch (error) {
        console.error("Error checking admin access:", error);
        alert("Error verifying permissions. Please try again.");
        window.location.href = 'dashboard.html';
    }
});

// ==================== LOAD AI USAGE DATA ====================
async function loadUsageData() {
    const container = document.getElementById('usageContainer');
    container.innerHTML = `
        <div class="text-center py-10">
            <div class="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            <p class="mt-3 text-gray-400">Loading AI usage data...</p>
        </div>
    `;

    const token = localStorage.getItem('nexusAuthToken');

    try {
        const response = await fetch(
            `https://nexuspro-cf948-default-rtdb.europe-west1.firebasedatabase.app/ai-usage.json?auth=${token}`
        );

        const data = await response.json();

        if (!data) {
            container.innerHTML = `
                <div class="text-center py-16 bg-gray-900 rounded-2xl border border-gray-700">
                    <div class="text-6xl mb-4">📭</div>
                    <h3 class="text-xl font-bold mb-2">No AI Usage Data Yet</h3>
                    <p class="text-gray-400">Users have not used the AI Solver yet.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = '';

        // Loop through each user who has used the AI
        Object.keys(data).forEach(userId => {
            const userLogs = data[userId];
            const queries = Object.values(userLogs);
            const totalQueries = queries.length;

            // Get user info from the first log
            const userName = queries[0]?.userName || "Unknown User";
            const lastUsed = new Date(queries[queries.length - 1].timestamp).toLocaleString();

            // Create user card
            const userCard = document.createElement('div');
            userCard.className = `bg-gray-900 border border-gray-700 rounded-2xl p-6 mb-6`;

            let html = `
                <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-5">
                    <div>
                        <h3 class="text-xl font-bold">${userName}</h3>
                        <p class="text-sm text-gray-400">User ID: ${userId}</p>
                    </div>
                    <div class="mt-3 md:mt-0 text-right">
                        <div class="inline-flex items-center gap-2 bg-blue-950 text-blue-400 px-4 py-1 rounded-full text-sm">
                            <span class="font-bold">${totalQueries}</span> 
                            <span>queries</span>
                        </div>
                        <p class="text-xs text-gray-400 mt-1">Last used: ${lastUsed}</p>
                    </div>
                </div>

                <div class="mb-3">
                    <h4 class="text-sm uppercase tracking-widest text-gray-400 mb-2">Recent Questions</h4>
                </div>
                <div class="space-y-3">
            `;

            // Show the last 6 questions (most recent first)
            queries.slice(-6).reverse().forEach(log => {
                const date = new Date(log.timestamp).toLocaleString();
                html += `
                    <div class="bg-gray-800 p-4 rounded-xl border border-gray-700">
                        <div class="flex justify-between items-start mb-2">
                            <div class="text-xs text-gray-400">${date}</div>
                            <div class="text-xs px-2 py-0.5 bg-gray-700 rounded">${log.subject || 'General'}</div>
                        </div>
                        <div class="font-medium text-white">${log.question}</div>
                    </div>
                `;
            });

            html += `</div>`;
            userCard.innerHTML = html;
            container.appendChild(userCard);
        });

    } catch (error) {
        console.error("Error loading usage data:", error);
        container.innerHTML = `
            <div class="text-center py-10 text-red-400">
                Failed to load usage data. Please try refreshing the page.
            </div>
        `;
    }
}
