/**
 * Nexus Pro 2.0 - Core Student Account Matrix Operations Controller
 * File: admin-users.js
 */

const DB_BASE_URL = "https://nexuspro-cf948-default-rtdb.europe-west1.firebasedatabase.app";
let activeSessionToken = "";
let cachedUsersObject = {};

async function initializeAdminPanel() {
    const userId = localStorage.getItem('nexusUserId');
    const secureToken = localStorage.getItem('nexusAuthToken');

    if (!userId || !secureToken) {
        window.location.replace('login.html');
        return;
    }

    activeSessionToken = secureToken;
    await syncUserDatabaseTree();
}

async function syncUserDatabaseTree() {
    try {
        const response = await fetch(`${DB_BASE_URL}/users.json?auth=${activeSessionToken}`);
        if (!response.ok) throw new Error(`Server returned error code: ${response.status}`);
        
        cachedUsersObject = await response.json() || {};
        renderUserControlsTable();
    } catch (err) {
        document.getElementById('studentTableBody').innerHTML = `
            <tr>
                <td colspan="4" class="p-8 text-center text-xs text-red-400 font-semibold">
                    ⚠️ Failed to pull user registry tree: ${err.message}
                </td>
            </tr>`;
    } finally {
        const loader = document.getElementById('nexusPreloader');
        if (loader) { 
            loader.classList.add('opacity-0', 'pointer-events-none'); 
            setTimeout(() => loader.remove(), 200); 
        }
    }
}

function renderUserControlsTable() {
    const tbody = document.getElementById('studentTableBody');
    if (!tbody) return;
    tbody.innerHTML = "";

    const userKeys = Object.keys(cachedUsersObject);
    
    // CRITICAL FILTER: Drops any corrupted or unlinked system placeholder nodes automatically
    const validUserKeys = userKeys.filter(uid => {
        const profile = cachedUsersObject[uid];
        return profile && (profile.email || profile.username || profile.fullName);
    });
    
    let total = validUserKeys.length;
    let active = 0;
    let banned = 0;

    document.getElementById('userCounter').innerText = `${total} Valid student profiles synced live`;

    if (total === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="p-6 text-center text-xs text-neutral-500">No active student profiles located inside node.</td></tr>`;
        document.getElementById('statTotal').innerText = 0;
        document.getElementById('statActive').innerText = 0;
        document.getElementById('statBanned').innerText = 0;
        return;
    }

    validUserKeys.forEach(uid => {
        const profile = cachedUsersObject[uid];
        const currentRole = profile.role || "student";
        const currentStatus = profile.status || "active";

        if (currentStatus === "active") active++;
        if (currentStatus === "suspended" || currentStatus === "banned") banned++;

        const row = document.createElement('tr');
        row.className = "hover:bg-neutral-900/30 transition-colors";

        row.innerHTML = `
            <td class="p-4">
                <div class="font-bold text-neutral-100">${profile.fullName || profile.username || 'Student User'}</div>
                <div class="text-xs text-neutral-500 font-semibold mt-0.5">${profile.email || 'No email address registered'}</div>
            </td>
            <td class="p-4">
                <select data-uid="${uid}" class="role-selector bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs px-2.5 py-1.5 rounded-xl cursor-pointer focus:border-neutral-700 outline-none">
                    <option value="student" ${currentRole === "student" ? "selected" : ""}>Student Access</option>
                    <option value="admin" ${currentRole === "admin" ? "selected" : ""}>System Administrator</option>
                </select>
            </td>
            <td class="p-4">
                <select data-uid="${uid}" class="status-selector bg-neutral-950 border border-neutral-800 text-xs px-2.5 py-1.5 rounded-xl cursor-pointer font-bold outline-none ${currentStatus === 'active' ? 'text-green-400 focus:border-green-900' : 'text-red-400 focus:border-red-900'}">
                    <option value="active" ${currentStatus === "active" ? "selected" : ""}>🟢 Active Mode</option>
                    <option value="suspended" ${currentStatus === "suspended" ? "selected" : ""}>🟡 Suspended</option>
                    <option value="banned" ${currentStatus === "banned" ? "selected" : ""}>🔴 Terminated / Banned</option>
                </select>
            </td>
            <td class="p-4 text-right space-x-1.5 whitespace-nowrap">
                <button data-uid="${uid}" data-email="${profile.email || ''}" class="mail-btn px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 text-xs font-bold rounded-xl cursor-pointer transition-all">
                    ✉️ Mail
                </button>
                <button data-uid="${uid}" class="purge-user-btn px-2.5 py-1.5 bg-red-950/40 hover:bg-red-900/60 border border-red-900/40 text-red-400 text-xs font-bold rounded-xl cursor-pointer transition-all">
                    Delete
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    document.getElementById('statTotal').innerText = total;
    document.getElementById('statActive').innerText = active;
    document.getElementById('statBanned').innerText = banned;

    bindInteractiveActionHooks();
}

function bindInteractiveActionHooks() {
    // 1. ROLE SELECTION HANDLERS
    document.querySelectorAll('.role-selector').forEach(selectNode => {
        selectNode.addEventListener('change', async (e) => {
            const targetUid = e.target.getAttribute('data-uid');
            const targetRoleValue = e.target.value;
            await updateDatabaseNodeValue(targetUid, "role", targetRoleValue);
        });
    });

    // 2. ACCOUNT STATUS MUTATION HANDLERS
    document.querySelectorAll('.status-selector').forEach(selectNode => {
        selectNode.addEventListener('change', async (e) => {
            const targetUid = e.target.getAttribute('data-uid');
            const targetStatusValue = e.target.value;
            await updateDatabaseNodeValue(targetUid, "status", targetStatusValue);
            await syncUserDatabaseTree(); 
        });
    });

    // 3. MAIL DISPATCH HANDLERS
    document.querySelectorAll('.mail-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetUid = btn.getAttribute('data-uid');
            const targetEmail = btn.getAttribute('data-email');
            
            if (!targetEmail) { 
                alert("This profile doesn't possess a valid tracking email block."); 
                return; 
            }

            document.getElementById('targetStudentId').value = targetUid;
            document.getElementById('targetStudentEmail').value = targetEmail;
            document.getElementById('emailModal').classList.remove('hidden');
        });
    });

    // 4. PURGE DELETION HANDLERS
    document.querySelectorAll('.purge-user-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const targetUid = btn.getAttribute('data-uid');
            if (confirm("⚠️ CRITICAL ACTION:\n\nAre you sure you want to completely erase this user account? They will lose access to all course suites instantly.")) {
                await executeDirectUserPurge(targetUid);
            }
        });
    });
}

