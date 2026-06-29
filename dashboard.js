/**
 * Nexus Pro 2.0 - Core Dashboard Controller System (SDK Fail-Safe Edition)
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-database.js";

// Global app handlers
let app, auth, db;

// Data cleansing to protect UI layers
function sanitizeString(str) {
    if (!str) return '';
    const tempDiv = document.createElement('div');
    tempDiv.textContent = str;
    return tempDiv.innerHTML;
}

// Native initialization sequence running directly on the Firebase Event Loop
async function bootstrapDashboardSystem() {
    try {
        // Fetch project environment configuration keys
        const configResponse = await fetch('./api/firebaseConfig');
        if (!configResponse.ok) throw new Error("Configuration handshake offline.");
        const firebaseConfig = await configResponse.json();

        // Initialize SDK Modules
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getDatabase(app);

        // NATIVE STATE LISTENER: Waits dynamically until Firebase handles auth state fully
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                console.log("🔒 Session verified for UID:", user.uid);
                await populateDashboardUI(user.uid);
            } else {
                console.warn("⚠️ No valid active token stream. Evicting to login console.");
                executeHardLogout();
            }
        });

    } catch (criticalError) {
        console.error("Dashboard Engine Crash:", criticalError.message);
        // Safety valve: prevent screen freezing if backend api fails
        clearPreloaderOverlay();
        const heading = document.getElementById('welcomeHeading');
        if (heading) heading.innerHTML = "Welcome to Nexus Pro!";
    }
}

// Fetches user profile nodes securely matching your exact security rule conditions
async function populateDashboardUI(uid) {
    try {
        const userProfileRef = ref(db, `users/${uid}`);
        const snapshot = await get(userProfileRef);

        // Failsafe configuration profile for newly registered users caught in sync lag
        const profileData = snapshot.exists() ? snapshot.val() : {
            name: "Scholar",
            role: localStorage.getItem('nexusUserRole') || "student",
            status: "active",
            gameMetrics: { totalXP: 0, currentLevel: 1 }
        };

        if (profileData.status === 'suspended' || profileData.status === 'banned') {
            alert("🔒 Account Deactivated: Access privileges revoked.");
            executeHardLogout();
            return;
        }

        // Apply sanitized variables to the DOM interface nodes cleanly
        const cleanName = sanitizeString(profileData.name);
        const cleanRole = sanitizeString(profileData.role);

        const welcomeHeading = document.getElementById('welcomeHeading');
        if (welcomeHeading) welcomeHeading.innerHTML = `Welcome Back, ${cleanName}!`;

        const roleBadge = document.getElementById('roleBadge');
        if (roleBadge) {
            roleBadge.innerText = cleanRole;
            if (cleanRole === 'admin') {
                roleBadge.className = "px-2.5 py-1 text-xs font-bold uppercase rounded-md bg-red-950 text-red-400 border border-red-900/40";
                document.getElementById('adminSection')?.classList.remove('hidden');
                document.getElementById('sidebarAdminLinks')?.classList.remove('hidden');
            } else {
                roleBadge.className = "px-2.5 py-1 text-xs font-bold uppercase rounded-md bg-blue-950 text-blue-400 border border-blue-900/40";
                document.getElementById('adminSection')?.classList.add('hidden');
                document.getElementById('sidebarAdminLinks')?.classList.add('hidden');
            }
        }

        // Render gamification progress models
        if (profileData.gameMetrics) {
            const xp = parseInt(profileData.gameMetrics.totalXP || 0);
            const lvl = parseInt(profileData.gameMetrics.currentLevel || 1);
            if (document.getElementById('userXpText')) document.getElementById('userXpText').innerText = `${xp.toLocaleString()} XP`;
            if (document.getElementById('userLevelText')) document.getElementById('userLevelText').innerText = `Level ${lvl}`;
        }

    } catch (dbError) {
        console.error("Database record sync skipped:", dbError.message);
    } finally {
        clearPreloaderOverlay();
    }
}

function clearPreloaderOverlay() {
    const loaderMask = document.getElementById('nexusPreloader') || document.getElementById('uploadPreloader');
    if (!loaderMask) return;
    loaderMask.classList.add('opacity-0', 'pointer-events-none');
    setTimeout(() => { loaderMask.remove(); }, 450);
}

function executeHardLogout() {
    localStorage.clear();
    if (auth) {
        signOut(auth).then(() => {
            window.location.replace('login.html');
        }).catch(() => {
            window.location.replace('login.html');
        });
    } else {
        window.location.replace('login.html');
    }
}

// Initialize runtime threads on page load
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        if (confirm("Log out of Nexus Pro?")) executeHardLogout();
    });
    document.getElementById('sidebarLogoutBtn')?.addEventListener('click', () => {
        if (confirm("Log out of Nexus Pro?")) executeHardLogout();
    });
    
    bootstrapDashboardSystem();
});
