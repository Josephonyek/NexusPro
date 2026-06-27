// Nexus Pro 2.0 - Core Authentication & Sign-In Controller Pipeline
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { getDatabase, ref, get, child } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-database.js";

let app, auth, db;

// Initialize Firebase using your project configuration settings
async function bootstrapAuthSystem() {
    try {
        const configResponse = await fetch('./api/firebaseConfig');
        if (!configResponse.ok) throw new Error("Could not download backend connection maps.");
        const firebaseConfig = await configResponse.json();

        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getDatabase(app);

        // Bind form submission event once Firebase is ready
        document.getElementById('loginForm').addEventListener('submit', executeSecureLoginSequence);
    } catch (err) {
        console.error("Auth initialization engine failure:", err);
        alert("System Error: Failed to connect to secure servers.");
    }
}

async function executeSecureLoginSequence(e) {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        alert("Please complete all credential fields.");
        return;
    }

    try {
        submitBtn.disabled = true;
        submitBtn.textContent = "Verifying identity credentials...";

        // 1. STEP ONE: Authenticate with Firebase Auth FIRST to get a token
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2. STEP TWO: Extract the secure identity token string
        const secureToken = await user.getIdToken();

        submitBtn.textContent = "Authorizing security clearances...";

        // 3. STEP THREE: Fetch the specific user profile node using their verified UID
        const userProfileRef = ref(db, `users/${user.uid}`);
        const snapshot = await get(userProfileRef);

        if (!snapshot.exists()) {
            throw new Error("Profile record missing from database index.");
        }

        const profile = snapshot.val();

        if (profile.status === 'banned' || profile.status === 'suspended') {
            alert("🔒 Access Denied: This account node has been permanently suspended.");
            auth.signOut();
            return;
        }

        // 4. STEP FOUR: Save session matrices locally for dashboard access validation
        localStorage.setItem('nexusAuthToken', secureToken);
        localStorage.setItem('nexusUserId', user.uid);
        localStorage.setItem('nexusUserRole', profile.role || 'student');

        submitBtn.textContent = "Redirecting to console...";
        
        // 5. STEP FIVE: Clear path to Dashboard workspace console
        window.location.replace('dashboard.html');

    } catch (err) {
        console.error("Authentication handshake rejected:", err);
        
        // Friendly error handler messages
        if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.message.includes("missing")) {
            alert("❌ Invalid email or password combination. Please try again.");
        } else if (err.code === 'auth/too-many-requests') {
            alert("⚠️ System Locked: Too many failed login attempts. Please sleep on it or try again later.");
        } else {
            alert("Login Pipeline Error: " + err.message);
        }
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Sign In to Dashboard";
        }
    }
}

// Fire up auth listener setup on page load
document.addEventListener('DOMContentLoaded', bootstrapAuthSystem);
