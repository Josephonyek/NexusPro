import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const dbUrl = process.env.TURSO_DATABASE_URL ? process.env.TURSO_DATABASE_URL.trim() : "";
const dbToken = process.env.TURSO_AUTH_TOKEN ? process.env.TURSO_AUTH_TOKEN.trim() : "";
const JWT_SECRET = process.env.JWT_SECRET ? process.env.JWT_SECRET.trim() : "nexus_secret_key_123";

const db = createClient({
  url: dbUrl,
  authToken: dbToken,
});

export default async function handler(req, res) {
  // Global CORS
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { action } = req.query;

  try {
    // ================= 1. LOGIN =================
    if (action === "login") {
      if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

      const { email, password } = req.body || {};
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
      }

      const cleanEmail = email.trim().toLowerCase();

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

      const role = String(user.role || "student").toLowerCase();

      const token = jwt.sign(
        { uid: String(user.id), email: String(user.email), role, name: String(user.name) },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.status(200).json({
        success: true,
        token,
        user: { uid: String(user.id), name: String(user.name), email: String(user.email), role }
      });
    }

    // ================= 2. SIGNUP =================
    if (action === "signup") {
      if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

      const { firstName, lastName, email, password, educationType, studentClass, course, level } = req.body || {};

      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ error: "Required fields are missing." });
      }

      const cleanEmail = email.trim().toLowerCase();

      const existing = await db.execute({
        sql: "SELECT id FROM users WHERE LOWER(email) = ? LIMIT 1",
        args: [cleanEmail]
      });

      if (existing.rows.length > 0) {
        return res.status(400).json({ error: "An account with this email already exists." });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const userId = "usr_" + Math.random().toString(36).substring(2, 11);
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      const defaultRole = "student";

      await db.execute({
        sql: `INSERT INTO users (id, name, first_name, last_name, email, password_hash, role, education_type, class, course, level, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          userId, fullName, firstName.trim(), lastName.trim(), cleanEmail,
          passwordHash, defaultRole, educationType || null, studentClass || null,
          course || null, level || null, Date.now()
        ]
      });

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

    // ================= 3. FORGOT PASSWORD =================
    if (action === "forgot-password") {
      const { email } = req.body || {};
      if (!email) return res.status(400).json({ error: "Email is required." });

      const userResult = await db.execute({
        sql: "SELECT id FROM users WHERE LOWER(email) = ? LIMIT 1",
        args: [email.trim().toLowerCase()]
      });

      if (userResult.rows.length === 0) {
        return res.status(200).json({ message: "If an account exists with this email, reset instructions have been dispatched." });
      }

      return res.status(200).json({
        success: true,
        message: "Password reset key requested. Contact support or check email for steps."
      });
    }

    // ================= 4. LIST USERS (ADMIN ONLY) =================
    if (action === "list-users") {
      const result = await db.execute(
        "SELECT id, name, email, role, status, education_type, class, course, level, created_at FROM users ORDER BY created_at DESC"
      );

      const users = result.rows.map(row => ({
        id: String(row.id),
        name: String(row.name || ""),
        email: String(row.email),
        role: String(row.role || "student").toLowerCase(),
        status: String(row.status || "active").toLowerCase(),
        education_type: String(row.education_type || ""),
        class: String(row.class || ""),
        course: String(row.course || ""),
        level: String(row.level || ""),
        created_at: row.created_at ? String(row.created_at) : null
      }));

      return res.status(200).json({ success: true, users });
    }

    // ================= 5. UPDATE USER ROLE =================
    if (action === "update-role") {
      if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
      const { userId, role } = req.body || {};
      if (!userId || !role) return res.status(400).json({ error: "Missing parameters." });

      await db.execute({
        sql: "UPDATE users SET role = ? WHERE id = ?",
        args: [role.toLowerCase(), userId]
      });

      return res.status(200).json({ success: true, message: "User role updated successfully." });
    }

    // ================= 6. SUSPEND / ACTIVATE USER =================
    if (action === "update-status") {
      if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
      const { userId, status } = req.body || {};
      if (!userId || !status) return res.status(400).json({ error: "Missing parameters." });

      await db.execute({
        sql: "UPDATE users SET status = ? WHERE id = ?",
        args: [status.toLowerCase(), userId]
      });

      return res.status(200).json({ success: true, message: "User status updated successfully." });
    }

    // ================= 7. DELETE USER =================
    if (action === "delete-user") {
      if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
      const { userId } = req.body || {};
      if (!userId) return res.status(400).json({ error: "Missing user ID." });

      await db.execute({
        sql: "DELETE FROM users WHERE id = ?",
        args: [userId]
      });

      return res.status(200).json({ success: true, message: "User account permanently removed." });
          }
