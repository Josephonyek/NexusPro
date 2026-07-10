/**
 * Nexus Pro 2.0 - E-Library Core Student Portal Catalog Loader
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
        // Direct fetch request to read the library catalog node
        const response = await fetch(`${DB_BASE_URL}/library.json?auth=${secureToken}`);
        if (!response.ok) throw new Error("Catalog telemetry transmission denied.");
        
        const libraryData = await response.json();
        
        if (libraryData) {
            // Convert indexed object nodes into sequential layout arrays
            localCatalogCache = Object.keys(libraryData).map(key => ({
                id: key,
                ...libraryData[key]
            })).sort((a, b) => b.timestamp - a.timestamp);
        }

        renderLibraryGrid("all");

    } catch (err) {
        console.error("Library load sequence exception:", err.message);
        document.getElementById('libraryContainer').innerHTML = `
            <div class="col-span-full border border-neutral-800 p-6 rounded-2xl text-center text-xs text-neutral-500">
                Failed to sync with library data node: ${err.message}
            </div>`;
    } finally {
        const preloader = document.getElementById('nexusPreloader');
        if (preloader) {
            preloader.classList.add('opacity-0', 'pointer-events-none');
            setTimeout(() => preloader.remove(), 200);
        }
    }
}

function renderLibraryGrid(selectedSubject) {
    const container = document.getElementById('libraryContainer');
    const emptyBox = document.getElementById('emptyStateBox');
    const counterDisplay = document.getElementById('activeCounter');
    
    if (!container) return;
    container.innerHTML = "";

    // Filter local memory cache arrays based on user choice
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

    // Process and construct individual interactive item card shells
    filteredDataset.forEach(item => {
        const cardShell = document.createElement('div');
        cardShell.className = "bg-neutral-900 border border-neutral-800/80 hover:border-neutral-700/60 p-5 rounded-2xl flex flex-col justify-between space-y-4 transition-all";

        // Build specific download/view trigger anchor loops based on storage configurations
       // Old logic let them download; this updated block forces online browser viewing
let interactionButtonHtml = "";
if (item.uploadType === "file") {
    // Forces the Base64 file or PDF asset to open inside a new browser tab for viewing only
    interactionButtonHtml = `
        <a href="${item.assetAddress}" target="_blank" rel="noopener noreferrer" 
           class="flex-1 text-center bg-blue-950 text-blue-400 hover:bg-blue-900/60 border border-blue-900/40 text-xs font-bold px-3 py-2.5 rounded-xl transition-all">
           📖 Read Material Online
        </a>`;
} else {
    // Standard web links open safely in a new tab
    interactionButtonHtml = `
        <a href="${item.assetAddress}" target="_blank" rel="noopener noreferrer" 
           class="flex-1 text-center bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold px-3 py-2.5 rounded-xl transition-all">
           🌐 Open Material Link
        </a>`;
}

        // Check if a video lecture reference accompanies this textbook node
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
    // Connect subject filter click events
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Clean dynamic active badge properties across elements
            buttons.forEach(b => {
                b.className = "filter-btn px-4 py-2 text-xs font-bold rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-neutral-200 whitespace-nowrap cursor-pointer transition-all";
            });
            // Elevate targeted selection class properties
            e.target.className = "filter-btn px-4 py-2 text-xs font-bold rounded-xl border border-blue-900/40 bg-blue-950 text-blue-400 whitespace-nowrap cursor-pointer transition-all";
            
            const targetSubject = e.target.getAttribute('data-subject');
            renderLibraryGrid(targetSubject);
        });
    });

    initializeAcademyCatalog();
});
