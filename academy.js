/**
 * Nexus Pro 2.0 - E-Library Dropdown Reader Stream Engine
 * File: academy.js
 */

const DB_BASE_URL = "https://nexuspro-cf948-default-rtdb.europe-west1.firebasedatabase.app";
let localCatalogCache = [];

async function initializeAcademyCatalog() {
    const userId = localStorage.getItem('nexusUserId');
    const secureToken = localStorage.getItem('nexusAuthToken');

    if (!userId || !secureToken) {
        localStorage.clear();
        window.location.replace('login.html');
        return;
    }

    try {
        const targetUrl = `${DB_BASE_URL}/library.json?auth=${secureToken}`;
        const response = await fetch(targetUrl);
        
        if (!response.ok) throw new Error(`Access verification code error: ${response.status}`);
        
        const libraryData = await response.json();
        localCatalogCache = libraryData ? Object.keys(libraryData).map(key => ({ id: key, ...libraryData[key] })).sort((a, b) => b.timestamp - a.timestamp) : [];

        renderLibraryGrid("all");

    } catch (err) {
        document.getElementById('libraryContainer').innerHTML = `
            <div class="border border-red-900/40 bg-red-950/10 p-6 rounded-2xl text-center text-xs text-red-400 max-w-md mx-auto">
                <p class="font-bold">⚠️ Connection Sync Dropped</p>
                <p class="text-neutral-400 mt-1">${err.message}</p>
            </div>`;
    } finally {
        const preloader = document.getElementById('nexusPreloader');
        if (preloader) { preloader.classList.add('opacity-0', 'pointer-events-none'); setTimeout(() => preloader.remove(), 200); }
    }
}

function renderLibraryGrid(selectedSubject) {
    const container = document.getElementById('libraryContainer');
    const emptyBox = document.getElementById('emptyStateBox');
    const counterDisplay = document.getElementById('activeCounter');
    
    if (!container) return;
    container.innerHTML = "";

    const filteredDataset = selectedSubject === "all" ? localCatalogCache : localCatalogCache.filter(item => item.subject === selectedSubject);

    if (counterDisplay) counterDisplay.innerText = `${filteredDataset.length} Active Asset${filteredDataset.length === 1 ? '' : 's'}`;

    if (filteredDataset.length === 0) {
        emptyBox?.classList.remove('hidden');
        return;
    } else {
        emptyBox?.classList.add('hidden');
    }

    filteredDataset.forEach(item => {
        const cardShell = document.createElement('div');
        cardShell.className = "bg-neutral-900 border border-neutral-800/80 rounded-2xl p-5 flex flex-col space-y-4 transition-all overflow-hidden";

        let videoReferenceHtml = "";
        if (item.videoReference && item.videoReference.link) {
            videoReferenceHtml = `
                <div class="pt-2 border-t border-neutral-800/40 flex items-center gap-2">
                    <span class="text-[10px] font-bold text-neutral-500 uppercase tracking-wide">🎬 Video:</span>
                    <a href="${item.videoReference.link}" target="_blank" rel="noopener noreferrer" class="text-xs text-amber-400 hover:underline">
                        ▶️ ${item.videoReference.title || "Watch Walkthrough"}
                    </a>
                </div>`;
        }

        // The card layout houses the header, text metadata, and a collapsed viewer console node at the bottom
        cardShell.innerHTML = `
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div class="space-y-1 flex-1">
                    <div class="flex items-center gap-2">
                        <span class="px-2 py-0.5 text-[10px] font-black uppercase rounded bg-neutral-950 text-neutral-400 border border-neutral-800">${item.subject}</span>
                        <span class="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">${item.category}</span>
                    </div>
                    <h3 class="text-base font-bold tracking-tight text-neutral-100">${item.title}</h3>
                    ${videoReferenceHtml}
                </div>
                <button data-url="${item.assetAddress}" data-id="${item.id}" class="toggle-reader-btn sm:w-auto text-center bg-blue-950 text-blue-400 hover:bg-blue-900/60 border border-blue-900/40 text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap">
                    📖 Read Online
                </button>
            </div>

            <div id="viewer-${item.id}" class="hidden w-full border-t border-neutral-800/80 pt-4 transition-all">
                <div class="w-full h-[500px] bg-neutral-950 rounded-xl border border-neutral-800 overflow-hidden relative">
                    <iframe src="${item.assetAddress}" class="w-full h-full border-none rounded-xl" allow="autoplay"></iframe>
                </div>
            </div>
        `;
        container.appendChild(cardShell);
    });

    // BIND EVENT TRIGGER HOOKS TO DETECT DROPDOWN ACTIONS
    document.querySelectorAll('.toggle-reader-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const nodeId = btn.getAttribute('data-id');
            const dropdownTarget = document.getElementById(`viewer-${nodeId}`);
            
            if (!dropdownTarget) return;

            if (dropdownTarget.classList.contains('hidden')) {
                // Open the reader dropdown drawer
                dropdownTarget.classList.remove('hidden');
                btn.innerText = "❌ Close Reader";
                btn.className = "toggle-reader-btn sm:w-auto text-center bg-neutral-800 text-neutral-200 border border-neutral-700 text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap";
            } else {
                // Collapse the reader dropdown drawer
                dropdownTarget.classList.add('hidden');
                btn.innerText = "📖 Read Online";
                btn.className = "toggle-reader-btn sm:w-auto text-center bg-blue-950 text-blue-400 hover:bg-blue-900/60 border border-blue-900/40 text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap";
                
                // Refresh iframe src to kill any buffered stream processes safely on collapse
                const frame = dropdownTarget.querySelector('iframe');
                if (frame) { const tmp = frame.src; frame.src = ""; frame.src = tmp; }
            }
        });
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            buttons.forEach(b => b.className = "filter-btn px-4 py-2 text-xs font-bold rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-neutral-200 whitespace-nowrap cursor-pointer transition-all");
            e.target.className = "filter-btn px-4 py-2 text-xs font-bold rounded-xl border border-blue-900/40 bg-blue-950 text-blue-400 whitespace-nowrap cursor-pointer transition-all";
            renderLibraryGrid(e.target.getAttribute('data-subject'));
        });
    });

    initializeAcademyCatalog();
});
