/**
 * Nexus Pro 2.0 - Core Administrative Library Publication Controller
 * File: admin-upload.js
 */

const DB_BASE_URL = "https://nexuspro-cf948-default-rtdb.europe-west1.firebasedatabase.app";

let currentUploadMode = "link"; // Tracking matrix toggle variable: 'link' or 'file'

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
        return secureToken;
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
    loaderMask.classList.add('opacity-0', 'pointer-events-none');
    setTimeout(() => { loaderMask.remove(); }, 200); 
}

document.addEventListener("DOMContentLoaded", async () => {
    const activeSessionToken = await runCredentialMatrixCheck();
    if (!activeSessionToken) return;

    // UI Element Hook Arrays
    const tabLinkMode = document.getElementById('tabLinkMode');
    const tabFileMode = document.getElementById('tabFileMode');
    const containerLinkInput = document.getElementById('containerLinkInput');
    const containerFileInput = document.getElementById('containerFileInput');
    const materialFile = document.getElementById('materialFile');
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    const uploadForm = document.getElementById('uploadForm');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = document.getElementById('btnText');

    // TAB SWITCH TOGGLE MECHANICS
    tabLinkMode?.addEventListener('click', () => {
        currentUploadMode = "link";
        tabLinkMode.className = "py-2 text-xs font-bold rounded-lg transition-all cursor-pointer bg-neutral-800 text-red-400";
        tabFileMode.className = "py-2 text-xs font-bold rounded-lg transition-all cursor-pointer text-neutral-400 hover:text-neutral-200";
        containerLinkInput.classList.remove('hidden');
        containerFileInput.classList.add('hidden');
        document.getElementById('materialLink').required = true;
    });

    tabFileMode?.addEventListener('click', () => {
        currentUploadMode = "file";
        tabFileMode.className = "py-2 text-xs font-bold rounded-lg transition-all cursor-pointer bg-neutral-800 text-red-400";
        tabLinkMode.className = "py-2 text-xs font-bold rounded-lg transition-all cursor-pointer text-neutral-400 hover:text-neutral-200";
        containerFileInput.classList.remove('hidden');
        containerLinkInput.classList.add('hidden');
        document.getElementById('materialLink').required = false;
    });

    // Handle local file selection visualization 
    materialFile?.addEventListener('change', (e) => {
        const fileNode = e.target.files[0];
        if (fileNode && fileNameDisplay) {
            fileNameDisplay.innerText = `Selected: ${fileNode.name} (${(fileNode.size / 1024 / 1024).toFixed(2)} MB)`;
        }
    });

    // SUBMIT TRANSACTION PROCESSING
    uploadForm?.addEventListener('submit', async (event) => {
        event.preventDefault();

        let finalAssetPayloadAddress = "";

        if (submitBtn) submitBtn.disabled = true;
        if (btnText) btnText.innerText = "Transmitting to Catalog Pool...";

        // Handle File Extraction Serialization 
        if (currentUploadMode === "file") {
            const rawFile = materialFile.files[0];
            if (!rawFile) {
                alert("Please drop or select a file asset first.");
                if (submitBtn) submitBtn.disabled = false;
                if (btnText) btnText.innerText = "Deploy Asset Pack to Library";
                return;
            }
            
            // Base64 conversion fallback safely stores file inside database node strings
            try {
                finalAssetPayloadAddress = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = error => reject(error);
                    reader.readAsDataURL(rawFile);
                });
            } catch (fileErr) {
                alert("File compilation failure. Please verify structural properties.");
                if (submitBtn) submitBtn.disabled = false;
                return;
            }
        } else {
            finalAssetPayloadAddress = document.getElementById('materialLink').value.trim();
        }

        // Build composite metadata payload block
        const compositePayload = {
            title: document.getElementById('materialTitle').value.trim(),
            subject: document.getElementById('materialSubject').value,
            category: document.getElementById('materialCategory').value,
            uploadType: currentUploadMode,
            assetAddress: finalAssetPayloadAddress,
            videoReference: {
                link: document.getElementById('videoLink').value.trim() || null,
                title: document.getElementById('videoTitle').value.trim() || null
            },
            timestamp: Date.now()
        };

        try {
            const targetUrl = `${DB_BASE_URL}/library.json?auth=${activeSessionToken}`;
            const uploadResponse = await fetch(targetUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(compositePayload)
            });

            if (!uploadResponse.ok) throw new Error("Database engine rejected packet ingestion.");

            alert("✅ Material asset payload compiled and deployed safely to public logs!");
            uploadForm.reset();
            if (fileNameDisplay) fileNameDisplay.innerText = "Select file node from storage disk...";
            tabLinkMode.click(); // Reset layout to standard format links

        } catch (error) {
            console.error("Upload tracking fault:", error.message);
            alert(`⚠️ Upload error: ${error.message}`);
        } finally {
            if (submitBtn) submitBtn.disabled = false;
            if (btnText) btnText.innerText = "Deploy Asset Pack to Library";
        }
    });
});
