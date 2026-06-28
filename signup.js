// Nexus Pro 2.0 - Core Registration & Instant Redirect Pipeline
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

        document.getElementById('registerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = e.target.querySelector('button[type="submit"]');
            
            const fullName = document.getElementById('regName').value.trim();
            const email = document.getElementById('regEmail').value.trim();
            const password = document.getElementById('regPassword').value;

            try {
                submitBtn.disabled = true;
                submitBtn.textContent = "Forging security keys...";

                // 1. Create the user inside Firebase Authentication
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                const secureToken = await user.getIdToken();

                submitBtn.textContent = "Writing secure profile node...";

                // 2. Write their initial account data to the Realtime Database
                // This satisfies our exact rule: auth != null && !data.exists()
                const newUserProfileRef = ref(db, `users/${user.uid}`);
                await set(newUserProfileRef, {
                    name: fullName,
                    role: "student", // Automatically joins as a student
                    status: "active",
                    gameMetrics: {
                        totalXP: 0,
                        currentLevel: 1
                    }
                });

                // 3. Clear existing tokens and save fresh session matrices locally
                localStorage.clear();
                localStorage.setItem('nexusAuthToken', secureToken);
                localStorage.setItem('nexusUserId', user.uid);
                localStorage.setItem('nexusUserRole', 'student');

                submitBtn.textContent = "SIGN UP SUCCESSFUL! REDIRECTING...";

                // 4. NATIVE SYSTEM FORCE REDIRECT
                // Placed in a mini-timeout to give localStorage a split second to lock in
                setTimeout(() => {
                    window.location.href = './dashboard.html';
                }, 100);

            } catch (err) {
                console.error("Registration pipeline aborted:", err);
                alert(`Sign Up Failed: ${err.message}`);
                submitBtn.disabled = false;
                submitBtn.textContent = "Create Account";
            }
        });

    } catch (criticalErr) {
        alert("System connection error. Could not reach configuration servers.");
    }
}

document.addEventListener('DOMContentLoaded', bootstrapRegisterSystem);
