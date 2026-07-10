/**
 * Nexus Pro 2.0 - E-Library Core Student Portal Catalog Loader
 * File: academy.js
 */

const DB_BASE_URL = "https://nexuspro-cf948-default-rtdb.europe-west1.firebasedatabase.app";
let localCatalogCache = [];

async function initializeAcademyCatalog() {
    const userId = localStorage.getItem('nexusUserId');
    const secureToken = localStorage.getItem('nexusAuthToken');

    // Verification check: Redirect to login if tokens are missing completely
    if (!userId || !secureToken) {
        console.error("Missing local session authentication tokens.");
        localStorage.clear();
        window.location.replace('login.html');
        return;
    }

    try {
        // Appends the active security token to pass the strict Firebase Rules validation checks
        const targetUrl = `${DB_BASE_URL}/library.json?auth=${secureToken}`;
        const response = await fetch(targetUrl);
        
        if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`Server returned code ${response.status}: ${errBody || 'Forbidden Access'}`);
        }
        
        const libraryData = await response.json();
        
        if (libraryData) {
            // Unpack Firebase objects into an ordered array list
            localCatalogCache = Object.keys(libraryData).map(key => ({
                id: key,
                ...libraryData[key]
            })).sort((a, b) => b.timestamp - a.timestamp);
        } else {
            localCatalogCache = [];
        }

        renderLibraryGrid("all");

    } catch (err) {
        console.error("Critical Catalog Fetch Failure Details:", err);
        document.getElementById('libraryContainer').innerHTML = `
            <div class="col-span-full border border-red-900/40 bg-red-950/10 p-6 rounded-2xl text-center text-xs text-red-400 max-w-md mx-auto">
                <p class="font-bold mb-1">⚠️ System Sync Failure</p>
                <p class="text-neutral-400 mb-2">${err.message}</p>
                <p class="text-[10px] text-neutral-500">Verify your Firebase Rules block or try re-logging to refresh your user auth token state.</p>
            </div>`;
    } finally {
        clearPreloaderMask();
    }
}

function clearPreloaderMask() {
    const preloader = document.getElementById('nexusPreloader');
    if (preloader) {
        preloader.classList.add('opacity-0', 'pointer-events-none');
        setTimeout(() => preloader.remove(), 200);
    }
}

function renderLibraryGrid(selectedSubject) {
    const container = document.getElementById('libraryContainer');
    const emptyBox = document.getElementById('emptyStateBox');
    const counterDisplay = document.getElementById('activeCounter');
    
    if (!container) return;
    container.innerHTML = "";

    // Process client-side caching filters fast
    const filteredDataset = selectedSubject === "all" 
        ? localCatalogCache 
        : localCatalogCache.filter(item => item.subject === selectedSubject);

    if (counterDisplay) {
        counterDisplay.innerText = `${filteredDataset.length} Resource${filteredDataset.length === 1 ? '' : 's'} Live`;
    }

    if (filteredDataset.length === 0) {
        emptyBox?.classList.remove('hidden');
        return;
    } else {
        emptyBox?.classList.add('hidden');
    }

    filteredDataset.forEach(item => {
        const cardShell = document.createElement('div');
        cardShell.className = "bg-neutral-900 border border-neutral-800/80 hover:border-neutral-700/60 p-5 rounded-2xl flex flex-col justify-between space-y-4 transition-all";

        // Premium Online-Only Logic: Forces assets to open inside a browser frame securely instead of local download
        let interactionButtonHtml = "";
        const finalAssetUrl = item.assetAddress || "#";

        if (item.uploadType === "file") {
            interactionButtonHtml = `
                <a href="${finalAssetUrl}" target="_blank" rel="noopener noreferrer" 
                   class="flex-1 text-center bg-blue-950 text-blue-400 hover:bg-blue-900/60 border border-blue-900/40 text-xs font-bold px-3 py-2.5 rounded-xl transition-all">
                   📖 Read Material Online
                </a>`;
        } else {
            interactionButtonHtml = `
                <a href="${finalAssetUrl}" target="_blank" rel="noopener noreferrer" 
                   class="flex-1 text-center bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold px-3 py-2.5 rounded-xl transition-all">
                   🌐 Open Material Link
                </a>`;
        }

        // Render complementary video references if attached to database entry nodes
        let videoReferenceHtml = "";
        if (item.videoReference && item.videoReference.link) {
            videoReferenceHtml = `
                <div class="mt-2 pt-3 border-t border-neutral-800/60 space-y-1.5">
                    <span class="block text-[10px] font-bold text-neutral-500 uppercase tracking-wide">🎬 Attached Video Lecture</span>
                    <a href="${item.videoReference.link}" target="_blank" rel="noopener noreferrer" 
                       class="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 hover:text-amber-300 hover:underline transition-colors">
                       ▶️ ${item.videoReference.title || "Watch Walkthrough Guide"}
                    </a>
                </div>`;
        }

        cardShell.innerHTML = `
            <div class="space-y-2">
                <div class="flex items-center justify-between gap-2">
                    <span class="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-neutral-950 text-neutral-400 border border-neutral-800">${item.subject}</span>
                    <span class="text-[10px] font-bold text-neutral-500 uppercase">${item.category}</span>
                </div>
                <h3 class="text-base font-bold tracking-tight text-neutral-100 line-clamp-2">${item.title}</h3>
                ${videoReferenceHtml}
            </div>
            <div class="flex items-center gap-2 pt-2">
                ${interactionButtonHtml}
            </div>
        `;
        container.appendChild(cardShell);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            buttons.forEach(b => {
                b.className = "filter-btn px-4 py-2 text-xs font-bold rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-neutral-200 whitespace-nowrap cursor-pointer transition-all";
            });
            e.target.className = "filter-btn px-4 py-2 text-xs font-bold rounded-xl border border-blue-900/40 bg-blue-950 text-blue-400 whitespace-nowrap cursor-pointer transition-all";
            
            const targetSubject = e.target.getAttribute('data-subject');
            renderLibraryGrid(targetSubject);
        });
    });

    initializeAcademyCatalog();
});
