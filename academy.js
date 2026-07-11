/**
 * Nexus Pro 2.0 - Hybrid PDF, DOCX, & Link Dropdown Stream Engine
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
        if (!response.ok) throw new Error(`Access verification error: ${response.status}`);
        
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

// HELPER: Converts Base64 string directly into a raw binary ArrayBuffer
function base64ToArrayBuffer(base64Data) {
    const base64Content = base64Data.split(';base64,')[1] || base64Data;
    const rawBinary = atob(base64Content);
    const buffer = new ArrayBuffer(rawBinary.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < rawBinary.length; i++) {
        view[i] = rawBinary.charCodeAt(i);
    }
    return buffer;
}

// COMPREHENSIVE FILE ROUTING SWITCH
async function handleInlineFileRender(base64Data, containerElement) {
    containerElement.innerHTML = `<div class="text-xs text-neutral-400 animate-pulse p-4">Decrypting and assembling secure document nodes...</div>`;
    
    const isPdf = base64Data.startsWith("data:application/pdf") || base64Data.includes("JVBERi");
    const isDocx = base64Data.startsWith("data:application/vnd.openxmlformats-officedocument.wordprocessingml.document") || base64Data.includes("UEsDB");

    try {
        const arrayBuffer = base64ToArrayBuffer(base64Data);
        containerElement.innerHTML = ""; 

        if (isPdf) {
            const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
            const pdf = await loadingTask.promise;
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const viewport = page.getViewport({ scale: 1.4 });
                const canvas = document.createElement('canvas');
                canvas.className = "w-full max-w-2xl mx-auto mb-4 rounded-lg shadow-md bg-white";
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                await page.render({ canvasContext: context, viewport: viewport }).promise;
                containerElement.appendChild(canvas);
            }
        } else if (isDocx) {
            const docxContainer = document.createElement('div');
            docxContainer.className = "bg-white text-neutral-900 p-8 max-w-3xl mx-auto rounded-lg shadow-md overflow-x-auto docx-render-wrapper";
            containerElement.appendChild(docxContainer);
            
            await docx.renderAsync(arrayBuffer, docxContainer, docxContainer, {
                className: "docx",
                inWrapper: false
            });
        } else {
            const textDecoder = new TextDecoder("utf-8");
            const decodedText = textDecoder.decode(arrayBuffer);
            containerElement.innerHTML = `<div class="text-neutral-300 font-mono text-xs whitespace-pre-wrap p-2">${decodedText}</div>`;
        }
    } catch (err) {
        console.error("Document core rendering engine failure:", err);
        containerElement.innerHTML = `
            <div class="text-xs text-red-400 p-4 bg-red-950/20 border border-red-900/30 rounded-xl">
                ⚠️ Rendering Pipeline Error: Could not decode document structure cleanly.
            </div>`;
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
                <button data-id="${item.id}" class="toggle-reader-btn sm:w-auto text-center bg-blue-950 text-blue-400 hover:bg-blue-900/60 border border-blue-900/40 text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap">
                    📖 Read Online
                </button>
            </div>

            <div id="viewer-${item.id}" class="hidden w-full border-t border-neutral-800/80 pt-4 transition-all">
                <div class="w-full max-h-[650px] min-h-[250px] bg-neutral-950 rounded-xl border border-neutral-800 p-4 overflow-y-auto relative" id="content-${item.id}">
                    </div>
            </div>
        `;
        container.appendChild(cardShell);
    });

    document.querySelectorAll('.toggle-reader-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const nodeId = btn.getAttribute('data-id');
            const dropdownTarget = document.getElementById(`viewer-${nodeId}`);
            const renderContentBox = document.getElementById(`content-${nodeId}`);
            const recordData = localCatalogCache.find(i => i.id === nodeId);
            
            if (!dropdownTarget || !renderContentBox || !recordData) return;

            if (dropdownTarget.classList.contains('hidden')) {
                dropdownTarget.classList.remove('hidden');
                btn.innerText = "❌ Close Reader";
                btn.className = "toggle-reader-btn sm:w-auto text-center bg-neutral-800 text-neutral-200 border border-neutral-700 text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap";

                // CRITICAL ROUTING FIX: Web links bypass binary handlers completely
                if (recordData.uploadType === "file") {
                    await handleInlineFileRender(recordData.assetAddress, renderContentBox);
                } else {
                    renderContentBox.innerHTML = `<iframe src="${recordData.assetAddress}" class="w-full h-[500px] border-none rounded-xl bg-neutral-950"></iframe>`;
                }
            } else {
                dropdownTarget.classList.add('hidden');
                renderContentBox.innerHTML = ""; 
                btn.innerText = "📖 Read Online";
                btn.className = "toggle-reader-btn sm:w-auto text-center bg-blue-950 text-blue-400 hover:bg-blue-900/60 border border-blue-900/40 text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap";
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
