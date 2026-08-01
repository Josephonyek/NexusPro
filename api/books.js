// Example Node.js handler using your DB client (e.g., @libsql/client for Turso)
import { createClient } from "@libsql/client";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export default async function handler(req, res) {
  const { action } = req.query;

  // 1. GET: Fetch all books for academy.html
  if (req.method === "GET" && action === "list-books") {
    try {
      const result = await db.execute("SELECT * FROM books ORDER BY id DESC");
      return res.status(200).json({ success: true, books: result.rows });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // 2. POST: Insert new book from admin_books.html
  if (req.method === "POST" && action === "upload-book") {
    try {
      const { title, author, category, fileUrl, coverUrl, created_at } = req.body;

      if (!title || !fileUrl) {
        return res.status(400).json({ success: false, error: "Title and File URL are required." });
      }

      await db.execute({
        sql: `INSERT INTO books (title, author, category, fileUrl, coverUrl, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
        args: [title, author, category, fileUrl, coverUrl, created_at || Date.now()]
      });

      return res.status(200).json({ success: true, message: "Book published successfully!" });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(400).json({ error: "Invalid action or request method." });
}
