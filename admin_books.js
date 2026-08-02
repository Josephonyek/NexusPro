document.addEventListener("DOMContentLoaded", () => {
  const API_ENDPOINT = "/api/books.js";
  const uploadForm = document.getElementById("bookUploadForm");
  const adminTableBody = document.getElementById("adminBooksTableBody");
  
  const progressContainer = document.getElementById("progressContainer");
  const progressBar = document.getElementById("progressBar");
  const submitBtn = document.getElementById("submitBtn");
  const cancelEditBtn = document.getElementById("cancelEditBtn");

  let booksList = [];

  // ================= 1. FETCH & RENDER BOOKS =================
  window.loadAdminBooks = async function() {
    try {
      const res = await fetch(`${API_ENDPOINT}?action=list-books`);
      if (!res.ok) throw new Error("Failed to load");
      
      const data = await res.json();
      booksList = data.books || (Array.isArray(data) ? data : []);
      renderAdminTable(booksList);
    } catch (err) {
      adminTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--danger);">Failed to load books database.</td></tr>`;
    }
  };

  function renderAdminTable(books) {
    if (!books || books.length === 0) {
      adminTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--text-muted);">No books published yet.</td></tr>`;
      return;
    }

    adminTableBody.innerHTML = books.map(book => `
      <tr>
        <td><strong>${escapeHtml(book.title)}</strong></td>
        <td><span style="color: var(--accent-blue); font-size: 0.75rem;">${escapeHtml(book.category || "General")}</span></td>
        <td>${escapeHtml(book.author || "Unknown")}</td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button class="btn-action warn" onclick="editBook('${book.id}')"><i class="fas fa-edit"></i> Edit</button>
            <button class="btn-action danger" onclick="deleteBook('${book.id}')"><i class="fas fa-trash"></i> Delete</button>
          </div>
        </td>
      </tr>
    `).join("");
  }

  // ================= 2. FAST UPLOAD WITH PROGRESS BAR =================
  if (uploadForm) {
    uploadForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const editId = document.getElementById("editBookId").value;
      const title = document.getElementById("bookTitle").value.trim();
      const author = document.getElementById("bookAuthor").value.trim() || "Unknown Author";
      const category = document.getElementById("bookCategory").value;
      const fileUrl = document.getElementById("bookFileUrl").value.trim();
      const coverUrl = document.getElementById("bookCoverUrl").value.trim() || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&q=80";

      const payload = {
        id: editId || undefined,
        title, author, category, fileUrl, coverUrl,
        created_at: Date.now()
      };

      const action = editId ? "edit-book" : "upload-book";

      // Show Progress Bar
      progressContainer.style.display = "block";
      progressBar.style.width = "10%";
      submitBtn.disabled = true;

      // Simulated smooth progress for fast feel
      let progress = 10;
      const interval = setInterval(() => {
        if (progress < 85) {
          progress += 15;
          progressBar.style.width = `${progress}%`;
        }
      }, 80);

      const token = localStorage.getItem("nexusToken") || localStorage.getItem("token") || "";

      // Perform Fetch
      fetch(`${API_ENDPOINT}?action=${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
      .then(res => res.json())
      .then(data => {
        clearInterval(interval);
        progressBar.style.width = "100%";

        setTimeout(() => {
          if (!data.success) throw new Error(data.error || "Operation failed");
          alert(editId ? "Book updated successfully!" : "Book published successfully!");
          resetForm();
          loadAdminBooks();
        }, 200);
      })
      .catch(err => {
        clearInterval(interval);
        alert("Error: " + err.message);
      })
      .finally(() => {
        setTimeout(() => {
          progressContainer.style.display = "none";
          progressBar.style.width = "0%";
          submitBtn.disabled = false;
        }, 300);
      });
    });
  }

  // ================= 3. EDIT & DELETE ACTIONS =================
  window.editBook = function(id) {
    const book = booksList.find(b => String(b.id) === String(id));
    if (!book) return;

    document.getElementById("editBookId").value = book.id;
    document.getElementById("bookTitle").value = book.title;
    document.getElementById("bookAuthor").value = book.author;
    document.getElementById("bookCategory").value = book.category;
    document.getElementById("bookFileUrl").value = book.fileUrl;
    document.getElementById("bookCoverUrl").value = book.coverUrl;

    document.getElementById("formTitle").innerHTML = `<i class="fas fa-edit" style="color: var(--warning);"></i> Edit Book`;
    submitBtn.innerHTML = `<i class="fas fa-save"></i> Save Changes`;
    cancelEditBtn.style.display = "inline-flex";

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  window.deleteBook = async function(id) {
    if (!confirm("Are you sure you want to delete this book?")) return;

    try {
      const token = localStorage.getItem("nexusToken") || localStorage.getItem("token") || "";
      const res = await fetch(`${API_ENDPOINT}?action=delete-book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ id })
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to delete");

      loadAdminBooks();
    } catch (err) {
      alert("Error deleting book: " + err.message);
    }
  };

  window.resetForm = function() {
    uploadForm.reset();
    document.getElementById("editBookId").value = "";
    document.getElementById("formTitle").innerHTML = `<i class="fas fa-book-medical" style="color: var(--accent-blue);"></i> Add New Book`;
    submitBtn.innerHTML = `<i class="fas fa-upload"></i> Publish to Academy`;
    cancelEditBtn.style.display = "none";
  };

  function escapeHtml(str) {
    return String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  loadAdminBooks();
});
