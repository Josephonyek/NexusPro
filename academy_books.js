document.addEventListener("DOMContentLoaded", () => {
  const API_ENDPOINT = "/api/books.js";
  const booksGrid = document.getElementById("booksGrid");
  const searchInput = document.getElementById("searchBookInput");
  const categoryFilter = document.getElementById("categoryFilter");

  let allBooks = [];

  // 1. Fetch Books
  async function fetchBooks() {
    try {
      const res = await fetch(`${API_ENDPOINT}?action=list-books`);
      if (!res.ok) throw new Error("Server error");

      const data = await res.json();
      allBooks = data.books || (Array.isArray(data) ? data : []);

      renderBooks(allBooks);
    } catch (err) {
      console.error("Fetch books error:", err);
      if (booksGrid) {
        booksGrid.innerHTML = `
          <div class="empty-state" style="color: #ef4444;">
            <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 10px;"></i>
            <p>Could not load library contents. Please check your connection.</p>
          </div>
        `;
      }
    }
  }

  // 2. Render Grid
  function renderBooks(books) {
    if (!booksGrid) return;

    if (!books || books.length === 0) {
      booksGrid.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-folder-open" style="font-size: 2.5rem; margin-bottom: 12px;"></i>
          <p>No books found matching your criteria.</p>
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
          <a href="${escapeHtml(book.fileUrl)}" target="_blank" rel="noopener noreferrer" class="btn-read">
            <i class="fas fa-file-pdf"></i> Access Resource
          </a>
        </div>
      </div>
    `).join("");
  }

  // 3. Search & Filter Engine
  function applyFilters() {
    const search = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const category = categoryFilter ? categoryFilter.value.toLowerCase() : "all";

    const filtered = allBooks.filter(b => {
      const titleMatch = (b.title || "").toLowerCase().includes(search);
      const authorMatch = (b.author || "").toLowerCase().includes(search);
      const matchesSearch = search === "" || titleMatch || authorMatch;

      const matchesCategory = category === "all" || (b.category || "").toLowerCase() === category;

      return matchesSearch && matchesCategory;
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
