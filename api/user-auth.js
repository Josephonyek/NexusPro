import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key";

export default async function handler(req, res) {
  const { action } = req.query;

  try {
    // ========== SIGN UP ==========
    if (action === "signup") {
      const { firstName, lastName, email, password, educationType, studentClass, course, level } = req.body;

      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ error: "Missing required fields." });
      }

      // Check if user exists
      const existing = await db.execute({
        sql: "SELECT id FROM users WHERE email = ? LIMIT 1",
        args: [email]
      });

      if (existing.rows.length > 0) {
        return res.status(400).json({ error: "Email is already registered." });
      }

      // Hash password & insert user
      const passwordHash = await bcrypt.hash(password, 10);
      const userId = "usr_" + Math.random().toString(36).substring(2, 11);
      const fullName = `${firstName} ${lastName}`.trim();

      await db.execute({
        sql: `INSERT INTO users (id, name, first_name, last_name, email, password_hash, role, education_type, class, course, level, created_at)
              VALUES (?, ?, ?, ?, ?, ?, 'student', ?, ?, ?, ?, ?)`,
        args: [userId, fullName, firstName, lastName, email, passwordHash, educationType || null, studentClass || null, course || null, level || null, Date.now()]
      });

      // Generate session token
      const token = jwt.sign({ uid: userId, email, role: "student", name: fullName }, JWT_SECRET, { expiresIn: "7d" });

      return res.status(200).json({ success: true, token, user: { uid: userId, name: fullName, role: "student" } });
    }

    // ========== LOGIN ==========
    if (action === "login") {
      const { email, password } = req.body;

      const result = await db.execute({
        sql: "SELECT * FROM users WHERE email = ? LIMIT 1",
        args: [email]
      });

      if (result.rows.length === 0) {
        return res.status(401).json({ error: "Invalid email or password." });
      }

      const user = result.rows[0];
      const validPassword = await bcrypt.compare(password, user.password_hash);

      if (!validPassword) {
        return res.status(401).json({ error: "Invalid email or password." });
      }

      // Generate session token
      const token = jwt.sign({ uid: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: "7d" });

      return res.status(200).json({ success: true, token, user: { uid: user.id, name: user.name, role: user.role } });
    }

    // ========== VERIFY SESSION ==========
    if (action === "verify") {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ authenticated: false });

      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET);

      return res.status(200).json({ authenticated: true, user: decoded });
    }

    return res.status(400).json({ error: "Invalid action parameter." });

  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
                                   }
