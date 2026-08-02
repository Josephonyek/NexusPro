import { createClient } from "@libsql/client";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export default async function handler(req, res) {
  const { action } = req.query;

  // 1. GET: Fetch Books
  if (req.method === "GET" && action === "list-books") {
    try {
      const result = await db.execute("SELECT * FROM books ORDER BY id DESC");
      return res.status(200).json({ success: true, books: result.rows });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // 2. POST: Upload Book
  if (req.method === "POST" && action === "upload-book") {
    try {
      const { title, author, category, fileUrl, coverUrl, created_at } = req.body;
      await db.execute({
        sql: `INSERT INTO books (title, author, category, fileUrl, coverUrl, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
        args: [title, author, category, fileUrl, coverUrl, created_at || Date.now()]
      });
      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // 3. POST: Edit Book
  if (req.method === "POST" && action === "edit-book") {
    try {
      const { id, title, author, category, fileUrl, coverUrl } = req.body;
      await db.execute({
        sql: `UPDATE books SET title = ?, author = ?, category = ?, fileUrl = ?, coverUrl = ? WHERE id = ?`,
        args: [title, author, category, fileUrl, coverUrl, id]
      });
      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // 4. POST: Delete Book
  if (req.method === "POST" && action === "delete-book") {
    try {
      const { id } = req.body;
      await db.execute({
        sql: `DELETE FROM books WHERE id = ?`,
        args: [id]
      });
      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(400).json({ error: "Invalid action" });
}
