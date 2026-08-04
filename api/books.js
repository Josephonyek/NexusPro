import jwt from "jsonwebtoken";

// Load your secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || "your-fallback-jwt-secret";

/**
 * Helper to verify JWT token and ensure user has 'admin' role
 */
function authorizeAdmin(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw { status: 401, message: "Unauthorized access. No authorization token provided." };
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Enforce role check
    if (!decoded.role || String(decoded.role).toLowerCase() !== "admin") {
      throw { status: 403, message: "Forbidden: Admin privileges required to perform this action." };
    }

    return decoded; // Return decoded payload if valid admin
  } catch (err) {
    if (err.status) throw err;
    throw { status: 401, message: "Invalid or expired session token. Please log in again." };
  }
}

/**
 * Helper to parse incoming JSON request body
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
 * Main Vercel API Route Handler
 */
export default async function handler(req, res) {
  // Set CORS & Content-Type Headers
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const { method } = req;

    // ==========================================
    // 1. GET /api/admin-books -> Fetch all books
    // ==========================================
    if (method === "GET") {
      // Note: You can optionally verify student/admin token here if needed
      
      // SAMPLE DATA / DATABASE QUERY:
      // Replace with your database fetch (e.g., Turso/libSQL or Firebase)
      const books = [
        { id: "1", title: "Senior Secondary Physics", author: "P.N. Okeke", category: "Physics", classLevel: "SS1-SS3", available: true },
        { id: "2", title: "New School Chemistry", author: "Osei Yaw Ababio", category: "Chemistry", classLevel: "SS1-SS3", available: true },
        { id: "3", title: "Explicit Mathematics", author: "A. O. Kalejaiye", category: "Mathematics", classLevel: "SS1-SS3", available: false }
      ];

      return res.status(200).json({
        success: true,
        count: books.length,
        books
      });
    }

    // ====================================================================
    // ALL WRITE OPERATIONS BELOW REQUIRE ADMIN AUTHENTICATION (POST/PUT/DELETE)
    // ====================================================================
    const adminUser = authorizeAdmin(req);
    const body = await parseRequestBody(req);

    // ==========================================
    // 2. POST /api/admin-books -> Add a new book
    // ==========================================
    if (method === "POST") {
      const { title, author, category, classLevel, downloadUrl } = body;

      if (!title || !author) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields: Title and Author are required."
        });
      }

      const newBook = {
        id: String(Date.now()),
        title,
        author,
        category: category || "General",
        classLevel: classLevel || "All",
        downloadUrl: downloadUrl || "#",
        createdAt: new Date().toISOString(),
        createdBy: adminUser.email || adminUser.uid
      };

      // TODO: Insert 'newBook' into your Database (Turso / libSQL / Firebase)

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
      const { id, title, author, category, classLevel, available } = body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: "Book ID is required for updates."
        });
      }

      // TODO: Update the book record in your Database where id === body.id

      return res.status(200).json({
        success: true,
        message: `Book ID ${id} updated successfully!`,
        updatedFields: { title, author, category, classLevel, available }
      });
    }

    // ==========================================
    // 4. DELETE /api/admin-books -> Delete a book
    // ==========================================
    if (method === "DELETE") {
      // Support query string (?id=123) or JSON body ({ id: "123" })
      const id = req.query.id || body.id;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: "Book ID is required to delete a book."
        });
      }

      // TODO: Delete the book record from your Database where id === id

      return res.status(200).json({
        success: true,
        message: `Book ID ${id} deleted successfully.`
      });
    }

    // Handle Unsupported HTTP Methods
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
