/**
 * Nexus Pro 2.0 - Core Administrative Library Publication Controller
 * File: admin-upload.js
 */

const DB_BASE_URL = "https://nexuspro-cf948-default-rtdb.europe-west1.firebasedatabase.app";

// Strict Admin Gatekeeper Check Sequence
async function runCredentialMatrixCheck() {
    const userId = localStorage.getItem('nexusUserId');
    const secureToken = localStorage.getItem('nexusAuthToken');

    if (!userId || !secureToken) {
        window.location.replace('login.html');
        return null;
    }

    try {
        const response = await fetch(`${DB_BASE_URL}/users/${userId}.json?auth=${secureToken}`);
        if (!response.ok) throw new Error("Security check failed.");
        
        const userData = await response.json();
        if (!userData || (userData.role || '').toLowerCase().trim() !== 'admin') {
            alert("🔒 Access denied. Administrative permissions required.");
            window.location.replace('dashboard.html');
            return null;
        }
        
        return secureToken; // Security check passed successfully
    } catch (err) {
        console.error("Authorization check fault:", err.message);
        window.location.replace('dashboard.html');
        return null;
    } finally {
        clearPreloaderOverlay();
    }
}

function clearPreloaderOverlay() {
    const loaderMask = document.getElementById('nexusPreloader');
    if (!loaderMask) return;
    
    loaderMask.classList.add('opacity-0', 'scale-98', 'pointer-events-none');
    setTimeout(() => { loaderMask.remove(); }, 200); 
}

document.addEventListener("DOMContentLoaded", async () => {
    // Run verification immediately on entry
    const activeSessionToken = await runCredentialMatrixCheck();
    if (!activeSessionToken) return;

    const uploadForm = document.getElementById('uploadForm');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = document.getElementById('btnText');

    uploadForm?.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Assemble structural library payload packet
        const libraryPayload = {
            title: document.getElementById('materialTitle').value.trim(),
            subject: document.getElementById('materialSubject').value,
            category: document.getElementById('materialCategory').value,
            url: document.getElementById('materialLink').value.trim(),
            timestamp: Date.now()
        };

        // Trigger visual UI loading states
        if (submitBtn) submitBtn.disabled = true;
        if (btnText) btnText.innerText = "Transmitting to Catalog Pool...";

        try {
            const targetUrl = `${DB_BASE_URL}/library.json?auth=${activeSessionToken}`;
            const uploadResponse = await fetch(targetUrl, {
                method: 'POST', // Generates unique auto-hashed node nodes inside Firebase lists
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(libraryPayload)
            });

            if (!uploadResponse.ok) throw new Error("Database engine refused packet ingestion.");

            alert("✅ Material successfully compiled and deployed to public catalog logs!");
            uploadForm.reset();

        } catch (error) {
            console.error("Upload tracking fault:", error.message);
            alert(`⚠️ Upload error: ${error.message}`);
        } finally {
            // Restore structural interaction state properties
            if (submitBtn) submitBtn.disabled = false;
            if (btnText) btnText.innerText = "Deploy Asset Pack to Library";
        }
    });
});
