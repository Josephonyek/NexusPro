document.addEventListener("DOMContentLoaded", () => {
  const API_ENDPOINT = "/api/books.js";
  const uploadForm = document.getElementById("bookUploadForm");

  if (uploadForm) {
    uploadForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const submitBtn = document.getElementById("submitBtn");
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Uploading...`;

      const title = document.getElementById("bookTitle").value.trim();
      const author = document.getElementById("bookAuthor").value.trim() || "Unknown Author";
      const category = document.getElementById("bookCategory").value;
      const fileUrl = document.getElementById("bookFileUrl").value.trim();
      const coverUrl = document.getElementById("bookCoverUrl").value.trim() || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&q=80";

      const payload = { title, author, category, fileUrl, coverUrl, created_at: Date.now() };

      try {
        const token = localStorage.getItem("nexusToken") || localStorage.getItem("token") || "";
        const res = await fetch(`${API_ENDPOINT}?action=upload-book`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || "Failed to upload");

        alert("Book added successfully!");
        uploadForm.reset();
      } catch (err) {
        alert("Upload failed: " + err.message);
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="fas fa-upload"></i> Publish to Academy`;
      }
    });
  }
});