async function updateDatabaseNodeValue(uid, databaseFieldKey, targetValue) {
    try {
        const response = await fetch(`${DB_BASE_URL}/users/${uid}/${databaseFieldKey}.json?auth=${activeSessionToken}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(targetValue)
        });
        if (!response.ok) throw new Error("Server rejected operation value parameter mapping.");
    } catch (err) {
        alert(`Failed to save record modification: ${err.message}`);
    }
}

async function executeDirectUserPurge(uid) {
    try {
        const response = await fetch(`${DB_BASE_URL}/users/${uid}.json?auth=${activeSessionToken}`, { method: 'DELETE' });
        if (!response.ok) throw new Error("Wipe task command dropped by firebase rules protection.");
        alert("🗑️ Student records deleted successfully.");
        await syncUserDatabaseTree();
    } catch (err) {
        alert(`Purge task failure details: ${err.message}`);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById('emailModal');
    const form = document.getElementById('emailForm');

    document.getElementById('closeEmailModalBtn')?.addEventListener('click', () => modal.classList.add('hidden'));
    document.getElementById('cancelEmailBtn')?.addEventListener('click', () => modal.classList.add('hidden'));

    form?.addEventListener('submit', (e) => {
        e.preventDefault();
        const address = document.getElementById('targetStudentEmail').value;
        const subject = encodeURIComponent(document.getElementById('emailSubject').value);
        const textBody = encodeURIComponent(document.getElementById('emailBody').value);

        window.open(`mailto:${address}?subject=${subject}&body=${textBody}`, '_blank');
        
        modal.classList.add('hidden');
        form.reset();
    });

    initializeAdminPanel();
});
