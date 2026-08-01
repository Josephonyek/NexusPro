import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Initialize Turso client with trimmed environment variables to avoid formatting 400 errors
const dbUrl = process.env.TURSO_DATABASE_URL ? process.env.TURSO_DATABASE_URL.trim() : "";
const dbToken = process.env.TURSO_AUTH_TOKEN ? process.env.TURSO_AUTH_TOKEN.trim() : "";
const JWT_SECRET = process.env.JWT_SECRET ? process.env.JWT_SECRET.trim() : "fallback_secret_key";

const db = createClient({
  url: dbUrl,
  authToken: dbToken,
});

export default async function handler(req, res) {
  // Global CORS Headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle browser preflight request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { action } = req.query;

  try {
    // ================= 1. SIGN UP =================
    if (action === "signup") {
      if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

      const { firstName, lastName, email, password, educationType, studentClass, course, level } = req.body || {};

      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ error: "Missing required registration fields." });
      }

      const cleanEmail = email.trim().toLowerCase();

      // Check if user already exists
      const existing = await db.execute({
        sql: "SELECT id FROM users WHERE LOWER(email) = ? LIMIT 1",
        args: [cleanEmail]
      });

      if (existing.rows.length > 0) {
        return res.status(400).json({ error: "An account with this email already exists." });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);
      const userId = "usr_" + Math.random().toString(36).substring(2, 11);
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const defaultRole = "student";

      // Insert new user record
      await db.execute({
        sql: `INSERT INTO users (id, name, first_name, last_name, email, password_hash, role, education_type, class, course, level, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          userId,
          fullName,
          firstName.trim(),
          lastName.trim(),
          cleanEmail,
          passwordHash,
          defaultRole,
          educationType || null,
          studentClass || null,
          course || null,
          level || null,
          Date.now()
        ]
      });

      // Issue JWT token containing assigned role
      const token = jwt.sign(
        { uid: userId, email: cleanEmail, role: defaultRole, name: fullName },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.status(200).json({
        success: true,
        token,
        user: { uid: userId, name: fullName, email: cleanEmail, role: defaultRole }
      });
    }

    // ================= 2. LOG IN =================
    if (action === "login") {
      if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

      const { email, password } = req.body || {};

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
      }

      const cleanEmail = email.trim().toLowerCase();

      // Query database for user including the live role column
      const result = await db.execute({
        sql: "SELECT id, name, email, password_hash, role FROM users WHERE LOWER(email) = ? LIMIT 1",
        args: [cleanEmail]
      });

      if (result.rows.length === 0) {
        return res.status(401).json({ error: "Invalid email or password." });
      }

      const user = result.rows[0];
      const validPassword = await bcrypt.compare(password, String(user.password_hash));

      if (!validPassword) {
        return res.status(401).json({ error: "Invalid email or password." });
      }

      const userRole = String(user.role || "student").toLowerCase();

      // Generate FRESH JWT session token with updated DB role
      const token = jwt.sign(
        { 
          uid: String(user.id), 
          email: String(user.email), 
          role: userRole, 
          name: String(user.name) 
        },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.status(200).json({
        success: true,
        token,
        user: { 
          uid: String(user.id), 
          name: String(user.name), 
          email: String(user.email),
          role: userRole 
        }
      });
    }

    // ================= 3. VERIFY SESSION =================
    if (action === "verify") {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ authenticated: false, error: "Missing authorization token" });
      }

      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET);

      return res.status(200).json({ authenticated: true, user: decoded });
    }

    return res.status(400).json({ error: "Invalid API action requested." });

  } catch (error) {
    console.error("User Auth API Error:", error);
    return res.status(500).json({ error: error.message || "Internal server error." });
  }
}
