// Nexus Pro 2.0 - Core Registration & Bug-Free Redirect Engine
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-database.js";

async function bootstrapRegisterSystem() {
    try {
        const configResponse = await fetch('./api/firebaseConfig');
        const firebaseConfig = await configResponse.json();

        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const db = getDatabase(app);

        const formElement = document.getElementById('registerForm');
        
        formElement.addEventListener('submit', async (e) => {
            // FIX #1: Lock the browser down immediately so it CANNOT refresh the page
            e.preventDefault();
            e.stopPropagation();
            
            const submitBtn = e.target.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.disabled = true;

            const fullName = document.getElementById('regName').value.trim();
            const email = document.getElementById('regEmail').value.trim();
            const password = document.getElementById('regPassword').value;

            try {
                if (submitBtn) submitBtn.textContent = "Creating Account...";

                // 1. Authenticate user via Firebase Auth
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                const secureToken = await user.getIdToken();

                if (submitBtn) submitBtn.textContent = "Saving Profile...";

                // 2. Safely push user metadata to Realtime Database
                const newUserProfileRef = ref(db, `users/${user.uid}`);
                await set(newUserProfileRef, {
                    name: fullName,
                    role: "student",
                    status: "active",
                    gameMetrics: {
                        totalXP: 0,
                        currentLevel: 1
                    }
                });

                // 3. Store active session states safely
                localStorage.clear();
                localStorage.setItem('nexusAuthToken', secureToken);
                localStorage.setItem('nexusUserId', user.uid);
                localStorage.setItem('nexusUserRole', 'student');

                if (submitBtn) submitBtn.textContent = "Redirecting Now...";

                // FIX #2: Unstoppable Native Window Core Location Force
                window.location.replace('dashboard.html');

            } catch (err) {
                console.error("Signup bug caught:", err);
                alert(`Sign Up Error: ${err.message}`);
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = "Create Account";
                }
            }
        });

    } catch (criticalErr) {
        console.error("Config connection fault:", criticalErr);
    }
}

document.addEventListener('DOMContentLoaded', bootstrapRegisterSystem);
