/**
 * Nexus Pro 2.0 - Core Administrative Library Publication & Removal Controller
 * File: admin-upload.js
 */

const DB_BASE_URL = "https://nexuspro-cf948-default-rtdb.europe-west1.firebasedatabase.app";
let currentUploadMode = "link"; 
let activeSessionToken = "";

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
        return secureToken;
    } catch (err) {
        console.warn("Auth verify mismatch:", err.message);
        return secureToken;
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

async function fetchAndRenderAdminCatalog() {
    const container = document.getElementById('adminCatalogContainer');
    if (!container) return;

    try {
        const response = await fetch(`${DB_BASE_URL}/library.json?auth=${activeSessionToken}`);
        if (!response.ok) throw new Error("Could not sync live repository lists.");
        
        const catalogData = await response.json();
        container.innerHTML = "";

        if (!catalogData) {
            container.innerHTML = `<div class="text-center text-xs text-neutral-500 py-6">No media assets cataloged on backend.</div>`;
            return;
        }

        Object.keys(catalogData).reverse().forEach(nodeKey => {
            const entry = catalogData[nodeKey];
            const itemRow = document.createElement('div');
            itemRow.className = "flex items-center justify-between gap-4 p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl hover:border-neutral-700/60 transition-colors";
            
            const hasVideo = entry.videoReference && entry.videoReference.link ? "🎬 Video Attached" : "📄 Doc Only";

            itemRow.innerHTML = `
                <div class="min-w-0 flex-1">
                    <h4 class="text-sm font-bold text-neutral-200 truncate">${entry.title}</h4>
                    <div class="flex items-center gap-2 mt-1 text-[10px] font-semibold text-neutral-500 uppercase tracking-wide">
                        <span class="text-blue-400">${entry.subject}</span>
                        <span>•</span>
                        <span>${entry.category}</span>
                        <span>•</span>
                        <span class="text-amber-500">${hasVideo}</span>
                    </div>
                </div>
                <button data-id="${nodeKey}" class="delete-btn px-3 py-1.5 bg-red-950/40 hover:bg-red-900/60 border border-red-900/40 text-red-400 text-xs font-bold rounded-lg cursor-pointer transition-all shrink-0">
                    Delete
                </button>
            `;
            container.appendChild(itemRow);
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const targetNodeId = e.target.getAttribute('data-id');
                if (confirm("⚠️ Are you sure you want to permanently delete this material entry?")) {
                    await executeCatalogDeletion(targetNodeId, e.target);
                }
            });
        });

    } catch (err) {
        container.innerHTML = `<div class="text-center text-xs text-red-400 py-6">Catalog syncing error: ${err.message}</div>`;
    }
}

async function executeCatalogDeletion(nodeId, buttonElement) {
    buttonElement.disabled = true;
    buttonElement.innerText = "Purging...";

    try {
        const targetUrl = `${DB_BASE_URL}/library/${nodeId}.json?auth=${activeSessionToken}`;
        const deleteResponse = await fetch(targetUrl, { method: 'DELETE' });
        if (!deleteResponse.ok) throw new Error("Firebase server refused deletion.");
        alert("🗑️ Resource node wiped out successfully!");
        await fetchAndRenderAdminCatalog();
    } catch (err) {
        alert(`Deletion Error: ${err.message}`);
        buttonElement.disabled = false;
        buttonElement.innerText = "Delete";
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    activeSessionToken = await runCredentialMatrixCheck();
    if (!activeSessionToken) return;

    await fetchAndRenderAdminCatalog();

    const tabLinkMode = document.getElementById('tabLinkMode');
    const tabFileMode = document.getElementById('tabFileMode');
    const containerLinkInput = document.getElementById('containerLinkInput');
    const containerFileInput = document.getElementById('containerFileInput');
    const materialFile = document.getElementById('materialFile');
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    const uploadForm = document.getElementById('uploadForm');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = document.getElementById('btnText');

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

    materialFile?.addEventListener('change', (e) => {
        const fileNode = e.target.files[0];
        if (fileNode && fileNameDisplay) {
            // UPGRADED CEILING: Safety tripwire set to 9MB to protect database sync pipes
            if (fileNode.size > 9 * 1024 * 1024) {
                alert("⚠️ File too large for direct database injection!\n\nTo keep your platform fast, direct uploads are capped at 9MB.\n\nFor massive textbooks, upload to Google Drive as 'Viewer Only' and use the 'Web Link' tab instead.");
                materialFile.value = "";
                fileNameDisplay.innerText = "Select file node from storage disk...";
                return;
            }
            fileNameDisplay.innerText = `Selected: ${fileNode.name} (${(fileNode.size / 1024 / 1024).toFixed(2)} MB)`;
        }
    });

    uploadForm?.addEventListener('submit', async (event) => {
        event.preventDefault();
        let finalAssetPayloadAddress = "";

        if (submitBtn) submitBtn.disabled = true;
        if (btnText) btnText.innerText = "Processing File Matrix (Please do not close tab)...";

        if (currentUploadMode === "file") {
            const rawFile = materialFile.files[0];
            if (!rawFile) {
                alert("Please select a file asset first.");
                if (submitBtn) submitBtn.disabled = false;
                if (btnText) btnText.innerText = "Deploy Asset Pack to Library";
                return;
            }
            
            try {
                finalAssetPayloadAddress = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = error => reject(error);
                    reader.readAsDataURL(rawFile);
                });
            } catch (fileErr) {
                alert("File serialization failure.");
                if (submitBtn) submitBtn.disabled = false;
                if (btnText) btnText.innerText = "Deploy Asset Pack to Library";
                return;
            }
        } else {
            finalAssetPayloadAddress = document.getElementById('materialLink').value.trim();
        }

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

            if (!uploadResponse.ok) throw new Error("Ingestion rejected by database server.");

            alert("✅ Material asset payload compiled and deployed safely!");
            uploadForm.reset();
            if (fileNameDisplay) fileNameDisplay.innerText = "Select file node from storage disk...";
            tabLinkMode.click(); 

            await fetchAndRenderAdminCatalog();

        } catch (error) {
            alert(`⚠️ Database Rejected Upload: ${error.message}`);
        } finally {
            if (submitBtn) submitBtn.disabled = false;
            if (btnText) btnText.innerText = "Deploy Asset Pack to Library";
        }
    });
});
