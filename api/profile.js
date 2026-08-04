import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  try {
    const db = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    // Ensure profile columns exist
    const migrations = [
      `ALTER TABLE users ADD COLUMN first_name TEXT;`,
      `ALTER TABLE users ADD COLUMN last_name TEXT;`,
      `ALTER TABLE users ADD COLUMN educational_type TEXT DEFAULT 'secondary';`,
      `ALTER TABLE users ADD COLUMN class TEXT;`,
      `ALTER TABLE users ADD COLUMN course TEXT;`,
      `ALTER TABLE users ADD COLUMN level TEXT;`
    ];

    for (const sql of migrations) {
      try { await db.execute(sql); } catch (e) { /* Column exists */ }
    }

    // ==========================================
    // GET: FETCH EXACT USER PROFILE INFO
    // ==========================================
    if (req.method === "GET") {
      const { email } = req.query;

      if (!email) {
        return res.status(400).json({ success: false, error: "Email parameter is required." });
      }

      const userRes = await db.execute({
        sql: `SELECT id, email, first_name, last_name, educational_type, class, course, level FROM users WHERE LOWER(email) = LOWER(?)`,
        args: [email]
      });

      if (!userRes.rows || userRes.rows.length === 0) {
        return res.status(404).json({ success: false, error: "User profile not found." });
      }

      return res.status(200).json({ success: true, profile: userRes.rows[0] });
    }

    // ==========================================
    // POST: UPDATE PROFILE & OPTIONAL PASSWORD CHANGE
    // ==========================================
    if (req.method === "POST") {
      const { 
        email, 
        currentPassword, 
        newPassword,
        first_name, 
        last_name, 
        educational_type, 
        class: studentClass, 
        course, 
        level 
      } = req.body || {};

      if (!email || !currentPassword) {
        return res.status(400).json({ success: false, error: "Current password is required to save changes." });
      }

      // Fetch user account and current password hash
      const userRes = await db.execute({
        sql: `SELECT id, password_hash FROM users WHERE LOWER(email) = LOWER(?)`,
        args: [email]
      });

      if (!userRes.rows || userRes.rows.length === 0) {
        return res.status(404).json({ success: false, error: "User account not found." });
      }

      const user = userRes.rows[0];

      // Validate Current Password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash || "");
      if (!isPasswordValid) {
        return res.status(401).json({ success: false, error: "Incorrect current password." });
      }

      // Determine updated password hash (keep old hash if no new password is provided)
      let finalPasswordHash = user.password_hash;
      if (newPassword && newPassword.trim() !== "") {
        finalPasswordHash = await bcrypt.hash(newPassword, 10);
      }

      // Update database columns except email
      await db.execute({
        sql: `UPDATE users SET 
                first_name = ?, 
                last_name = ?, 
                educational_type = ?, 
                class = ?, 
                course = ?, 
                level = ?,
                password_hash = ?
              WHERE LOWER(email) = LOWER(?)`,
        args: [
          first_name || null,
          last_name || null,
          educational_type || "secondary",
          educational_type === "secondary" ? studentClass : null,
          educational_type === "tertiary" ? course : null,
          educational_type === "tertiary" ? level : null,
          finalPasswordHash,
          email
        ]
      });

      return res.status(200).json({ success: true, message: "Profile updated successfully!" });
    }

    return res.status(405).json({ success: false, error: "Method not allowed." });

  } catch (err) {
    console.error("Profile API Error:", err);
    return res.status(500).json({ success: false, error: err.message || "Internal server error." });
  }
}
