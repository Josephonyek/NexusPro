import { createClient } from "@libsql/client";
import jwt from "jsonwebtoken";

// Initialize Turso DB connection
const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const JWT_SECRET = process.env.JWT_SECRET || "your-fallback-jwt-secret";

/**
 * Helper function to verify JWT token and ensure user has 'admin' role
 */
function authorizeAdmin(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw { status: 401, message: "Unauthorized access. Authorization token required." };
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (!decoded.role || String(decoded.role).toLowerCase() !== "admin") {
      throw { status: 403, message: "Forbidden: Admin privileges required." };
    }

    return decoded;
  } catch (err) {
    if (err.status) throw err;
    throw { status: 401, message: "Invalid or expired session token." };
  }
}

/**
 * Helper to safely parse JSON body
 */
async function parseRequestBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
  });
}

/**
 * Main API Route Handler
 */
export default async function handler(req, res) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const { method } = req;

    // =========================================================
    // 1. GET /api/admin-books -> Retrieve books from Turso DB
    // =========================================================
    if (method === "GET") {
      const selectedCategory = req.query.category || "all";

      let query = "SELECT id, title, author, category, fileUrl, coverUrl, created_at FROM books";
      let params = [];

      // Filter by category if requested (and not 'all')
      if (selectedCategory.toLowerCase() !== "all") {
        query += " WHERE LOWER(category) = LOWER(?)";
        params.push(selectedCategory);
      }

      query += " ORDER BY created_at DESC";

      // Execute Turso Query
      const result = await db.execute({ sql: query, args: params });

      // Fetch all unique categories available in DB for dropdown filters
      const categoriesResult = await db.execute("SELECT DISTINCT category FROM books");
      const categories = categoriesResult.rows.map((row) => row.category).filter(Boolean);

      return res.status(200).json({
        success: true,
        count: result.rows.length,
        categories: ["all", ...categories],
        books: result.rows
      });
    }

    // ====================================================================
    // ALL WRITE OPERATIONS (POST, PUT, DELETE) REQUIRE ADMIN AUTHORIZATION
    // ====================================================================
    authorizeAdmin(req);
    const body = await parseRequestBody(req);

    // =========================================================
    // 2. POST /api/admin-books -> Insert new book into Turso DB
    // =========================================================
    if (method === "POST") {
      const { title, author, category, fileUrl, coverUrl } = body;

      if (!title || !author || !fileUrl) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields: Title, Author, and File URL are required."
        });
      }

      const created_at = new Date().toISOString();
      const bookCategory = category ? category.trim() : "General";
      const bookCoverUrl = coverUrl ? coverUrl.trim() : "";

      const insertResult = await db.execute({
        sql: `INSERT INTO books (title, author, category, fileUrl, coverUrl, created_at) 
              VALUES (?, ?, ?, ?, ?, ?) RETURNING id`,
        args: [title.trim(), author.trim(), bookCategory, fileUrl.trim(), bookCoverUrl, created_at]
      });

      const newId = insertResult.rows[0]?.id || null;

      return res.status(201).json({
        success: true,
        message: "Book added to database successfully!",
        book: {
          id: newId,
          title: title.trim(),
          author: author.trim(),
          category: bookCategory,
          fileUrl: fileUrl.trim(),
          coverUrl: bookCoverUrl,
          created_at
        }
      });
    }

    // =========================================================
    // 3. PUT /api/admin-books -> Update book in Turso DB
    // =========================================================
    if (method === "PUT") {
      const { id, title, author, category, fileUrl, coverUrl } = body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: "Book ID is required for updates."
        });
      }

      await db.execute({
        sql: `UPDATE books 
              SET title = ?, author = ?, category = ?, fileUrl = ?, coverUrl = ? 
              WHERE id = ?`,
        args: [title, author, category, fileUrl, coverUrl, id]
      });

      return res.status(200).json({
        success: true,
        message: `Book ID ${id} updated successfully!`,
        updatedFields: { id, title, author, category, fileUrl, coverUrl }
      });
    }

    // =========================================================
    // 4. DELETE /api/admin-books -> Delete book from Turso DB
    // =========================================================
    if (method === "DELETE") {
      const id = req.query.id || body.id;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: "Book ID is required to delete a book."
        });
      }

      await db.execute({
        sql: "DELETE FROM books WHERE id = ?",
        args: [id]
      });

      return res.status(200).json({
        success: true,
        message: `Book ID ${id} deleted successfully.`
      });
    }

    // Method Not Allowed
    res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
    return res.status(405).json({
      success: false,
      error: `Method ${method} Not Allowed.`
    });

  } catch (error) {
    console.error("Admin Books API Error:", error);

    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      success: false,
      error: error.message || "Internal Server Error"
    });
  }
}
