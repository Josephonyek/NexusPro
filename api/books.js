import jwt from "jsonwebtoken";

// Load JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || "your-fallback-jwt-secret";

/**
 * Helper function to verify JWT token and ensure user has 'admin' role
 */
function authorizeAdmin(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw { status: 401, message: "Unauthorized access. No authorization token provided." };
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Enforce role check for admin
    if (!decoded.role || String(decoded.role).toLowerCase() !== "admin") {
      throw { status: 403, message: "Forbidden: Admin privileges required to perform this action." };
    }

    return decoded;
  } catch (err) {
    if (err.status) throw err;
    throw { status: 401, message: "Invalid or expired session token. Please log in again." };
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

    // ==========================================
    // 1. GET /api/admin-books -> Fetch books for reader/admin
    // ==========================================
    if (method === "GET") {
      /* 
         DB QUERY EXAMPLE (Turso / libSQL):
         const { rows } = await db.execute("SELECT id, title, author, category, fileUrl, coverUrl, created_at FROM books ORDER BY created_at DESC");
      */

      // Sample structure returning exact DB columns
      const books = [
        {
          id: 1,
          title: "Senior Secondary Physics",
          author: "P.N. Okeke",
          category: "Physics",
          fileUrl: "https://your-storage-provider.com/pdfs/physics.pdf",
          coverUrl: "https://your-storage-provider.com/covers/physics.jpg",
          created_at: new Date().toISOString()
        }
      ];

      return res.status(200).json({
        success: true,
        count: books.length,
        books
      });
    }

    // ====================================================================
    // ALL WRITE OPERATIONS (POST, PUT, DELETE) REQUIRE ADMIN AUTHORIZATION
    // ====================================================================
    authorizeAdmin(req);
    const body = await parseRequestBody(req);

    // ==========================================
    // 2. POST /api/admin-books -> Add a new book
    // ==========================================
    if (method === "POST") {
      const { title, author, category, fileUrl, coverUrl } = body;

      // Validation
      if (!title || !author || !fileUrl) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields: Title, Author, and File URL are required."
        });
      }

      const newBook = {
        title: title.trim(),
        author: author.trim(),
        category: category ? category.trim() : "General",
        fileUrl: fileUrl.trim(),
        coverUrl: coverUrl ? coverUrl.trim() : "",
        created_at: new Date().toISOString()
      };

      /*
         DB INSERT EXAMPLE (Turso / libSQL):
         await db.execute({
           sql: "INSERT INTO books (title, author, category, fileUrl, coverUrl, created_at) VALUES (?, ?, ?, ?, ?, ?)",
           args: [newBook.title, newBook.author, newBook.category, newBook.fileUrl, newBook.coverUrl, newBook.created_at]
         });
      */

      return res.status(201).json({
        success: true,
        message: "Book added successfully!",
        book: newBook
      });
    }

    // ==========================================
    // 3. PUT /api/admin-books -> Update a book
    // ==========================================
    if (method === "PUT") {
      const { id, title, author, category, fileUrl, coverUrl } = body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: "Book ID is required for updates."
        });
      }

      /*
         DB UPDATE EXAMPLE (Turso / libSQL):
         await db.execute({
           sql: "UPDATE books SET title = ?, author = ?, category = ?, fileUrl = ?, coverUrl = ? WHERE id = ?",
           args: [title, author, category, fileUrl, coverUrl, id]
         });
      */

      return res.status(200).json({
        success: true,
        message: `Book ID ${id} updated successfully!`,
        updatedFields: { id, title, author, category, fileUrl, coverUrl }
      });
    }

    // ==========================================
    // 4. DELETE /api/admin-books -> Delete a book
    // ==========================================
    if (method === "DELETE") {
      const id = req.query.id || body.id;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: "Book ID is required to delete a book."
        });
      }

      /*
         DB DELETE EXAMPLE (Turso / libSQL):
         await db.execute({
           sql: "DELETE FROM books WHERE id = ?",
           args: [id]
         });
      */

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
