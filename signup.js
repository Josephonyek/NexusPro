// Nexus Pro 2.0 - Ultimate Absolute Failsafe Sign-Up Control Engine
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-database.js";

// 1. HARDCODED CONFIG: Bypasses the network check completely so it works anywhere
const firebaseConfig = {
    apiKey: "AIzaSyA...", // 👈 Paste your actual Firebase API Key string here
    authDomain: "YOUR-PROJECT-ID.firebaseapp.com",
    databaseURL: "https://YOUR-PROJECT-ID-default-rtdb.firebaseio.com", // 👈 Make sure this points to your Realtime DB URL
    projectId: "YOUR-PROJECT-ID",
    storageBucket: "YOUR-PROJECT-ID.appspot.com",
    messagingSenderId: "1234567890",
    appId: "1:12345:web:abcdef"
};

// Initialize systems immediately on load
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

document.addEventListener('DOMContentLoaded', () => {
    const formElement = document.getElementById('registerForm');
    
    if (!formElement) {
        alert("CRITICAL BUG: Your HTML <form> is missing id='registerForm'!");
        return;
    }

    formElement.addEventListener('submit', async (e) => {
        // Kill reloads instantly and thoroughly
        e.preventDefault();
        e.stopPropagation();
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "Processing Secure Sign-Up...";
        }

        // Target your inputs
        const fullName = document.getElementById('regName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value;

        try {
            // 2. Create Auth Profile
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const secureToken = await user.getIdToken();

            // 3. Write User DB Node 
            const newUserProfileRef = ref(db, `users/${user.uid}`);
            await set(newUserProfileRef, {
                name: fullName,
                role: "student",
                status: "active",
                gameMetrics: { totalXP: 0, currentLevel: 1 }
            });

            // 4. Cache authorization variables
            localStorage.clear();
            localStorage.setItem('nexusAuthToken', secureToken);
            localStorage.setItem('nexusUserId', user.uid);
            localStorage.setItem('nexusUserRole', 'student');

            if (submitBtn) submitBtn.textContent = "Redirecting...";

            // 5. UNSTOPPABLE FORCE REDIRECT: Absolute URL path confirmation
            console.log("Redirect execution sequence fired.");
            window.location.href = "dashboard.html";

        } catch (err) {
            console.error("Caught Firebase execution error:", err);
            alert(`Sign Up Execution Fault: ${err.message}`);
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = "Create Account";
            }
        }
    });
});
