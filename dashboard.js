// Nexus Pro 2.0 - Ultimate Force Redirect System
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

async function bootstrapAuthSystem() {
    try {
        const configResponse = await fetch('./api/firebaseConfig');
        const firebaseConfig = await configResponse.json();

        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);

        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = e.target.querySelector('button[type="submit"]');
            
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;

            try {
                submitBtn.disabled = true;
                submitBtn.textContent = "Connecting to core authentication...";

                // 1. Authenticate with pure Firebase Auth immediately
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const token = await userCredential.user.getIdToken();

                // 2. Clear out local storage matrices and set values instantly
                localStorage.clear();
                localStorage.setItem('nexusAuthToken', token);
                localStorage.setItem('nexusUserId', userCredential.user.uid);
                localStorage.setItem('nexusUserRole', 'admin'); // temporary bypass assignment

                submitBtn.textContent = "LOGIN SUCCESSFUL! LEAVING PAGE...";

                // 3. THE ULTIMATE UN-STOPPABLE REDIRECT FORCE
                // Using timeout to clear execution stack lines completely
                setTimeout(() => {
                    window.location.href = 'dashboard.html'; 
                }, 50);

            } catch (err) {
                alert(`Sign In Denied: ${err.message}`);
                submitBtn.disabled = false;
                submitBtn.textContent = "Sign In to Dashboard";
            }
        });

    } catch (criticalErr) {
        alert("System connection error. Check your server settings.");
    }
}

document.addEventListener('DOMContentLoaded', bootstrapAuthSystem);
