async function loadUsageData() {
    const container = document.getElementById('usageContainer');
    container.innerHTML = `<div class="text-center py-10 text-gray-400">Loading usage data...</div>`;

    const token = localStorage.getItem('nexusAuthToken');

    try {
        // Fetch all AI usage logs
        const response = await fetch(
            `https://nexuspro-cf948-default-rtdb.europe-west1.firebasedatabase.app/ai-usage.json?auth=${token}`
        );

        const data = await response.json();

        if (!data) {
            container.innerHTML = `<div class="text-center py-10">No AI usage data found yet.</div>`;
            return;
        }

        container.innerHTML = '';

        // Loop through each user
        Object.keys(data).forEach(userId => {
            const userLogs = data[userId];
            const queries = Object.values(userLogs);
            const totalQueries = queries.length;

            const userCard = document.createElement('div');
            userCard.className = `bg-gray-900 border border-gray-700 rounded-2xl p-6`;

            let html = `
                <div class="flex justify-between items-center mb-4">
                    <div>
                        <h3 class="font-bold text-lg">${queries[0]?.userName || 'Unknown User'}</h3>
                        <p class="text-sm text-gray-400">User ID: ${userId}</p>
                    </div>
                    <div class="text-right">
                        <div class="text-3xl font-bold text-blue-400">${totalQueries}</div>
                        <div class="text-xs text-gray-400">queries asked</div>
                    </div>
                </div>
                <div class="space-y-3">
            `;

            // Show last 5 questions
            queries.slice(-5).reverse().forEach(log => {
                const date = new Date(log.timestamp).toLocaleString();
                html += `
                    <div class="bg-gray-800 p-4 rounded-xl">
                        <div class="text-sm text-gray-400 mb-1">${date}</div>
                        <div class="font-medium">${log.question}</div>
                    </div>
                `;
            });

            html += `</div>`;
            userCard.innerHTML = html;
            container.appendChild(userCard);
        });

    } catch (error) {
        container.innerHTML = `<div class="text-red-400">Failed to load usage data.</div>`;
    }
}

// Load data when page opens
document.addEventListener('DOMContentLoaded', loadUsageData);
