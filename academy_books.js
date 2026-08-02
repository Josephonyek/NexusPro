document.addEventListener("DOMContentLoaded", () => {
  const API_ENDPOINT = "/api/books.js";
  const booksGrid = document.getElementById("booksGrid");
  const searchInput = document.getElementById("searchBookInput");
  const categoryFilter = document.getElementById("categoryFilter");

  // Reader Modal Elements
  const readerModal = document.getElementById("readerModal");
  const readerIframe = document.getElementById("readerIframe");
  const readerTitle = document.getElementById("readerTitle");
  const readerAuthor = document.getElementById("readerAuthor");

  let allBooks = [];

  // 1. Fetch & Render Books
  async function fetchBooks() {
    try {
      const res = await fetch(`${API_ENDPOINT}?action=list-books`);
      if (!res.ok) throw new Error("Failed to load");

      const data = await res.json();
      allBooks = data.books || (Array.isArray(data) ? data : []);

      renderBooks(allBooks);
    } catch (err) {
      if (booksGrid) {
        booksGrid.innerHTML = `
          <div class="empty-state" style="color: #ef4444;">
            <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 10px;"></i>
            <p>Could not connect to library database.</p>
          </div>
        `;
      }
    }
  }

  function renderBooks(books) {
    if (!booksGrid) return;

    if (!books || books.length === 0) {
      booksGrid.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-folder-open" style="font-size: 2.5rem; margin-bottom: 12px;"></i>
          <p>No books match your request.</p>
        </div>
      `;
      return;
    }

    booksGrid.innerHTML = books.map(book => `
      <div class="book-card">
        <div class="book-cover">
          <img src="${escapeHtml(book.coverUrl)}" alt="${escapeHtml(book.title)}" onerror="this.src='https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&q=80'">
        </div>
        <div class="book-body">
          <div>
            <span class="category-tag">${escapeHtml(book.category || "General")}</span>
            <div class="book-title">${escapeHtml(book.title)}</div>
            <div class="book-author">By ${escapeHtml(book.author || "Unknown")}</div>
          </div>
          <button class="btn-read" onclick="openReader('${book.id}')">
            <i class="fas fa-book-reader"></i> Read Online
          </button>
        </div>
      </div>
    `).join("");
  }

  // 2. Read Online Only Modal Logic
  window.openReader = function(id) {
    const book = allBooks.find(b => String(b.id) === String(id));
    if (!book) return;

    readerTitle.textContent = book.title;
    readerAuthor.textContent = `By ${book.author || "Unknown"}`;

    // Format embed URL for reading without direct download options
    readerIframe.src = formatEmbedUrl(book.fileUrl);

    readerModal.style.display = "flex";
    document.body.style.overflow = "hidden";
  };

  window.closeReader = function() {
    readerModal.style.display = "none";
    readerIframe.src = "";
    document.body.style.overflow = "auto";
  };

  window.toggleNativeFullscreen = function() {
    if (!document.fullscreenElement) {
      readerModal.requestFullscreen().catch(err => alert("Fullscreen error: " + err.message));
    } else {
      document.exitFullscreen();
    }
  };

  function formatEmbedUrl(url) {
    if (!url) return "";

    // Convert Google Drive view links into clean inline preview mode
    if (url.includes("drive.google.com")) {
      return url.replace(/\/view.*$/, "/preview").replace(/\/edit.*$/, "/preview");
    }

    // Wrap raw PDF links inside Google Docs viewer for in-browser reading
    if (url.endsWith(".pdf")) {
      return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
    }

    return url;
  }

  // 3. Search & Filter
  function applyFilters() {
    const search = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const category = categoryFilter ? categoryFilter.value.toLowerCase() : "all";

    const filtered = allBooks.filter(b => {
      const matchTitle = (b.title || "").toLowerCase().includes(search);
      const matchAuthor = (b.author || "").toLowerCase().includes(search);
      const matchSearch = search === "" || matchTitle || matchAuthor;

      const matchCategory = category === "all" || (b.category || "").toLowerCase() === category;

      return matchSearch && matchCategory;
    });

    renderBooks(filtered);
  }

  if (searchInput) searchInput.addEventListener("input", applyFilters);
  if (categoryFilter) categoryFilter.addEventListener("change", applyFilters);

  function escapeHtml(str) {
    return String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  fetchBooks();
});
